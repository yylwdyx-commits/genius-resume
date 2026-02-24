import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-sonnet-4-6";

/**
 * Create a streaming text response from Claude.
 * Returns a ReadableStream that yields SSE-formatted chunks.
 */
export function createClaudeStream(
  systemPrompt: string,
  userMessage: string,
  messages?: Array<{ role: "user" | "assistant"; content: string }>
): ReadableStream {
  const allMessages: Array<{ role: "user" | "assistant"; content: string }> =
    messages
      ? [...messages, { role: "user", content: userMessage }]
      : [{ role: "user", content: userMessage }];

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: allMessages,
        });

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
              )
            );
          }
        }

        controller.enqueue(
          new TextEncoder().encode("data: [DONE]\n\n")
        );
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ error: message })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}
