/**
 * @flowWeaver nodeType
 * @expression
 * @label Deploy S3
 * @color orange
 * @icon cloud_upload
 * @input bucket [order:0] - S3 bucket name
 * @input sourcePath [order:1] - Local path to upload
 * @input accessKey [order:2] - AWS access key ID
 * @input secretKey [order:3] - AWS secret access key
 * @input region [order:4] - AWS region (default: us-east-1)
 * @output url [order:0] - S3 URL of uploaded content
 */
export function deployS3(
  bucket: string = '',
  sourcePath: string = 'dist/',
  accessKey: string = '',
  secretKey: string = '',
  region: string = 'us-east-1',
): { url: string } {
  // Stub: CI/CD export maps this to aws-actions/configure-aws-credentials@v4 + aws s3 sync
  return { url: `s3://${bucket}/${sourcePath}` };
}
