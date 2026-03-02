/**
 * @flowWeaver nodeType
 * @expression
 * @label Docker Build
 * @color blue
 * @icon layers
 * @input context [order:0] - Build context path (default: ".")
 * @input dockerfile [order:1] - Dockerfile path (default: "Dockerfile")
 * @input tags [order:2] - Image tags (comma-separated)
 * @output imageId [order:0] - Built image ID
 */
export function dockerBuild(
  context: string = '.',
  dockerfile: string = 'Dockerfile',
  tags: string = 'latest',
): { imageId: string } {
  // Stub: CI/CD export maps this to docker/build-push-action@v6
  return { imageId: `sha256:stub-${Date.now()}` };
}
