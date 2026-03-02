/**
 * @flowWeaver nodeType
 * @expression
 * @label Shell Command
 * @color gray
 * @icon terminal
 * @input command [order:0] - Shell command to execute
 * @input workingDirectory [order:1] - Working directory (default: repo root)
 * @output stdout [order:0] - Standard output
 * @output exitCode [order:1] - Exit code
 */
export function shellCommand(
  command: string = 'echo "hello"',
  workingDirectory: string = '.',
): { stdout: string; exitCode: number } {
  // Stub: CI/CD export maps this to a `run:` step
  return { stdout: '', exitCode: 0 };
}
