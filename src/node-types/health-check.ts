/**
 * @flowWeaver nodeType
 * @expression
 * @label Health Check
 * @color green
 * @icon favorite
 * @input url [order:0] - URL to check
 * @input retries [order:1] - Number of retries (default: 10)
 * @input delaySeconds [order:2] - Delay between retries in seconds (default: 5)
 * @output healthy [order:0] - Whether the URL is healthy
 * @output statusCode [order:1] - HTTP status code
 */
export function healthCheck(
  url: string = '',
  retries: number = 10,
  delaySeconds: number = 5,
): { healthy: boolean; statusCode: number } {
  // Stub: CI/CD export maps this to curl with retries
  return { healthy: true, statusCode: 200 };
}
