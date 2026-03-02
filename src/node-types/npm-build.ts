/**
 * @flowWeaver nodeType
 * @expression
 * @label npm Build
 * @color orange
 * @icon build
 * @output output [order:0] - Build output directory path
 */
export function npmBuild(): { output: string } {
  // Stub: CI/CD export maps this to `npm run build`
  return { output: 'dist' };
}
