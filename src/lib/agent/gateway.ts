// =============================================
// EXAMER Agent — Gateway (Central Control Plane)
// =============================================
// The single entry point for all agent interactions.
// Routes events, coordinates sessions, and manages the
// full pipeline: validate → load memory → delegate → persist.
// =============================================

import { getSessionMemory, getLongTermMemory } from "./memory";
import { getToolRegistry } from "./tools";
import { traceAsync } from "@/lib/tracing";
import { CoordinatorAgent } from "./agents/CoordinatorAgent";
import { StudyMentorAgent } from "./agents/StudyMentorAgent";
import { AssessmentAgent } from "./agents/AssessmentAgent";
import { PlannerAgent } from "./agents/PlannerAgent";
import { AnalyticsAgent } from "./agents/AnalyticsAgent";

// Initialize Agent Instances
const coordinatorAgent = new CoordinatorAgent();
const agents = {
  mentor: new StudyMentorAgent(),
  assessment: new AssessmentAgent(),
  planner: new PlannerAgent(),
  analytics: new AnalyticsAgent(),
};
import type {
  AgentEvent,
  AgentResponse,
  AgentEventType,
  ConversationMessage,
  ToolCallResult,
  PerformanceSummary,
} from "./types";

// =============================================
// EVENT VALIDATION
// =============================================

function validateEvent(event: Partial<AgentEvent>): {
  valid: boolean;
  error?: string;
} {
  if (!event.type) {
    return { valid: false, error: "Missing event type" };
  }

  const validTypes: AgentEventType[] = [
    "chat",
    "tool_call",
    "session_start",
    "session_end",
    "evaluate",
    "mentor_trigger",
    "feynman",
  ];

  if (!validTypes.includes(event.type as AgentEventType)) {
    return {
      valid: false,
      error: `Invalid event type: "${event.type}". Valid types: ${validTypes.join(", ")}`,
    };
  }

  if (!event.sessionId) {
    return { valid: false, error: "Missing sessionId" };
  }

  if (!event.userId) {
    return { valid: false, error: "Missing userId" };
  }

  // Type-specific validation
  if (event.type === "chat" && !event.payload?.message) {
    return { valid: false, error: "Chat event requires payload.message" };
  }

  if (
    event.type === "tool_call" &&
    (!event.payload?.tool || !event.payload?.toolParams)
  ) {
    return {
      valid: false,
      error: "Tool call event requires payload.tool and payload.toolParams",
    };
  }

  return { valid: true };
}

// =============================================
// EVENT HANDLERS
// =============================================

/**
 * Handle chat events — the main conversational flow
 */
async function handleChat(event: AgentEvent): Promise<AgentResponse> {
  const sessionMemory = getSessionMemory();

  return traceAsync(
    "agent.handle_chat",
    {
      "agent.session_id": event.sessionId,
      "agent.user_id": event.userId,
    },
    async () => {
      // Ensure session exists
      sessionMemory.createSession(event.sessionId, event.userId);

      // Record the user's message
      await sessionMemory.addMessage(event.sessionId, {
        role: "user",
        content: event.payload.message!,
        timestamp: Date.now(),
      });

      // 1. Coordinator determines the route
      const route = event.payload.targetAgent || await coordinatorAgent.determineRoute(event);
      console.log(`[Coordinator] Routing chat to: ${route}`);
      const runtime = agents[route];

      // 2. Specialized agent generates response
      const { text, toolResults } = await runtime.generateResponse(event);

      // Record the assistant's response
      await sessionMemory.addMessage(event.sessionId, {
        role: "model",
        content: text,
        timestamp: Date.now(),
        metadata: {
          agentName: route,
          ...(toolResults.length > 0
            ? {
                toolName: toolResults.map((r) => r.toolName).join(", "),
                toolResult: toolResults,
              }
            : {}),
        }
      });

      return {
        type: "text",
        sessionId: event.sessionId,
        data: {
          text,
          toolCalls: toolResults.length > 0 ? toolResults : undefined,
        },
        timestamp: Date.now(),
      };
    },
  );
}

/**
 * Handle streaming chat events — returns SSE stream
 */
async function handleStreamingChat(event: AgentEvent): Promise<AgentResponse> {
  const sessionMemory = getSessionMemory();

  return traceAsync(
    "agent.handle_streaming_chat",
    {
      "agent.session_id": event.sessionId,
      "agent.user_id": event.userId,
    },
    async () => {
      // Ensure session exists
      sessionMemory.createSession(event.sessionId, event.userId);

      // Record the user's message
      await sessionMemory.addMessage(event.sessionId, {
        role: "user",
        content: event.payload.message!,
        timestamp: Date.now(),
      });

      // 1. Coordinator determines the route
      const route = event.payload.targetAgent || await coordinatorAgent.determineRoute(event);
      console.log(`[Coordinator] Routing streaming request to: ${route}`);
      const runtime = agents[route];

      // 2. Route the request
      const stream = await runtime.streamResponse(event);

      return {
        type: "stream",
        sessionId: event.sessionId,
        data: { stream },
        timestamp: Date.now(),
      };
    },
  );
}

/**
 * Handle direct tool invocations from the frontend
 */
async function handleToolCall(event: AgentEvent): Promise<AgentResponse> {
  const toolRegistry = getToolRegistry();
  const toolName = event.payload.tool!;
  const params = event.payload.toolParams!;

  // Enforce authenticated user_id to avoid model/client-supplied placeholders
  if (event.userId) {
    const providedUserId =
      typeof params.user_id === "string" ? params.user_id.trim() : "";
    const looksLikePlaceholder =
      !providedUserId || /^(student|user|me|myself)$/i.test(providedUserId);
    if (looksLikePlaceholder || providedUserId !== event.userId) {
      params.user_id = event.userId;
    }
  }

  return traceAsync(
    "agent.handle_tool_call",
    {
      "agent.session_id": event.sessionId,
      "agent.user_id": event.userId,
      "tool.name": toolName,
    },
    async () => {
      const result = await toolRegistry.execute(toolName, params);

      return {
        type: "tool_result",
        sessionId: event.sessionId,
        data: {
          toolCalls: [result],
          metadata: {
            toolName,
            executionTimeMs: result.executionTimeMs,
          },
        },
        timestamp: Date.now(),
      };
    },
  );
}

/**
 * Handle session start — initialize memory and greet student
 */
async function handleSessionStart(event: AgentEvent): Promise<AgentResponse> {
  const sessionMemory = getSessionMemory();
  const ltm = getLongTermMemory();

  return traceAsync(
    "agent.handle_session_start",
    {
      "agent.session_id": event.sessionId,
      "agent.user_id": event.userId,
    },
    async () => {
      // Create new session
      const session = sessionMemory.createSession(
        event.sessionId,
        event.userId,
      );

      // Load/create long-term profile
      const profile = await ltm.loadProfile(event.userId);
      const profileLoaded =
        profile.displayName !== "Student" ||
        profile.totalSessions > 0 ||
        profile.weakTopics.length > 0 ||
        profile.importantMemories.length > 0 ||
        !!profile.favoriteSubject ||
        !!profile.examDate;

      return {
        type: "session_created",
        sessionId: event.sessionId,
        data: {
          text: "Session initialized.",
          metadata: {
            sessionId: event.sessionId,
            userId: event.userId,
            profileLoaded,
            totalPreviousSessions: profile.totalSessions,
            weakTopicsCount: profile.weakTopics.length,
            lastSession: profile.lastSessionAt || "First session",
          },
        },
        timestamp: Date.now(),
      };
    },
  );
}

/**
 * Handle session end — summarize, persist to long-term memory, clean up
 */
async function handleSessionEnd(event: AgentEvent): Promise<AgentResponse> {
  const sessionMemory = getSessionMemory();
  const ltm = getLongTermMemory();

  return traceAsync(
    "agent.handle_session_end",
    {
      "agent.session_id": event.sessionId,
      "agent.user_id": event.userId,
    },
    async () => {
      const session = sessionMemory.getSession(event.sessionId);
      if (!session) {
        return {
          type: "error",
          sessionId: event.sessionId,
          data: { error: `Session ${event.sessionId} not found` },
          timestamp: Date.now(),
        };
      }

      // Generate session summary
      const summary = await sessionMemory.generateSessionSummary(
        event.sessionId,
      );

      // Log performance to long-term memory
      const performanceSummary: PerformanceSummary = {
        date: new Date().toISOString(),
        sessionId: event.sessionId,
        conceptsStudied: session.conceptsDiscussed,
        questionsAttempted: 0, // Will be updated by tools during session
        correctAnswers: 0,
        averageSpeed: 0,
        predictedScoreAtTime: event.payload.context?.predictedScore || 0,
        notes: summary,
      };

      await ltm.logPerformance(event.userId, performanceSummary);

      // Clean up session
      sessionMemory.destroySession(event.sessionId);

      return {
        type: "session_ended",
        sessionId: event.sessionId,
        data: {
          sessionSummary: summary,
          metadata: {
            duration: Date.now() - session.startedAt,
            messagesExchanged: session.messages.length,
            conceptsDiscussed: session.conceptsDiscussed,
            toolsUsed: session.toolsUsed,
          },
        },
        timestamp: Date.now(),
      };
    },
  );
}

/**
 * Handle mentor trigger events (system-initiated interventions)
 */
async function handleMentorTrigger(event: AgentEvent): Promise<AgentResponse> {
  // Mentor triggers work just like chat but with a specific trigger context
  const trigger = event.payload.trigger || "manual";

  // Construct a trigger-specific message if none provided
  if (!event.payload.message) {
    const triggerMessages: Record<string, string> = {
      idle: "The student has been idle. Give them a motivational nudge to get back to studying.",
      errors:
        "The student has been making many errors. Offer targeted help without being condescending.",
      high_speed:
        "The student is answering very fast — they might be rushing. Warn them to slow down and think.",
      session_start:
        "A new study session just started. Greet the student and set the agenda based on their weak topics.",
      manual: "The student clicked the mentor button. Ask how you can help.",
    };

    event.payload.message = triggerMessages[trigger] || triggerMessages.manual;
  }

  return handleStreamingChat(event);
}

// =============================================
// MAIN GATEWAY — Central event processor
// =============================================

/**
 * Process any incoming agent event through the gateway
 * This is the single entry point for all agent interactions
 */
export async function processEvent(event: AgentEvent): Promise<AgentResponse> {
  const startTime = Date.now();

  return traceAsync(
    "agent.process_event",
    {
      "agent.event_type": event.type,
      "agent.session_id": event.sessionId || "unknown",
      "agent.user_id": event.userId || "unknown",
    },
    async () => {
      // 1. VALIDATE
      const validation = validateEvent(event);
      if (!validation.valid) {
        return {
          type: "error",
          sessionId: event.sessionId || "unknown",
          data: { error: validation.error },
          timestamp: Date.now(),
        };
      }

      // 2. ROUTE to appropriate handler
      try {
        console.log(
          `[Gateway] Processing event: type=${event.type}, session=${event.sessionId}, user=${event.userId}`,
        );

        let response: AgentResponse;

        switch (event.type) {
          case "chat":
            response = await handleStreamingChat(event);
            break;

          case "tool_call":
            response = await handleToolCall(event);
            break;

          case "session_start":
            response = await handleSessionStart(event);
            break;

          case "session_end":
            response = await handleSessionEnd(event);
            break;

          case "mentor_trigger":
            response = await handleMentorTrigger(event);
            break;

          case "evaluate":
            // Evaluation is handled as a tool call
            event.payload.tool = "evaluate_user_answer";
            event.payload.toolParams = event.payload.toolParams || {};
            response = await handleToolCall(event);
            break;

          case "feynman":
            // Feynman evaluation flows through chat with specific context
            event.payload.message =
              event.payload.message || "Evaluate my explanation";
            response = await handleStreamingChat(event);
            break;

          default:
            response = {
              type: "error",
              sessionId: event.sessionId,
              data: { error: `Unhandled event type: ${event.type}` },
              timestamp: Date.now(),
            };
        }

        const elapsed = Date.now() - startTime;
        console.log(
          `[Gateway] Event processed in ${elapsed}ms: type=${event.type}`,
        );

        return response;
      } catch (error: any) {
        console.error(`[Gateway] Error processing event:`, error);
        return {
          type: "error",
          sessionId: event.sessionId,
          data: { error: error.message || "Internal gateway error" },
          timestamp: Date.now(),
        };
      }
    },
  );
}

/**
 * Process a streaming chat event (convenience wrapper)
 * Returns the raw ReadableStream for SSE responses
 */
export async function processStreamingChat(
  sessionId: string,
  userId: string,
  message: string,
  context?: AgentEvent["payload"]["context"],
  trigger?: string,
  targetAgent?: "mentor" | "assessment" | "planner" | "analytics",
): Promise<ReadableStream<Uint8Array>> {
  const event: AgentEvent = {
    type: trigger ? "mentor_trigger" : "chat",
    sessionId,
    userId,
    payload: {
      message,
      context,
      trigger,
      targetAgent,
    },
    timestamp: Date.now(),
  };

  const response = await processEvent(event);

  if (response.type === "error") {
    // Return error as stream
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: response.data.error })}\n\n`,
          ),
        );
        controller.close();
      },
    });
  }

  return response.data.stream!;
}
