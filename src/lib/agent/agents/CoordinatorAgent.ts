import { AgentRuntime } from "../agent";
import type { AgentEvent, ToolCallResult } from "../types";

const COORDINATOR_INSTRUCTION = `You are the EXAMER Coordinator Agent.
Your ONLY job is to analyze the student's message and determine which specialized agent should handle it.

Available Specialized Agents:
1. "mentor" - General tutoring, explaining concepts, answering subject-related questions, general motivation.
2. "assessment" - Requesting a mock test, active recall practice, quizzes, grading an answer.
3. "planner" - Creating a study schedule, talking about syllabus, tracking time.
4. "analytics" - Asking about scores, weak topics, kinetic scores, reading speeds.

IMPORTANT: Do not answer the question yourself. Just decide the best agent and respond with ONLY the agent's name ("mentor", "assessment", "planner", or "analytics"). If unsure, default to "mentor".`;

export class CoordinatorAgent {
  private runtime: AgentRuntime;

  constructor() {
    this.runtime = new AgentRuntime({
      systemInstruction: COORDINATOR_INSTRUCTION,
      allowedTools: [], // Coordinator usually doesn't need data-fetching tools
      temperature: 0.1, // Low temperature for deterministic routing
    });
  }

  async determineRoute(
    event: AgentEvent,
  ): Promise<"mentor" | "assessment" | "planner" | "analytics"> {
    // Determine which agent should handle this
    const response = await this.runtime.generateResponse({
      ...event,
      payload: {
        ...event.payload,
        message: `Which agent should handle this request? "${event.payload.message}"`,
      },
    });

    const route = response.text.toLowerCase().trim();
    if (["mentor", "assessment", "planner", "analytics"].includes(route)) {
      return route as any;
    }

    return "mentor"; // Default fallback
  }
}
