/**
 * @flowWeaver nodeType
 * @expression
 * @label Docker Login
 * @color blue
 * @icon lock
 * @input registry [order:0] - Registry URL (e.g., ghcr.io, docker.io)
 * @input username [order:1] - Registry username
 * @input password [order:2] - Registry password or token
 * @input token [order:3] - Auth token (alternative to username/password)
 * @output loggedIn [order:0] - Whether login succeeded
 */
export function dockerLogin(
  registry: string = 'docker.io',
  username?: string,
  password?: string,
  token?: string,
): { loggedIn: boolean } {
  // Stub: CI/CD export maps this to docker/login-action@v3
  return { loggedIn: true };
}
