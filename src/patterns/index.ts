// Pattern files are annotation-only — they are consumed by fw_apply_pattern,
// not imported as TypeScript modules. This barrel lists them for discoverability.
export const patterns = [
  'test-and-deploy',
  'docker-build-push',
  'multi-env-deploy',
] as const;
