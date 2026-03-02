/**
 * @flowWeaver nodeType
 * @expression
 * @label Slack Notify
 * @color yellow
 * @icon chat
 * @input webhookUrl [order:0] - Slack webhook URL
 * @input message [order:1] - Message text
 * @input channel [order:2] - Channel override (optional)
 * @output sent [order:0] - Whether notification was sent
 */
export function slackNotify(
  webhookUrl: string = '',
  message: string = 'Pipeline complete',
  channel?: string,
): { sent: boolean } {
  // Stub: CI/CD export maps this to slackapi/slack-github-action@v1
  return { sent: true };
}
