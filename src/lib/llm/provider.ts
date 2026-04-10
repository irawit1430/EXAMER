// =============================================
// EXAMER — LLM Provider Abstraction
// =============================================
// Switchable provider layer:
//   - DEV:  Ollama Cloud (https://ollama.com/api)  — free, no rate limits
//   - PROD: Google Gemini (@google/genai)            — deploy-ready
//
// Controlled by ENV: LLM_PROVIDER=ollama | gemini
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
// 1. OLLAMA CLOUD PROVIDER
// =============================================

class OllamaCloudProvider implements LLMProvider {
  name = "ollama-cloud";
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;
  private requestTimeoutMs: number;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "https://ollama.com/api";
    this.apiKey = process.env.OLLAMA_API_KEY || "";
    this.defaultModel = process.env.OLLAMA_MODEL || "deepseek-v3.2:cloud";
    this.requestTimeoutMs = Number(process.env.LLM_REQUEST_TIMEOUT_MS || 45000);

    if (!this.apiKey) {
      console.warn(
        "[LLM] OLLAMA_API_KEY not set. Ollama Cloud calls will fail.",
      );
    }
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    const model = options.model || this.defaultModel;

    return traceAsync(
      "llm.ollama.generate",
      {
        "llm.provider": this.name,
        "llm.model": model,
      },
      async () => {
        // Build messages array with system instruction
        const messages: Array<{ role: string; content: string }> = [];

        if (options.systemInstruction) {
          messages.push({ role: "system", content: options.systemInstruction });
        }

        for (const msg of options.messages) {
          messages.push({
            role: msg.role === "model" ? "assistant" : msg.role,
            content: msg.content,
          });
        }

        // Build request body
        const body: Record<string, unknown> = {
          model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxOutputTokens ?? 4096,
          },
        };

        // Add tools if provided (Ollama supports OpenAI-compatible tool format)
        if (options.tools && options.tools.length > 0) {
          body.tools = options.tools.map((t) => ({
            type: "function",
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }));
        }

        const controller = new AbortController();
        const timeoutHandle = setTimeout(
          () => controller.abort(),
          this.requestTimeoutMs,
        );

        let response: Response;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (this.apiKey) {
          headers.Authorization = `Bearer ${this.apiKey}`;
        }

        try {
          response = await fetch(`${this.baseUrl}/chat`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } catch (error: any) {
          if (error?.name === "AbortError") {
            throw new Error(
              `Ollama request timed out after ${this.requestTimeoutMs}ms`,
            );
          }
          throw new Error(
            `Ollama request failed: ${error?.message || "Network error"}`,
          );
        } finally {
          clearTimeout(timeoutHandle);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Ollama Cloud error (${response.status}): ${errorText}`,
          );
        }

        const data = await response.json();

        // Parse function calls from Ollama response
        const functionCalls: LLMFunctionCall[] = [];
        if (data.message?.tool_calls) {
          for (const tc of data.message.tool_calls) {
            functionCalls.push({
              name: tc.function.name,
              args:
                typeof tc.function.arguments === "string"
                  ? JSON.parse(tc.function.arguments)
                  : tc.function.arguments,
            });
          }
        }

        let text = data.message?.content || "";

        // Debug: log raw model output length to help diagnose empty responses
        console.log(
          `[LLM] Raw response length: ${text.length} chars, has_tool_calls: ${!!data.message?.tool_calls}, first 200 chars: ${text.slice(0, 200).replace(/\n/g, "\\n")}`,
        );

        // Safely extract tool_code markdown blocks if the model hallucinates format
        const toolCodeRegex = /```tool_code\s+([\w_]+)(?:\s+([^`]*?))?```/g;
        let match;
        while ((match = toolCodeRegex.exec(text)) !== null) {
          const name = match[1].trim();
          let args = {};
          if (match[2] && match[2].trim().startsWith("{")) {
            try {
              args = JSON.parse(match[2].trim());
            } catch (e) {}
          }
          functionCalls.push({ name, args });
        }

        // Remove parsed text-based tool calls from the output text
        text = text.replace(toolCodeRegex, "").trim();

        // Parse XML-style function calls (hallucinated by Gemma, DeepSeek, etc.)
        // Format: <function_calls><invoke name="tool"><parameter name="arg">value</parameter></invoke></function_calls>
        const xmlToolRegex = /<invoke\s+name="([^"]+)">([\s\S]*?)<\/invoke>/g;
        let xmlMatch;
        while ((xmlMatch = xmlToolRegex.exec(text)) !== null) {
          const name = xmlMatch[1].trim();
          const argsBlock = xmlMatch[2];
          const args: Record<string, unknown> = {};

          const paramRegex =
            /<parameter\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/parameter>/g;
          let paramMatch;
          while ((paramMatch = paramRegex.exec(argsBlock)) !== null) {
            let val: unknown = paramMatch[2].trim();
            if (val === "true") val = true;
            else if (val === "false") val = false;
            else if (
              typeof val === "string" &&
              !isNaN(Number(val)) &&
              val !== ""
            )
              val = Number(val);
            args[paramMatch[1]] = val;
          }

          functionCalls.push({ name, args });
        }

        // Remove XML tool call blocks from user-visible text
        text = text
          .replace(/<function_calls>[\s\S]*?<\/function_calls>/g, "")
          .trim();
        text = text.replace(/<invoke[\s\S]*?<\/invoke>/g, "").trim();

        // Strip <think>...</think> reasoning blocks (DeepSeek R1 chain-of-thought)
        text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        // Strip any other stray XML-like hallucination tags
        text = text
          .replace(
            /<\/?(?:function_calls|invoke|parameter|tool_call|tools|results)(?:\s[^>]*)?>/g,
            "",
          )
          .trim();

        return {
          text,
          functionCalls,
          raw: data,
        };
      },
    );
  }

  createChat(options: LLMChatOptions): LLMChatSession {
    const provider = this;
    const history: Array<{ role: string; content: string }> = [];

    // Initialize history
    if (options.history) {
      for (const msg of options.history) {
        history.push({
          role: msg.role === "model" ? "assistant" : msg.role,
          content: msg.content,
        });
      }
    }

    return {
      async sendMessage(message: string | object[]): Promise<LLMResponse> {
        return traceAsync(
          "llm.chat.send_message",
          {
            "llm.provider": provider.name,
            "llm.model": options.model || provider.defaultModel,
          },
          async () => {
            // Handle function response messages
            if (Array.isArray(message)) {
              // These are tool results. Feed them back as plain context so
              // OpenAI-compatible and XML-tool-call modes can both continue.
              for (const item of message) {
                const fr = (item as any).functionResponse;
                if (fr) {
                  history.push({
                    role: "user",
                    content: `Tool result for ${fr.name}: ${JSON.stringify(fr.response)}`,
                  });
                }
              }
            } else {
              history.push({ role: "user", content: message });
            }

            const result = await provider.generate({
              model: options.model,
              systemInstruction: options.systemInstruction,
              messages: history.map((h) => ({
                role: h.role as LLMMessage["role"],
                content: h.content,
              })),
              tools: options.tools,
              temperature: options.temperature,
              maxOutputTokens: options.maxOutputTokens,
            });

            // Add assistant response to history
            if (result.text) {
              history.push({ role: "assistant", content: result.text });
            }

            return result;
          },
        );
      },
    };
  }
}

// =============================================
// 2. GEMINI PROVIDER
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
// 3. PROVIDER FACTORY
// =============================================

let _provider: LLMProvider | null = null;

/**
 * Get the active LLM provider based on LLM_PROVIDER env variable
 * - 'ollama' → Ollama Cloud (default for development)
 * - 'gemini' → Google Gemini (for production)
 */
export function getLLMProvider(): LLMProvider {
  if (_provider) return _provider;

  const providerName = process.env.LLM_PROVIDER || "ollama";

  switch (providerName.toLowerCase()) {
    case "gemini":
      _provider = new GeminiProvider();
      break;
    case "ollama":
    default:
      _provider = new OllamaCloudProvider();
      break;
  }

  console.log(`[LLM] Provider initialized: ${_provider.name}`);
  return _provider;
}

/**
 * Reset provider (for testing or hot-switching)
 */
export function resetLLMProvider(): void {
  _provider = null;
}
