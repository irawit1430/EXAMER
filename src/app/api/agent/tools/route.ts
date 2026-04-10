// =============================================
// API Route: /api/agent/tools
// =============================================
// Direct tool invocation endpoint. Allows the frontend
// to call specific tools without going through the full
// agent conversation loop.
// =============================================

import { NextRequest, NextResponse } from "next/server";
import { processEvent } from "@/lib/agent";
import { getToolRegistry } from "@/lib/agent/tools";
import type { AgentEvent } from "@/lib/agent/types";
import { traceAsync } from "@/lib/tracing";
import {
  FirebaseAuthError,
  getVerifiedUidFromRequest,
} from "@/lib/firebase/auth-server";

export const runtime = "nodejs";

/**
 * POST /api/agent/tools — Execute a specific tool
 *
 * Body: {
 *   tool: string,         // Tool name (e.g., "generate_mcq")
 *   params: object,       // Tool parameters
 *   userId: string,       // User ID
 *   sessionId?: string,   // Optional session ID
 * }
 */
export async function POST(req: NextRequest) {
  return traceAsync("api.agent.tools.execute", {}, async () => {
    try {
      const authenticatedUid = await getVerifiedUidFromRequest(req);
      const body = await req.json();
      const { tool, params, sessionId } = body as {
        tool: string;
        params: Record<string, unknown>;
        sessionId?: string;
      };

      // --- Validate ---
      if (!tool) {
        return NextResponse.json(
          { error: "Missing required field: tool" },
          { status: 400 },
        );
      }

      // Check if tool exists
      const registry = getToolRegistry();
      if (!registry.getTool(tool)) {
        return NextResponse.json(
          {
            error: `Tool "${tool}" not found`,
            available_tools: registry.listToolNames(),
          },
          { status: 404 },
        );
      }

      // --- Process through gateway ---
      const event: AgentEvent = {
        type: "tool_call",
        sessionId: sessionId || `tool-${Date.now()}`,
        userId: authenticatedUid,
        payload: {
          tool,
          toolParams: params || {},
        },
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
        tool,
        result: response.data.toolCalls?.[0],
        metadata: response.data.metadata,
      });
    } catch (error: any) {
      if (error instanceof FirebaseAuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("[/api/agent/tools] Error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 },
      );
    }
  });
}

/**
 * GET /api/agent/tools — List all available tools
 */
export async function GET() {
  return traceAsync("api.agent.tools.list", {}, async () => {
    try {
      const registry = getToolRegistry();
      const tools = registry.listToolNames().map((name) => {
        const tool = registry.getTool(name);
        return {
          name: tool!.name,
          description: tool!.description,
          parameters: tool!.parameters,
          requiredParams: tool!.requiredParams,
        };
      });

      return NextResponse.json({ tools, count: tools.length });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Failed to list tools" },
        { status: 500 },
      );
    }
  });
}
