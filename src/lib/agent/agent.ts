// =============================================
// EXAMER Agent — Agent Runtime (The Brain)
// =============================================
// Manages all LLM interaction: prompt assembly, function calling,
// streaming, and the autonomous tool-calling loop.
//
// Uses Google Gemini via the LLM provider abstraction layer.
// =============================================

import { getLLMProvider } from "@/lib/llm/provider";
import type { LLMMessage, LLMToolFunction } from "@/lib/llm/provider";
import { getToolRegistry } from "./tools";
import { getSessionMemory, getLongTermMemory } from "./memory";
import { traceAsync } from "@/lib/tracing";
import type { AgentConfig, AgentEvent, ToolCallResult } from "./types";
import { DEFAULT_AGENT_CONFIG } from "./types";

// =============================================
// SYSTEM INSTRUCTION — The AI's personality & rules
// =============================================

const SYSTEM_INSTRUCTION = `You are EXAMER AI, an interactive personal teacher and mentor for the student.

## CORE ROLE
- Be highly interactive, warm, motivating, and clear.
- Teach, quiz, evaluate, and coach like a live mentor.
- Personalize every response using available student context, profile, memory, weak topics, and recent activity.
- Never shame the student. Turn mistakes into clear next steps.

## PLATFORM AWARENESS
You are aware of the EXAMER product flow and should guide students to the right page for the current task.

Primary app destinations:
- Study page: /study
- Dashboard overview: /dashboard
- Analytics and progress: /analytics
- Mock tests: /mocks
- Settings and profile: /settings

When route guidance is useful, include one short line exactly in this format:
NAVIGATE_TO: /route

Use this only when it helps the student continue the task. Do not spam navigation lines.

## TEACHING STYLE & EVALUATION
- Use Socratic guidance: ask small, focused questions.
- Use the Feynman technique: ask the student to explain in simple words.
- Keep explanations exam-relevant and practical.
- Default flow for new topics: explain briefly -> mini-check question -> next step.
- WHEN EVALUATING ANSWERS (via tools like evaluate_user_answer): DO NOT quote the detailed feedback or correct concept directly to the student in your first response!
- Instead, ONLY tell them if they are correct or incorrect. If they are correct, challenge them to explain the *why* using the Feynman technique. If they are incorrect, give them a tiny hint from the tool's feedback and ask them to try again. NEVER spoon-feed the correct explanation until they have successfully grasped it themselves.

## QUIZ AND PRACTICE BEHAVIOR
- When a student asks for a quiz, mock test, or wants to practice, DO NOT generate questions in the chat.
- Instead, provide a brief encouraging response and immediately redirect them to the mock tests page using: NAVIGATE_TO: /mocks
- NEVER give away the answers to questions directly unless the student has first attempted them and explicitly submitted their answer for grading.
- Help them think through the problem instead of just giving the final answer.
- DO NOT hallucinate, pretend, or assume the user has submitted an answer or selected an option unless their most recent chat message explicitly contains their choice.

## TOOL CALLING POLICY (STRICT)
- Use tools whenever data or actions are needed. Do not pretend you already fetched data.
- For practice questions: ALWAYS call generate_mcq.
- For answer checking: call evaluate_user_answer only when the student has explicitly submitted an answer to grade. Do not call it just because you generated practice questions.
- For study planning or syllabus detail: call fetch_syllabus_topic.
- For weak-area diagnosis: call get_weak_topics and/or get_study_stats.
- For personalization: call get_recent_activity, get_mentor_memories, get_mock_test_results when needed.
- For long-term personalized coaching signals: call log_important_memory when you detect an important pattern.
- If the student profile is marked as placeholder, default, or Unknown, do not guess the student's level or history. First call the relevant data tools before making personalized claims.

## TOOL OUTPUT FORMAT
If you call tools, use only the exact XML tool-call format provided by system instructions.
Never invent fake IDs or placeholders like "Student" for identifiers.

## RESPONSE QUALITY RULES
- Keep responses human and concise, with clean markdown.
- Ground advice in available student data whenever possible.
- Be action-oriented: always give the next best step.
- End with one clear follow-up question.

## SECURITY + ERROR HANDLING RULES
- Never ask the student to share backend credentials, API keys, service-account emails, private keys, tokens, or project secrets in chat.
- Never output raw internal errors (for example missing env vars, stack traces, credential names).
- If a backend data tool is unavailable, state briefly that some activity data is temporarily unavailable and continue with coaching using available context.
- Do not ask the student to configure server infrastructure from the chat conversation.
- If profile data is incomplete or placeholder-only, ask for clarification or use tools first. Do not infer that the student is a beginner just because their profile is empty.
`;
// =============================================
// AGENT RUNTIME CLASS
// =============================================

export class AgentRuntime {
  private config: AgentConfig;

  constructor(config?: Partial<AgentConfig>) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
  }

  /**
   * Assemble the full prompt from event data + memory
   * Returns system instruction + provider-agnostic message array
   */
  async assemblePrompt(event: AgentEvent): Promise<{
    systemInstruction: string;
    messages: LLMMessage[];
    tools: LLMToolFunction[];
  }> {
    return traceAsync(
      "agent.assemble_prompt",
      {
        "agent.session_id": event.sessionId,
        "agent.user_id": event.userId,
      },
      async () => {
        const memoryManager = getSessionMemory();
        const ltm = getLongTermMemory();
        const toolRegistry = getToolRegistry(this.config);

        // 1. Load long-term student profile
        let studentSnapshot = "";
        try {
          studentSnapshot = await ltm.getStudentSnapshot(event.userId);
        } catch {
          studentSnapshot = "--- No long-term profile available ---";
        }

        // 2. Build the system instruction with injected context
        let systemInstruction = SYSTEM_INSTRUCTION;
        systemInstruction += `\n\n${studentSnapshot}`;

        if (event.payload.context) {
          const ctx = event.payload.context;
          systemInstruction += `\n\n--- Current Session Context ---
Currently studying: ${ctx.currentTopic} (${ctx.currentSubject})
Time on current concept: ${ctx.timeSpent}
Recent errors: ${ctx.recentErrors}
Current streak: ${ctx.streak} days
Predicted score: ${ctx.predictedScore}/${ctx.targetScore}
Days to exam: ${ctx.daysToExam}
-------------------------------`;
        }

        // 3. Build conversation history from session memory
        const session = memoryManager.getSession(event.sessionId);
        const history = session
          ? memoryManager.getHistory(event.sessionId)
          : [];

        const messages: LLMMessage[] = [];
        for (const msg of history) {
          if (msg.role === "system") {
            messages.push({ role: "system", content: msg.content });
          } else if (msg.role === "tool") {
            messages.push({
              role: "model",
              content: `[Tool Result]: ${msg.content}`,
            });
          } else {
            messages.push({
              role: msg.role === "user" ? "user" : "model",
              content: msg.content,
            });
          }
        }

        // 4. Build tool declarations
        const tools: LLMToolFunction[] = this.config.enableToolCalling
          ? toolRegistry.toGeminiFunctionDeclarations()
          : [];

        // 5. Inject tool catalog into system prompt for models without native tool calling
        if (this.config.enableToolCalling) {
          systemInstruction += "\n\n" + toolRegistry.toPromptDescription();
        }

        return { systemInstruction, messages, tools };
      },
    );
  }

  /**
   * Generate a non-streaming response with tool calling support
   * Uses Gemini via the LLM provider abstraction layer
   */
  async generateResponse(event: AgentEvent): Promise<{
    text: string;
    toolResults: ToolCallResult[];
  }> {
    return traceAsync(
      "agent.generate_response",
      {
        "agent.session_id": event.sessionId,
        "agent.user_id": event.userId,
      },
      async () => {
        const { systemInstruction, messages, tools } =
          await this.assemblePrompt(event);
        const provider = getLLMProvider();
        const toolRegistry = getToolRegistry(this.config);

        const allToolResults: ToolCallResult[] = [];

        // Create a chat session via the provider
        const chat = provider.createChat({
          model: this.config.model,
          systemInstruction,
          history: messages,
          tools: tools.length > 0 ? tools : undefined,
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
        });

        // Send the user's message
        const userMessage = event.payload.message || "Hello";
        let response = await chat.sendMessage(userMessage);

        // Tool-calling loop — agent can call tools autonomously
        let iterations = 0;
        while (iterations < this.config.maxToolLoopIterations) {
          if (response.functionCalls.length === 0) break;

          // Execute each function call
          const functionResponses: any[] = [];

          for (const fc of response.functionCalls) {
            console.log(
              `[AgentRuntime] Tool call: ${fc.name}(${JSON.stringify(fc.args)})`,
            );

            const params = { ...fc.args };
            if (event.userId) {
              const providedUserId =
                typeof params.user_id === "string" ? params.user_id.trim() : "";
              const looksLikePlaceholder =
                !providedUserId ||
                /^(student|user|me|myself)$/i.test(providedUserId);
              if (looksLikePlaceholder || providedUserId !== event.userId) {
                params.user_id = event.userId;
              }
            }

            const result = await toolRegistry.execute(fc.name, params);
            allToolResults.push(result);

            functionResponses.push({
              functionResponse: {
                name: fc.name,
                response: {
                  result: result.success
                    ? result.data
                    : { error: result.error },
                },
              },
            });
          }

          // Send tool results back to the model for re-inference
          response = await chat.sendMessage(functionResponses);
          iterations++;
        }

        return { text: response.text, toolResults: allToolResults };
      },
    );
  }

  /**
   * Generate a streaming response with tool calling support
   * Returns a ReadableStream that emits SSE-formatted chunks
   */
  async streamResponse(event: AgentEvent): Promise<ReadableStream<Uint8Array>> {
    const { systemInstruction, messages, tools } =
      await this.assemblePrompt(event);
    const provider = getLLMProvider();
    const toolRegistry = getToolRegistry(this.config);

    const encoder = new TextEncoder();
    const config = this.config;
    const userId = event.userId;

    return new ReadableStream({
      async start(controller) {
        try {
          // Create chat session
          const chat = provider.createChat({
            model: config.model,
            systemInstruction,
            history: messages,
            tools: tools.length > 0 ? tools : undefined,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
          });

          const userMessage = event.payload.message || "Hello";
          let response = await chat.sendMessage(userMessage);

          let iterations = 0;
          const allToolResults: ToolCallResult[] = [];

          // Handle tool-calling loop
          while (iterations < config.maxToolLoopIterations) {
            if (response.functionCalls.length === 0) break;

            const iterationToolResults: ToolCallResult[] = [];

            for (const fc of response.functionCalls) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_call", tool: fc.name, args: fc.args })}\n\n`,
                ),
              );

              const params = { ...fc.args };
              if (userId) {
                const providedUserId =
                  typeof params.user_id === "string"
                    ? params.user_id.trim()
                    : "";
                const looksLikePlaceholder =
                  !providedUserId ||
                  /^(student|user|me|myself)$/i.test(providedUserId);
                if (looksLikePlaceholder || providedUserId !== userId) {
                  params.user_id = userId;
                }
              }

              const result = await toolRegistry.execute(fc.name, params);
              iterationToolResults.push(result);
              allToolResults.push(result);

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "tool_result", tool: fc.name, success: result.success, data: result.data })}\n\n`,
                ),
              );
            }

            // Send tool results back
            const functionResponses = response.functionCalls.map(
              (fc, index) => {
                const matchedResult = iterationToolResults[index];
                return {
                  functionResponse: {
                    name: fc.name,
                    response: {
                      result: matchedResult?.success
                        ? matchedResult.data
                        : { error: matchedResult?.error },
                    },
                  },
                };
              },
            );

            response = await chat.sendMessage(functionResponses);
            iterations++;
          }

          // Stream text in chunks for a smooth typing effect
          let fullText = response.text;

          // If text is empty (model only produced <think> or tool calls that got stripped),
          // re-prompt the model for a user-facing reply
          if (!fullText.trim() && iterations < config.maxToolLoopIterations) {
            console.log(
              "[AgentRuntime] Empty response after stripping — re-prompting model...",
            );
            const retry = await chat.sendMessage(
              "Please provide a natural, conversational response to the student. Do NOT use any XML tags or function calls — just reply normally in markdown.",
            );
            fullText = retry.text;
          }

          // Final fallback if still empty
          if (!fullText.trim()) {
            fullText =
              "Hey! I'm here and ready to help. 😊 What would you like to study today?";
          }

          // Check if any tool result contains a redirect URL
          // (from generate_mcq quiz mode or recommend_mock_test)
          let toolRedirectUrl: string | null = null;
          for (const tr of allToolResults) {
            if (tr.success && tr.data) {
              const d = tr.data as Record<string, unknown>;
              const url = d.testUrl || d.redirectUrl;
              if (url && typeof url === "string") {
                toolRedirectUrl = url;
                break;
              }
            }
          }

          if (toolRedirectUrl) {
            console.log(
              `[AgentRuntime] Tool redirect detected: ${toolRedirectUrl}`,
            );
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "redirect", route: toolRedirectUrl })}\n\n`,
              ),
            );
          }

          // Extract NAVIGATE_TO command if present (supports full paths with query strings)
          const navMatch = fullText.match(/NAVIGATE_TO:\s*(\/[^\s]+)/);
          if (navMatch && navMatch[1]) {
            const route = navMatch[1];
            
            // Remove the navigation command from the text shown to the user
            fullText = fullText.replace(/NAVIGATE_TO:\s*\/[^\s]+/, "").trim();
            
            // Send special redirect event (only if not already redirected by tool)
            if (!toolRedirectUrl) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "redirect", route: route })}\n\n`,
                ),
              );
            }
          }

          const chunkSize = 15;
          for (let i = 0; i < fullText.length; i += chunkSize) {
            const chunk = fullText.slice(i, i + chunkSize);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text", text: chunk })}\n\n`,
              ),
            );
            await new Promise((resolve) => setTimeout(resolve, 20));
          }

          // Tool results summary
          if (allToolResults.length > 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "tool_results_summary", tools: allToolResults.map((r) => ({ name: r.toolName, success: r.success })) })}\n\n`,
              ),
            );
          }

          // Done signal
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", done: true })}\n\n`,
            ),
          );

          controller.close();

          // Save AI response to memory so the agent remembers its own messages
          try {
            const sessionMemory = getSessionMemory();
            if (event.sessionId) {
              await sessionMemory.addMessage(event.sessionId, {
                role: "model",
                content: fullText,
                timestamp: Date.now(),
                metadata:
                  allToolResults.length > 0
                    ? {
                        toolName: allToolResults
                          .map((r) => r.toolName)
                          .join(", "),
                        toolResult: allToolResults,
                      }
                    : undefined,
              });
            }
          } catch (memErr) {
            console.error(
              "[AgentRuntime] Failed to save AI stream response to memory:",
              memErr,
            );
          }
        } catch (error: any) {
          console.error("[AgentRuntime] Stream error:", error);
          const fallbackText =
            "I\'m having trouble reaching the AI service right now. Please try again in a moment. If this keeps happening, check your model API quota and keys.";

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: error.message || "Stream failed" })}\n\n`,
            ),
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text", text: fallbackText })}\n\n`,
            ),
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", done: true })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });
  }
}

// =============================================
// SINGLETON
// =============================================

let _runtime: AgentRuntime | null = null;

export function getAgentRuntime(config?: Partial<AgentConfig>): AgentRuntime {
  if (!_runtime) {
    _runtime = new AgentRuntime(config);
  }
  return _runtime;
}

export function resetAgentRuntime(): void {
  _runtime = null;
}
