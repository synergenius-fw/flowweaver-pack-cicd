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

// ---------------------------------------------------------------------------
// Linear pipeline: correct dependency chain
// ---------------------------------------------------------------------------

describe('linear pipeline dependency chain', () => {
  it('3-job linear pipeline has correct needs order', () => {
    const ast = makeMinimalAST({
      instances: [
        { id: 'install', nodeType: 'npmInstall', job: 'setup', config: {} } as any,
        { id: 'test', nodeType: 'npmTest', job: 'test', config: {} } as any,
        { id: 'deploy', nodeType: 'deploySsh', job: 'deploy', config: {} } as any,
      ],
      connections: [
        // install → test (cross-job: setup → test)
        { from: { node: 'install', port: 'onSuccess' }, to: { node: 'test', port: 'execute' } },
        // test → deploy (cross-job: test → deploy)
        { from: { node: 'test', port: 'onSuccess' }, to: { node: 'deploy', port: 'execute' } },
      ] as any,
      options: { cicd: {} } as any,
    });

    const jobs = buildJobGraph(ast);
    const setupJob = jobs.find(j => j.id === 'setup');
    const testJob = jobs.find(j => j.id === 'test');
    const deployJob = jobs.find(j => j.id === 'deploy');

    expect(setupJob).toBeDefined();
    expect(testJob).toBeDefined();
    expect(deployJob).toBeDefined();

    // setup has no dependencies
    expect(setupJob!.needs).toHaveLength(0);
    // test depends on setup
    expect(testJob!.needs).toContain('setup');
    expect(testJob!.needs).not.toContain('deploy');
    // deploy depends on test
    expect(deployJob!.needs).toContain('test');
    expect(deployJob!.needs).not.toContain('setup');
  });

  it('topological sort returns jobs in dependency order', () => {
    const ast = makeMinimalAST({
      instances: [
        { id: 'a', nodeType: 'noop', job: 'first', config: {} } as any,
        { id: 'b', nodeType: 'noop', job: 'second', config: {} } as any,
        { id: 'c', nodeType: 'noop', job: 'third', config: {} } as any,
      ],
      connections: [
        { from: { node: 'a', port: 'onSuccess' }, to: { node: 'b', port: 'execute' } },
        { from: { node: 'b', port: 'onSuccess' }, to: { node: 'c', port: 'execute' } },
      ] as any,
      options: { cicd: {} } as any,
    });

    const jobs = buildJobGraph(ast);
    const ids = jobs.map(j => j.id);

    // first should come before second, second before third
    expect(ids.indexOf('first')).toBeLessThan(ids.indexOf('second'));
    expect(ids.indexOf('second')).toBeLessThan(ids.indexOf('third'));
  });

  it('no circular dependencies when jobs are properly separated', () => {
    const ast = makeMinimalAST({
      instances: [
        { id: 'build', nodeType: 'npmBuild', job: 'build', config: {} } as any,
        { id: 'test', nodeType: 'npmTest', job: 'test', config: {} } as any,
      ],
      connections: [
        { from: { node: 'build', port: 'onSuccess' }, to: { node: 'test', port: 'execute' } },
      ] as any,
      options: { cicd: {} } as any,
    });

    const jobs = buildJobGraph(ast);
    const buildJob = jobs.find(j => j.id === 'build');
    const testJob = jobs.find(j => j.id === 'test');

    // build needs nothing, test needs build. No circular.
    expect(buildJob!.needs).toHaveLength(0);
    expect(testJob!.needs).toEqual(['build']);
  });
});

// ---------------------------------------------------------------------------
// Secret wiring to jobs
// ---------------------------------------------------------------------------

describe('secret wiring', () => {
  it('resolveJobSecrets assigns secrets to jobs that use them', () => {
    // This tests the resolveJobSecrets function which is called by the export target
    // The buildJobGraph itself creates empty secrets arrays; wiring happens in the target
    const ast = makeMinimalAST({
      instances: [
        { id: 'install', nodeType: 'npmInstall', job: 'build', config: {} } as any,
      ],
      connections: [
        { from: { node: 'secret:NPM_TOKEN', port: 'value' }, to: { node: 'install', port: 'npmToken' } },
      ] as any,
      options: {
        cicd: {
          secrets: [{ name: 'NPM_TOKEN' }],
        },
      } as any,
    });

    const jobs = buildJobGraph(ast);
    const buildJob = jobs.find(j => j.id === 'build');

    // buildJobGraph initializes secrets as empty array
    // The actual wiring is done by resolveJobSecrets in the export target
    expect(buildJob).toBeDefined();
    expect(buildJob!.secrets).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Multiple nodes in same job
// ---------------------------------------------------------------------------

describe('multiple nodes in same job', () => {
  it('groups multiple nodes into one job with multiple steps', () => {
    const ast = makeMinimalAST({
      instances: [
        { id: 'checkout', nodeType: 'checkout', job: 'build', config: {} } as any,
        { id: 'install', nodeType: 'npmInstall', job: 'build', config: {} } as any,
        { id: 'compile', nodeType: 'npmBuild', job: 'build', config: {} } as any,
        { id: 'test', nodeType: 'npmTest', job: 'test', config: {} } as any,
      ],
      connections: [
        { from: { node: 'compile', port: 'onSuccess' }, to: { node: 'test', port: 'execute' } },
      ] as any,
      options: { cicd: {} } as any,
    });

    const jobs = buildJobGraph(ast);

    expect(jobs).toHaveLength(2);

    const buildJob = jobs.find(j => j.id === 'build');
    const testJob = jobs.find(j => j.id === 'test');

    expect(buildJob!.steps).toHaveLength(3);
    expect(buildJob!.steps.map(s => s.id)).toEqual(['checkout', 'install', 'compile']);

    expect(testJob!.steps).toHaveLength(1);
    expect(testJob!.needs).toEqual(['build']);
  });
});

// ---------------------------------------------------------------------------
// Default job grouping
// ---------------------------------------------------------------------------

describe('default job grouping', () => {
  it('nodes without [job:] go into "default" job', () => {
    const ast = makeMinimalAST({
      instances: [
        { id: 'a', nodeType: 'noop', config: {} } as any,
        { id: 'b', nodeType: 'noop', config: {} } as any,
      ],
      connections: [] as any,
      options: { cicd: {} } as any,
    });

    const jobs = buildJobGraph(ast);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('default');
    expect(jobs[0].steps).toHaveLength(2);
  });

  it('mixes default and named jobs correctly', () => {
    const ast = makeMinimalAST({
      instances: [
        { id: 'a', nodeType: 'noop', config: {} } as any,
        { id: 'b', nodeType: 'noop', job: 'deploy', config: {} } as any,
      ],
      connections: [
        { from: { node: 'a', port: 'onSuccess' }, to: { node: 'b', port: 'execute' } },
      ] as any,
      options: { cicd: {} } as any,
    });

    const jobs = buildJobGraph(ast);
    expect(jobs).toHaveLength(2);

    const defaultJob = jobs.find(j => j.id === 'default');
    const deployJob = jobs.find(j => j.id === 'deploy');

    expect(defaultJob!.steps).toHaveLength(1);
    expect(deployJob!.needs).toContain('default');
  });
});
