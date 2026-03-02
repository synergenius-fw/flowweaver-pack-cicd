/**
 * @flowWeaver nodeType
 * @expression
 * @label npm Install
 * @color green
 * @icon package
 * @input npmToken [order:0] - NPM auth token (optional, for private packages)
 * @output nodeModulesPath [order:0] - Path to node_modules
 */
export function npmInstall(npmToken?: string): { nodeModulesPath: string } {
  // Stub: CI/CD export maps this to `npm ci`
  if (npmToken) {
    // Would set NPM_TOKEN env var
  }
  return { nodeModulesPath: 'node_modules' };
}
