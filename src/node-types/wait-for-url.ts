/**
 * @flowWeaver nodeType
 * @expression
 * @label Wait for URL
 * @color teal
 * @icon schedule
 * @input url [order:0] - URL to wait for
 * @input timeoutSeconds [order:1] - Maximum wait time in seconds (default: 300)
 * @input intervalSeconds [order:2] - Check interval in seconds (default: 10)
 * @output available [order:0] - Whether the URL became available
 * @output waitedSeconds [order:1] - How long we waited
 */
export function waitForUrl(
  url: string = '',
  timeoutSeconds: number = 300,
  intervalSeconds: number = 10,
): { available: boolean; waitedSeconds: number } {
  // Stub: CI/CD export maps this to a polling loop
  return { available: true, waitedSeconds: 0 };
}
