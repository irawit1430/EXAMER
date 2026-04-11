// =============================================
// EXAMER — LLM Provider Abstraction
// =============================================
// LLM backend: Google Gemini (@google/genai) — deploy-ready
// =============================================

import { GoogleGenAI } from "@google/genai";
import { traceAsync } from "@/lib/tracing";

// ---- Types ----

export interface LLMMessage {
  role: "user" | "model" | "system" | "assistant";
  content: string;
}

export interface LLMToolFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      { type: string; description: string; enum?: string[] }
    >;
    required: string[];
  };
}

export interface LLMFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface LLMGenerateOptions {
  model?: string;
  systemInstruction?: string;
  messages: LLMMessage[];
  tools?: LLMToolFunction[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface LLMResponse {
  text: string;
  functionCalls: LLMFunctionCall[];
  raw?: unknown; // Original response for debugging
}

export interface LLMChatSession {
  sendMessage(message: string | object[]): Promise<LLMResponse>;
}

export interface LLMChatOptions {
  model?: string;
  systemInstruction?: string;
  history?: LLMMessage[];
  tools?: LLMToolFunction[];
  temperature?: number;
  maxOutputTokens?: number;
}

// ---- Provider Interface ----

export interface LLMProvider {
  name: string;
  generate(options: LLMGenerateOptions): Promise<LLMResponse>;
  createChat(options: LLMChatOptions): LLMChatSession;
}

// =============================================
// GEMINI PROVIDER
// =============================================

class GeminiProvider implements LLMProvider {
  name = "gemini";
  private ai: GoogleGenAI;
  private defaultModel: string;

  constructor() {
    this.ai = new GoogleGenAI({});
    this.defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    const model = options.model || this.defaultModel;

    return traceAsync(
      "llm.gemini.generate",
      {
        "llm.provider": this.name,
        "llm.model": model,
      },
      async () => {
        // Build contents string from messages
        const contents = options.messages
          .map((m) => `[${m.role}]: ${m.content}`)
          .join("\n");

        const config: Record<string, unknown> = {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 4096,
        };

        if (options.systemInstruction) {
          config.systemInstruction = options.systemInstruction;
        }

        if (options.tools && options.tools.length > 0) {
          config.tools = [
            {
              functionDeclarations: options.tools,
            },
          ];
        }

        const result = await this.ai.models.generateContent({
          model,
          contents,
          config,
        });

        // Parse function calls from Gemini response
        const functionCalls: LLMFunctionCall[] = [];
        const parts = result.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if ((part as any).functionCall) {
            const fc = (part as any).functionCall;
            functionCalls.push({ name: fc.name, args: fc.args || {} });
          }
        }

        return {
          text: result.text || "",
          functionCalls,
          raw: result,
        };
      },
    );
  }

  createChat(options: LLMChatOptions): LLMChatSession {
    const model = options.model || this.defaultModel;

    const chatConfig: any = {
      model,
      config: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
      },
    };

    if (options.systemInstruction) {
      chatConfig.config.systemInstruction = options.systemInstruction;
    }

    if (options.tools && options.tools.length > 0) {
      chatConfig.config.tools = [
        {
          functionDeclarations: options.tools,
        },
      ];
    }

    if (options.history && options.history.length > 0) {
      chatConfig.history = options.history.map((msg) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));
    }

    const chat = this.ai.chats.create(chatConfig);

    return {
      async sendMessage(message: string | object[]): Promise<LLMResponse> {
        return traceAsync(
          "llm.gemini.chat.send_message",
          {
            "llm.provider": "gemini",
            "llm.model": model,
          },
          async () => {
            const response = await chat.sendMessage({ message });

            const functionCalls: LLMFunctionCall[] = [];
            const parts = response.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if ((part as any).functionCall) {
                const fc = (part as any).functionCall;
                functionCalls.push({ name: fc.name, args: fc.args || {} });
              }
            }

            const text = parts
              .filter((p: any) => p.text)
              .map((p: any) => p.text)
              .join("");

            return { text, functionCalls, raw: response };
          },
        );
      },
    };
  }
}

// =============================================
// PROVIDER FACTORY
// =============================================

let _provider: LLMProvider | null = null;

/**
 * Get the active LLM provider (Google Gemini)
 */
export function getLLMProvider(): LLMProvider {
  if (_provider) return _provider;

  _provider = new GeminiProvider();

  console.log(`[LLM] Provider initialized: ${_provider.name}`);
  return _provider;
}

/**
 * Reset provider (for testing or hot-switching)
 */
export function resetLLMProvider(): void {
  _provider = null;
}
