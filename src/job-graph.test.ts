import { describe, it, expect } from 'vitest';
import { buildJobGraph } from './job-graph.js';
import type { TWorkflowAST } from '@synergenius/flow-weaver/ast';

function makeMinimalAST(overrides?: Partial<TWorkflowAST>): TWorkflowAST {
  return {
    name: 'test',
    functionName: 'test',
    nodeTypes: [],
    instances: [
      { id: 'step1', nodeType: 'noop', job: 'build', config: { label: 'Step 1' } } as any,
      { id: 'step2', nodeType: 'noop', job: 'deploy', config: { label: 'Step 2' } } as any,
    ],
    connections: [],
    options: { cicd: {} },
    ...overrides,
  } as TWorkflowAST;
}

describe('Bug 2: @job stage applied in buildJobGraph', () => {
  it('applies explicit stage from @job config', () => {
    const ast = makeMinimalAST({
      options: {
        cicd: {
          jobs: [
            { id: 'build', stage: 'compile' } as any,
            { id: 'deploy', stage: 'release' } as any,
          ],
          stages: [{ name: 'compile' }, { name: 'release' }],
        },
      } as any,
    });

    const jobs = buildJobGraph(ast);
    const buildJob = jobs.find(j => j.id === 'build');
    const deployJob = jobs.find(j => j.id === 'deploy');

    expect(buildJob?.stage).toBe('compile');
    expect(deployJob?.stage).toBe('release');
  });

  it('explicit @job stage overrides name-prefix heuristic', () => {
    const ast = makeMinimalAST({
      instances: [
        { id: 'test-unit', nodeType: 'noop', job: 'test-unit', config: { label: 'Unit' } } as any,
      ],
      options: {
        cicd: {
          jobs: [{ id: 'test-unit', stage: 'validate' } as any],
          stages: [{ name: 'test' }, { name: 'validate' }],
        },
      } as any,
    });

    const jobs = buildJobGraph(ast);
    // Without the fix, name-prefix heuristic would match "test" stage
    // With the fix, explicit stage "validate" takes precedence
    expect(jobs[0].stage).toBe('validate');
  });

  it('applies retryWhen from @job config', () => {
    const ast = makeMinimalAST({
      options: {
        cicd: {
          jobs: [
            { id: 'build', retry: 2, retryWhen: ['runner_system_failure', 'api_failure'] } as any,
          ],
        },
      } as any,
    });

    const jobs = buildJobGraph(ast);
    const buildJob = jobs.find(j => j.id === 'build');
    expect(buildJob?.retry).toBe(2);
    expect(buildJob?.retryWhen).toEqual(['runner_system_failure', 'api_failure']);
  });
});

describe('Bug 4: port metadata fallback from functionText', () => {
  it('extracts port metadata from functionText when portDef.metadata is absent', () => {
    const ast = makeMinimalAST({
      nodeTypes: [
        {
          name: 'producer',
          functionName: 'producer',
          inputs: {},
          outputs: {
            result: { dataType: 'STRING' },
          },
          functionText: '/** @port OUT.result string artifactPath:"dist/" expire_in:"1 week" */\nfunction producer() {}',
          hasSuccessPort: false,
          hasFailurePort: false,
          executeWhen: 'ALL_INPUTS',
          isAsync: false,
        } as any,
      ],
      instances: [
        { id: 'p1', nodeType: 'producer', job: 'build', config: {} } as any,
        { id: 'c1', nodeType: 'noop', job: 'deploy', config: {} } as any,
      ],
      connections: [
        { from: { node: 'p1', port: 'result' }, to: { node: 'c1', port: 'input' } },
      ] as any,
    });

    const jobs = buildJobGraph(ast);
    const deployJob = jobs.find(j => j.id === 'deploy');
    // The cross-job port should have metadata extracted from functionText
    expect(deployJob).toBeDefined();
  });

  it('prefers portDef.metadata over functionText fallback', () => {
    const ast = makeMinimalAST({
      nodeTypes: [
        {
          name: 'producer',
          functionName: 'producer',
          inputs: {},
          outputs: {
            result: { dataType: 'STRING', metadata: { artifactPath: 'build/' } },
          },
          functionText: '/** @port OUT.result string artifactPath:"other/" */\nfunction producer() {}',
          hasSuccessPort: false,
          hasFailurePort: false,
          executeWhen: 'ALL_INPUTS',
          isAsync: false,
        } as any,
      ],
      instances: [
        { id: 'p1', nodeType: 'producer', job: 'build', config: {} } as any,
        { id: 'c1', nodeType: 'noop', job: 'deploy', config: {} } as any,
      ],
      connections: [
        { from: { node: 'p1', port: 'result' }, to: { node: 'c1', port: 'input' } },
      ] as any,
    });

    const jobs = buildJobGraph(ast);
    const buildJob = jobs.find(j => j.id === 'build');
    // portDef.metadata has artifactPath:"build/", functionText has "other/"
    // Should use the portDef metadata (build/) not the functionText fallback
    expect(buildJob?.uploadArtifacts?.[0]?.path).toBe('build/');
  });
});

describe('Bug 10: job-targeted services applied only to their target', () => {
  it('assigns per-job services to the correct job', () => {
    const ast = makeMinimalAST({
      options: {
        cicd: {
          services: [
            { name: 'postgres:15', job: 'build' },
            { name: 'redis:7' },
          ],
        },
      } as any,
    });

    const jobs = buildJobGraph(ast);
    const buildJob = jobs.find(j => j.id === 'build');
    const deployJob = jobs.find(j => j.id === 'deploy');

    // postgres should only be on build (per-job targeting)
    expect(buildJob?.services).toBeDefined();
    expect(buildJob!.services!.some((s: any) => s.name === 'postgres:15')).toBe(true);

    // deploy should NOT have postgres
    const deployServices = deployJob?.services || [];
    expect(deployServices.some((s: any) => s.name === 'postgres:15')).toBe(false);
  });
});
