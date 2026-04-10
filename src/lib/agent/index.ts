// =============================================
// EXAMER Agent — Barrel Export
// =============================================
// Clean public API for the agent architecture.
// Import everything from '@/lib/agent' in your code.
// =============================================

// Gateway (main entry point)
export { processEvent, processStreamingChat } from "./gateway";

// Agent Runtime
export { AgentRuntime, getAgentRuntime, resetAgentRuntime } from "./agent";

// Tools
export { ToolRegistry, getToolRegistry, resetToolRegistry } from "./tools";

// Memory
export {
  SessionMemoryManager,
  LongTermMemoryManager,
  getSessionMemory,
  getLongTermMemory,
} from "./memory";

// Types
export type {
  AgentEvent,
  AgentResponse,
  AgentEventType,
  AgentResponseType,
  AgentContext,
  AgentConfig,
  ToolDefinition,
  ToolCallResult,
  ToolParameterSchema,
  GeminiFunctionDeclaration,
  ConversationMessage,
  SessionMemory,
  LongTermProfile,
  WeakTopicEntry,
  PerformanceSummary,
  GeneratedMCQ,
  AnswerEvaluation,
  SyllabusTopic,
} from "./types";

export { DEFAULT_AGENT_CONFIG } from "./types";
