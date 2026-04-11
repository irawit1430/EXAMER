import "server-only";

import { NextRequest } from "next/server";
import { getAdminAuth } from "./admin";

export class FirebaseAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "FirebaseAuthError";
    this.status = status;
  }
}

function isFirebaseAdminConfigError(error: unknown): boolean {
  const message = String((error as any)?.message || "").toLowerCase();
  return (
    message.includes("missing firebase admin credentials") ||
    message.includes("missing firebase project id") ||
    message.includes("could not load the default credentials") ||
    message.includes("failed to determine service account") ||
    message.includes("service account")
  );
}

function getDevBypassUid(req: NextRequest): string | null {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.AGENT_ALLOW_DEV_UID_BYPASS !== "true") return null;

  const headerUid = req.headers.get("x-user-id")?.trim();
  if (!headerUid) return null;

  return headerUid;
}

export async function getVerifiedUidFromRequest(
  req: NextRequest,
): Promise<string> {
  const devBypassUid = getDevBypassUid(req);

  const authorization =
    req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    if (devBypassUid) return devBypassUid;
    throw new FirebaseAuthError(
      "Missing or invalid Authorization header. Expected Bearer token.",
    );
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    if (devBypassUid) return devBypassUid;
    throw new FirebaseAuthError("Missing Firebase ID token.");
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    if (devBypassUid) return devBypassUid;
    if (isFirebaseAdminConfigError(error)) {
      throw new FirebaseAuthError(
        "Firebase Admin auth is not configured on the server. Configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or set GOOGLE_APPLICATION_CREDENTIALS for local invocation.",
        500,
      );
    }
    throw new FirebaseAuthError("Invalid or expired Firebase ID token.");
  }
}
