/**
 * @flowWeaver nodeType
 * @expression
 * @label Docker Push
 * @color blue
 * @icon cloud_upload
 * @input imageId [order:0] - Image ID to push
 * @input tags [order:1] - Tags to push (comma-separated)
 * @output digest [order:0] - Pushed image digest
 */
export function dockerPush(
  imageId: string = '',
  tags: string = 'latest',
): { digest: string } {
  // Stub: CI/CD export maps this to docker/build-push-action@v6 with push: true
  return { digest: `sha256:pushed-${Date.now()}` };
}
