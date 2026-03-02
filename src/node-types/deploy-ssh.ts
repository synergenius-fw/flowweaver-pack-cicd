/**
 * @flowWeaver nodeType
 * @expression
 * @label Deploy SSH
 * @color purple
 * @icon cloud_upload
 * @input host [order:0] - SSH host
 * @input sshKey [order:1] - SSH private key
 * @input sourcePath [order:2] - Local path to deploy
 * @input remotePath [order:3] - Remote deployment path
 * @output result [order:0] - Deployment result message
 */
export function deploySsh(
  host: string = '',
  sshKey: string = '',
  sourcePath: string = 'dist/',
  remotePath: string = '/app/',
): { result: string } {
  // Stub: CI/CD export maps this to rsync/scp commands
  return { result: `Deployed ${sourcePath} to ${host}:${remotePath}` };
}
