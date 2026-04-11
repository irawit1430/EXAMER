import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Secret token for verifying WhatsApp webhook requests (e.g., from Twilio or Meta Graph API)
const WHATSAPP_VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "examer_webhook_secret";

/**
 * GET requests are typically used by WhatsApp/Meta to verify the webhook URL.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      // Return the challenge as plain text to pass verification
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

/**
 * POST requests handle incoming messages from students.
 * We can use this to let students text "Stats" or "Streaks" to the bot,
 * and integrate with the AI Mentor to reply.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify it's from the expected WhatsApp API structure
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const phoneNumberId =
          body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from; // sender's phone number
        const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

        console.log(`Received message from ${from}: ${msgBody}`);

        // TODO: In Phase 10 (Cloud Functions), we will trigger a background job to:
        // 1. Look up user by phone number
        // 2. Pass message to Gemini AI Mentor
        // 3. Send WhatsApp reply via Meta Graph API

        return new NextResponse("EVENT_RECEIVED", { status: 200 });
      }
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      return new NextResponse("Not a WhatsApp API event", { status: 404 });
    }
  } catch (error: any) {
    console.error("WhatsApp Webhook Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
