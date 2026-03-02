/**
 * @flowWeaver nodeType
 * @expression
 * @label Setup Node.js
 * @color green
 * @icon terminal
 * @input version [order:0] - Node.js version (e.g., "20", "18")
 * @output nodeVersion [order:0] - Installed Node.js version
 */
export function setupNode(version: string = '20'): { nodeVersion: string } {
  // Stub: CI/CD export maps this to actions/setup-node@v4
  return { nodeVersion: version };
}
