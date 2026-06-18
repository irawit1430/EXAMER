import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { waitUntil } from "@vercel/functions";
import { getUserByWhatsAppNumber } from "@/lib/firebase/firestore-admin";
import { buildMentorPrompt, streamMentorResponse } from "@/lib/gemini/client";
import { AIContextPayload } from "@/types";


/**
 * GET requests are typically used by WhatsApp/Meta to verify the webhook URL.
 */
export async function GET(req: NextRequest) {
  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!WHATSAPP_VERIFY_TOKEN) {
    console.error(
      "Critical Configuration Error: WHATSAPP_VERIFY_TOKEN is not set.",
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe") {
      const tokenHash = crypto.createHash('sha256').update(token).digest();
      const verifyTokenHash = crypto.createHash('sha256').update(WHATSAPP_VERIFY_TOKEN).digest();

      if (crypto.timingSafeEqual(tokenHash, verifyTokenHash)) {
        // Return the challenge as plain text to pass verification
        return new NextResponse(challenge, { status: 200 });
      } else {
        return new NextResponse("Forbidden", { status: 403 });
      }
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

async function handleWhatsAppMessageBackground(from: string, msgBody: string) {
  try {
    // 1. Look up user by phone number
    // Clean up the incoming phone number just in case (Meta usually sends it as country code + number)
    const cleanedPhone = from.startsWith("+") ? from : `+${from}`;

    const user = await getUserByWhatsAppNumber(cleanedPhone);
    if (!user) {
      console.log(`No user found for phone number: ${cleanedPhone}`);
      return;
    }

    // 2. Build context and get Gemini AI response
    const contextPayload: AIContextPayload = {
      currentState: "WhatsApp Chat",
      currentTopic: "General Study",
      timeSpent: "0m",
      recentErrors: 0,
      streak: user.streak?.current || 0,
      predictedScore: user.predictedScore || 0,
      daysToExam: user.examDate
        ? Math.max(
            0,
            Math.ceil(
              (user.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            ),
          )
        : 0,
      weaknesses: [],
      joinDate: user.createdAt.toISOString().split("T")[0],
      targetScore: user.targetScore || 100,
      prepLevel: user.prepLevel || "Beginner",
      favoriteSubject: user.favoriteSubject || "Everything",
      importantMemories: [],
    };

    const prompt = buildMentorPrompt(contextPayload, msgBody);
    const responseStream = await streamMentorResponse(prompt);

    let fullResponse = "";
    for await (const chunk of responseStream.stream) {
      fullResponse += chunk.text;
    }

    // 3. Send WhatsApp reply via Meta Graph API
    if (fullResponse) {
      const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
      const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
        console.error(
          "Missing WhatsApp API credentials in environment variables.",
        );
        return;
      }

      const response = await fetch(
        `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: fullResponse },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to send WhatsApp message:", errorData);
      } else {
        console.log(`Successfully replied to ${from}`);
      }
    }
  } catch (error) {
    console.error("Error in background WhatsApp job:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.clone().text();
    const signatureHeader = req.headers.get("x-hub-signature-256");
    const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;

    if (!signatureHeader || !WHATSAPP_APP_SECRET) {
      console.error("Missing signature header or WHATSAPP_APP_SECRET.");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const signature = signatureHeader.replace("sha256=", "");
    const expectedSignature = crypto
      .createHmac("sha256", WHATSAPP_APP_SECRET)
      .update(rawBody)
      .digest("hex");

    // Securely compare signatures by hashing both to guarantee matching byte lengths
    const providedHash = crypto.createHash("sha256").update(signature).digest();
    const expectedHash = crypto.createHash("sha256").update(expectedSignature).digest();

    if (!crypto.timingSafeEqual(providedHash, expectedHash)) {
      console.error("Invalid WhatsApp webhook signature.");
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = JSON.parse(rawBody);

    // Verify it's from the expected WhatsApp API structure
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const phoneNumberId =
          body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from; // sender's phone number
        const msgBody = body.entry[0].changes[0].value.messages[0].text.body;

        console.log(`Received message from ${from}: ${msgBody}`);

        waitUntil(handleWhatsAppMessageBackground(from, msgBody));

        return new NextResponse("EVENT_RECEIVED", { status: 200 });
      }
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } else {
      return new NextResponse("Not a WhatsApp API event", { status: 404 });
    }
  } catch (error: unknown) {
    console.error("WhatsApp Webhook Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
