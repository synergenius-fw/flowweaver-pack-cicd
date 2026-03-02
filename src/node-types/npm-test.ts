/**
 * @flowWeaver nodeType
 * @expression
 * @label npm Test
 * @color teal
 * @icon check_circle
 * @output exitCode [order:0] - Test exit code (0 = pass)
 * @output testOutput [order:1] - Test output text
 */
export function npmTest(): { exitCode: number; testOutput: string } {
  // Stub: CI/CD export maps this to `npm test`
  return { exitCode: 0, testOutput: 'All tests passed' };
}
