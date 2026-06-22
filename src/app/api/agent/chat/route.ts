// =============================================
// API Route: /api/agent/chat
// =============================================
// Main conversational endpoint. Handles both user-initiated
// chat and system-triggered mentor interventions.
// Returns Server-Sent Events (SSE) for streaming responses.
// =============================================

import { NextRequest } from "next/server";
import { processStreamingChat } from "@/lib/agent";
import { getSessionMemory } from "@/lib/agent/memory";
import type { AgentContext } from "@/lib/agent/types";
import { traceAsync } from "@/lib/tracing";
import {
  FirebaseAuthError,
  getVerifiedUidFromRequest,
} from "@/lib/firebase/auth-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return traceAsync("api.agent.chat", {}, async () => {
    try {
      const body = await req.json();
      const authenticatedUid = await getVerifiedUidFromRequest(req);

      const { sessionId, message, context, trigger, targetAgent } = body as {
        sessionId: string;
        userId?: string;
        message: string;
        context?: AgentContext;
        trigger?: string;
        targetAgent?: "mentor" | "assessment" | "planner" | "analytics";
      };

      // --- Validate required fields ---
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "Missing required field: sessionId" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (!message && !trigger) {
        return new Response(
          JSON.stringify({ error: "Either message or trigger is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // --- Process through gateway ---
      const stream = await processStreamingChat(
        sessionId,
        authenticatedUid,
        message || "",
        context,
        trigger,
        targetAgent,
      );

      // --- Return SSE stream ---
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Session-Id": sessionId,
        },
      });
    } catch (error: any) {
      if (error instanceof FirebaseAuthError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.error("[/api/agent/chat] Error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Internal server error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  });
}
