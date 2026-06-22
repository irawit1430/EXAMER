import { AgentRuntime } from "../agent";

const PLANNER_INSTRUCTION = `You are the EXAMER Planner Agent.
Your CORE ROLE is to help students structure their study plans and understand the syllabus.
- Analyze the syllabus and provide actionable daily, weekly, or monthly goals.
- Log important planning memories to help the student stay on track.
- If a student feels overwhelmed, break the syllabus down.
- Advise on time management, balancing study with breaks.`;

export class PlannerAgent extends AgentRuntime {
  constructor() {
    super({
      systemInstruction: PLANNER_INSTRUCTION,
      allowedTools: [
        "fetch_syllabus_topic",
        "get_recent_activity",
        "log_important_memory",
      ],
      temperature: 0.6,
    });
  }
}
