// =============================================
// API Route: /api/agent/session
// =============================================
// Session lifecycle management endpoint.
// POST — Create a new session
// DELETE — End a session (summarize + persist)
// GET — Get session status
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { processEvent } from "@/lib/agent";
import { getSessionMemory } from "@/lib/agent/memory";
import type { AgentEvent } from "@/lib/agent/types";
import { traceAsync } from "@/lib/tracing";
import {
  FirebaseAuthError,
  getVerifiedUidFromRequest,
} from "@/lib/firebase/auth-server";

export const runtime = "nodejs";

/**
 * POST /api/agent/session — Create a new study session
 *
 * Body: {
 *   userId: string,
 *   context?: AgentContext,  // Optional initial context
 * }
 */
export async function POST(req: NextRequest) {
  return traceAsync("api.agent.session.create", {}, async () => {
    try {
      const authenticatedUid = await getVerifiedUidFromRequest(req);
      const body = await req.json();
      const { context } = body;

      // Generate a unique session ID
      const sessionId = `session_${authenticatedUid}_${Date.now()}_${crypto.randomUUID().split('-')[0]}`;

      const event: AgentEvent = {
        type: "session_start",
        sessionId,
        userId: authenticatedUid,
        payload: { context },
        timestamp: Date.now(),
      };

      const response = await processEvent(event);

      if (response.type === "error") {
        return NextResponse.json(
          { error: response.data.error },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        sessionId,
        ...response.data.metadata,
      });
    } catch (error: any) {
      if (error instanceof FirebaseAuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("[/api/agent/session] POST Error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create session" },
        { status: 500 },
      );
    }
  });
}

/**
 * DELETE /api/agent/session — End a study session
 *
 * Body: {
 *   sessionId: string,
 *   userId: string,
 *   context?: AgentContext,  // Final context snapshot
 * }
 */
export async function DELETE(req: NextRequest) {
  return traceAsync("api.agent.session.delete", {}, async () => {
    try {
      const authenticatedUid = await getVerifiedUidFromRequest(req);
      const body = await req.json();
      const { sessionId, context } = body;

      if (!sessionId) {
        return NextResponse.json(
          { error: "Missing required field: sessionId" },
          { status: 400 },
        );
      }

      const event: AgentEvent = {
        type: "session_end",
        sessionId,
        userId: authenticatedUid,
        payload: { context },
        timestamp: Date.now(),
      };

      const response = await processEvent(event);

      if (response.type === "error") {
        return NextResponse.json(
          { error: response.data.error },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        sessionId,
        summary: response.data.sessionSummary,
        ...response.data.metadata,
      });
    } catch (error: any) {
      if (error instanceof FirebaseAuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("[/api/agent/session] DELETE Error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to end session" },
        { status: 500 },
      );
    }
  });
}

/**
 * GET /api/agent/session — Get session status
 *
 * Query: ?sessionId=xxx&userId=xxx
 */
export async function GET(req: NextRequest) {
  return traceAsync("api.agent.session.get", {}, async () => {
    try {
      const authenticatedUid = await getVerifiedUidFromRequest(req);
      const { searchParams } = new URL(req.url);
      const sessionId = searchParams.get("sessionId");

      const sessionMemory = getSessionMemory();

      if (sessionId) {
        // Get specific session
        const session = sessionMemory.getSession(sessionId);
        if (!session) {
          return NextResponse.json(
            { error: `Session ${sessionId} not found`, active: false },
            { status: 404 },
          );
        }

        if (session.userId !== authenticatedUid) {
          return NextResponse.json(
            {
              error: "Session does not belong to the authenticated user",
              active: false,
            },
            { status: 403 },
          );
        }

        return NextResponse.json({
          active: true,
          sessionId: session.sessionId,
          userId: session.userId,
          messageCount: session.messages.length,
          conceptsDiscussed: session.conceptsDiscussed,
          toolsUsed: session.toolsUsed,
          startedAt: session.startedAt,
          lastActivityAt: session.lastActivityAt,
          duration: Date.now() - session.startedAt,
        });
      } else {
        // List all sessions for user
        const userId = authenticatedUid;
        const sessions = sessionMemory.getUserSessions(userId);
        return NextResponse.json({
          userId,
          activeSessions: sessions,
          count: sessions.length,
        });
      }
    } catch (error: any) {
      if (error instanceof FirebaseAuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("[/api/agent/session] GET Error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to get session info" },
        { status: 500 },
      );
    }
  });
}
