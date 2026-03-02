/**
 * @flowWeaver nodeType
 * @expression
 * @label Checkout
 * @color gray
 * @icon download
 * @output repoPath [order:0] - Path to checked-out repository
 */
export function checkout(): { repoPath: string } {
  // Stub: CI/CD export maps this to actions/checkout@v4 or GitLab's built-in checkout
  return { repoPath: process.cwd() };
}
