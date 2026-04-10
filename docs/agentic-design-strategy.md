# EXAMER Agentic Design Strategy

This project now follows a practical design-pattern strategy adapted from Google Cloud's guidance for agentic AI systems.

## 1) Default Pattern: Single-Agent + ReAct

Primary conversation flow stays in a single agent with tool use:

- Runtime: src/lib/agent/agent.ts
- Endpoint: src/app/api/agent/chat/route.ts

Why this fits EXAMER:

- Fast product iteration for tutor chat
- Strong personalization in one place (profile + session memory)
- Lower complexity than multi-agent orchestration for day-to-day mentoring

How ReAct is implemented:

- The model reasons, calls tools, observes results, then answers.
- The loop is bounded to avoid runaway iterations.

## 2) Deterministic Workflows: Direct Tool Calls

For predictable operations, use deterministic paths instead of full autonomous routing:

- Endpoint: src/app/api/agent/tools/route.ts
- Gateway handler: tool_call event in src/lib/agent/gateway.ts

Use cases:

- Generate quiz questions
- Evaluate an answer
- Fetch syllabus and study stats

This mirrors sequential/deterministic design principles and keeps latency and cost predictable.

## 3) Loop Guardrails (Cost + Reliability)

ReAct-style loops are now constrained with explicit exit conditions in agent config:

- maxToolLoopIterations: max reasoning/tool rounds
- maxToolCallsPerTurn: max total tool calls for one user turn
- maxToolLoopDurationMs: max wall-clock time for tool loop

These are defined in src/lib/agent/types.ts and enforced in src/lib/agent/agent.ts.

## 4) Human-in-the-Loop Guidance for EXAMER

For high-stakes operations, add a manual checkpoint pattern before irreversible actions. In this education app, examples include:

- Account-impacting changes
- Sensitive content decisions
- Administrative overrides

Current implementation keeps technical constraints in place and leaves room to add explicit approval checkpoints in API routes when needed.

## 5) Pattern Mapping by Endpoint

- /api/agent/chat -> Single-Agent + ReAct
- /api/agent/tools -> Deterministic Tool Invocation
- /api/agent/session -> Deterministic Session Lifecycle

## 6) Next Evolution (When Needed)

Only introduce multi-agent coordination when one agent becomes a bottleneck:

- Coordinator pattern for dynamic routing between specialized subagents
- Review-and-critique for stricter output QA (e.g., generated study plans)
- Hierarchical decomposition only for very complex long-horizon planning

Keep the architecture simple until measurable quality or throughput constraints require extra orchestration.
