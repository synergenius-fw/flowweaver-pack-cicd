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
