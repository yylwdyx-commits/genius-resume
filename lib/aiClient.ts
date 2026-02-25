import Anthropic from "@anthropic-ai/sdk";

export type AIProvider = "anthropic" | "openai" | "gemini" | "deepseek";

export interface UserApiConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

type Message = { role: "user" | "assistant"; content: string };

const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
  gemini: "gemini-1.5-flash",
  deepseek: "deepseek-chat",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function encodeSSE(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`);
}
function encodeDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}
function encodeError(message: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ error: message })}\n\n`);
}

// ── Anthropic streaming ───────────────────────────────────────────────────────

function createAnthropicStream(
  systemPrompt: string,
  allMessages: Message[],
  apiKey?: string,
  model?: string
): ReadableStream {
  const client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
  const modelId = model ?? DEFAULT_MODELS.anthropic;

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: modelId,
          max_tokens: 4096,
          system: systemPrompt,
          messages: allMessages,
        });
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encodeSSE(chunk.delta.text));
          }
        }
        controller.enqueue(encodeDone());
        controller.close();
      } catch (error) {
        controller.enqueue(encodeError(error instanceof Error ? error.message : "Unknown error"));
        controller.close();
      }
    },
  });
}

// ── OpenAI / DeepSeek streaming (OpenAI-compatible format) ───────────────────

function createOpenAIStream(
  systemPrompt: string,
  allMessages: Message[],
  apiKey: string,
  model: string,
  baseURL: string
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              ...allMessages,
            ],
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`API error ${response.status}: ${err}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(encodeSSE(text));
            } catch { /* ignore */ }
          }
        }

        controller.enqueue(encodeDone());
        controller.close();
      } catch (error) {
        controller.enqueue(encodeError(error instanceof Error ? error.message : "Unknown error"));
        controller.close();
      }
    },
  });
}

// ── Gemini streaming ──────────────────────────────────────────────────────────

function createGeminiStream(
  systemPrompt: string,
  allMessages: Message[],
  apiKey: string,
  model: string
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        const contents = allMessages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents,
              generationConfig: { maxOutputTokens: 4096 },
            }),
          }
        );

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Gemini API error ${response.status}: ${err}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            try {
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) controller.enqueue(encodeSSE(text));
            } catch { /* ignore */ }
          }
        }

        controller.enqueue(encodeDone());
        controller.close();
      } catch (error) {
        controller.enqueue(encodeError(error instanceof Error ? error.message : "Unknown error"));
        controller.close();
      }
    },
  });
}

// ── Public: streaming ─────────────────────────────────────────────────────────

export function createAIStream(
  systemPrompt: string,
  userMessage: string,
  messages?: Message[],
  userConfig?: UserApiConfig | null
): ReadableStream {
  const allMessages: Message[] = [
    ...(messages ?? []),
    { role: "user", content: userMessage },
  ];

  if (!userConfig) {
    return createAnthropicStream(systemPrompt, allMessages);
  }

  const model = userConfig.model ?? DEFAULT_MODELS[userConfig.provider];

  switch (userConfig.provider) {
    case "anthropic":
      return createAnthropicStream(systemPrompt, allMessages, userConfig.apiKey, model);
    case "openai":
      return createOpenAIStream(systemPrompt, allMessages, userConfig.apiKey, model, "https://api.openai.com/v1");
    case "deepseek":
      return createOpenAIStream(systemPrompt, allMessages, userConfig.apiKey, model, "https://api.deepseek.com/v1");
    case "gemini":
      return createGeminiStream(systemPrompt, allMessages, userConfig.apiKey, model);
  }
}

// ── Public: non-streaming (for job-intel) ─────────────────────────────────────

export async function createAICompletion(
  systemPrompt: string,
  userMessage: string,
  userConfig?: UserApiConfig | null
): Promise<string> {
  if (!userConfig) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: DEFAULT_MODELS.anthropic,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  const model = userConfig.model ?? DEFAULT_MODELS[userConfig.provider];

  switch (userConfig.provider) {
    case "anthropic": {
      const client = new Anthropic({ apiKey: userConfig.apiKey });
      const response = await client.messages.create({
        model,
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      return response.content[0].type === "text" ? response.content[0].text : "";
    }
    case "openai":
    case "deepseek": {
      const baseURL =
        userConfig.provider === "openai"
          ? "https://api.openai.com/v1"
          : "https://api.deepseek.com/v1";
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userConfig.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 3000,
        }),
      });
      if (!response.ok) throw new Error(`API error ${response.status}`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
    case "gemini": {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userConfig.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 3000 },
          }),
        }
      );
      if (!response.ok) throw new Error(`Gemini API error ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
  }
}
