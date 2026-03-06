import { describe, it, expect } from 'vitest';
import { cicdTagHandler } from './tag-handler.js';

function makeCtx() {
  return { deploy: {} as Record<string, unknown>, warnings: [] as string[] };
}

describe('Bug 1: @job stage=X parsing', () => {
  it('parses stage attribute on @job', () => {
    const ctx = makeCtx();
    cicdTagHandler('job', 'build stage=test', ctx);
    const jobs = ctx.deploy['jobs'] as Array<{ id: string; stage?: string }>;
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('build');
    expect(jobs[0].stage).toBe('test');
    expect(ctx.warnings).toHaveLength(0);
  });

  it('parses stage alongside other attributes', () => {
    const ctx = makeCtx();
    cicdTagHandler('job', 'deploy stage=production runner=ubuntu-latest retry=2', ctx);
    const jobs = ctx.deploy['jobs'] as Array<{ id: string; stage?: string; runner?: string; retry?: number }>;
    expect(jobs[0].stage).toBe('production');
    expect(jobs[0].runner).toBe('ubuntu-latest');
    expect(jobs[0].retry).toBe(2);
    expect(ctx.warnings).toHaveLength(0);
  });

  it('does not produce warning for stage attribute', () => {
    const ctx = makeCtx();
    cicdTagHandler('job', 'lint stage=validate', ctx);
    expect(ctx.warnings).toHaveLength(0);
  });
});

describe('Bug 4: @job retry_when parsing', () => {
  it('parses retry_when as comma-separated list', () => {
    const ctx = makeCtx();
    cicdTagHandler('job', 'test retry=2 retry_when="runner_system_failure,api_failure"', ctx);
    const jobs = ctx.deploy['jobs'] as Array<{ id: string; retry?: number; retryWhen?: string[] }>;
    expect(jobs[0].retry).toBe(2);
    expect(jobs[0].retryWhen).toEqual(['runner_system_failure', 'api_failure']);
    expect(ctx.warnings).toHaveLength(0);
  });

  it('handles single retry_when value', () => {
    const ctx = makeCtx();
    cicdTagHandler('job', 'test retry=1 retry_when="always"', ctx);
    const jobs = ctx.deploy['jobs'] as Array<{ id: string; retryWhen?: string[] }>;
    expect(jobs[0].retryWhen).toEqual(['always']);
  });

  it('trims whitespace in retry_when values', () => {
    const ctx = makeCtx();
    cicdTagHandler('job', 'test retry_when="a , b , c"', ctx);
    const jobs = ctx.deploy['jobs'] as Array<{ id: string; retryWhen?: string[] }>;
    expect(jobs[0].retryWhen).toEqual(['a', 'b', 'c']);
  });
});

describe('Bug 5: @rule tag parsing', () => {
  it('parses rule with if and when=never', () => {
    const ctx = makeCtx();
    cicdTagHandler('rule', 'if="$CI_COMMIT_MESSAGE =~ /\\[ci skip\\]/" when=never', ctx);
    const rules = ctx.deploy['workflowRules'] as Array<{ if?: string; when?: string }>;
    expect(rules).toHaveLength(1);
    expect(rules[0].if).toBe('$CI_COMMIT_MESSAGE =~ /\\[ci skip\\]/');
    expect(rules[0].when).toBe('never');
  });

  it('parses rule with when=always and no if', () => {
    const ctx = makeCtx();
    cicdTagHandler('rule', 'when=always', ctx);
    const rules = ctx.deploy['workflowRules'] as Array<{ if?: string; when?: string }>;
    expect(rules[0].when).toBe('always');
    expect(rules[0].if).toBeUndefined();
  });

  it('parses rule with changes attribute', () => {
    const ctx = makeCtx();
    cicdTagHandler('rule', 'if="$CI_COMMIT_BRANCH" changes="src/**,lib/**"', ctx);
    const rules = ctx.deploy['workflowRules'] as Array<{ if?: string; changes?: string[] }>;
    expect(rules[0].if).toBe('$CI_COMMIT_BRANCH');
    expect(rules[0].changes).toEqual(['src/**', 'lib/**']);
  });

  it('accumulates multiple @rule tags', () => {
    const ctx = makeCtx();
    cicdTagHandler('rule', 'if="$CI_COMMIT_MESSAGE =~ /\\[ci skip\\]/" when=never', ctx);
    cicdTagHandler('rule', 'when=always', ctx);
    const rules = ctx.deploy['workflowRules'] as Array<{ if?: string; when?: string }>;
    expect(rules).toHaveLength(2);
    expect(rules[0].when).toBe('never');
    expect(rules[1].when).toBe('always');
  });
});
