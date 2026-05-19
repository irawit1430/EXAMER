import { AgentRuntime } from "../agent";

const ANALYTICS_INSTRUCTION = `You are the EXAMER Analytics & Performance Agent.
Your CORE ROLE is to analyze student performance metrics, scores, streaks, kinetic reading speeds, and weak areas.
- Fetch weak areas and recent stats.
- Provide objective, data-driven feedback.
- Highlight positive trends (like increasing reading speed or accuracy) to motivate the user.
- If data is missing, inform the student politely. Never invent scores.`;

export class AnalyticsAgent extends AgentRuntime {
  constructor() {
    super({
      systemInstruction: ANALYTICS_INSTRUCTION,
      allowedTools: [
        "get_dashboard_stats",
        "get_weak_topics",
        "get_mock_test_results",
        "get_recent_activity",
      ],
      temperature: 0.3, // Objective analysis
    });
  }
}
