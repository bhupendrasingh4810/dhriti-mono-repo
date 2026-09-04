import { Injectable, Logger } from "@nestjs/common";

import { ApiConfigService } from "../../config/config.service";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletion {
  content: string;
  tokens: number;
}

/**
 * AI provider port. The default implementation is a deterministic local
 * fallback so Nexus features work without an API key in development. Wire a
 * real LLM (OpenAI/Anthropic/Bedrock) behind this interface in production.
 */
@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  constructor(private readonly config: ApiConfigService) {}

  get isConfigured(): boolean {
    return this.config.openAiApiKey !== undefined;
  }

  async chat(messages: ChatMessage[]): Promise<ChatCompletion> {
    if (!this.isConfigured) {
      this.logger.warn("No AI provider configured; using deterministic fallback");
      return this.fallback(messages);
    }
    return this.callOpenAi(messages);
  }

  /** Streams tokens for token-by-token AI responses. */
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<string> {
    const completion = await this.chat(messages);
    // Naive word chunking as a streaming stand-in; swap for real token streaming.
    const words = completion.content.split(/(\s+)/);
    for (const word of words) {
      if (word.length > 0) {
        yield word;
      }
    }
  }

  private async callOpenAi(messages: ChatMessage[]): Promise<ChatCompletion> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: this.config.openAiModel,
        messages,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { total_tokens?: number };
    };
    const content = data.choices[0]?.message.content ?? "";
    return { content, tokens: data.usage?.total_tokens ?? 0 };
  }

  private fallback(messages: ChatMessage[]): ChatCompletion {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    const source = lastUser?.content ?? "";
    const sentences = source.match(/[^.!?]+[.!?]*/g) ?? [source];
    const summary = sentences.slice(0, 3).join(" ").trim();
    return {
      content: summary.length > 0 ? summary : "No content to process.",
      tokens: Math.ceil(source.length / 4),
    };
  }
}
