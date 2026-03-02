/**
 * @flowWeaver nodeType
 * @expression
 * @label Setup Python
 * @color blue
 * @icon terminal
 * @input version [order:0] - Python version (e.g., "3.12", "3.11")
 * @output pythonVersion [order:0] - Installed Python version
 */
export function setupPython(version: string = '3.12'): { pythonVersion: string } {
  // Stub: CI/CD export maps this to actions/setup-python@v5
  return { pythonVersion: version };
}
