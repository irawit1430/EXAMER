import { NextRequest, NextResponse } from "next/server";
import { getUserByWhatsappNumber } from "@/lib/firebase/firestore-admin";
import { processStreamingChat } from "@/lib/agent";
import { AgentContext } from "@/lib/agent/types";


export const runtime = "nodejs";

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
      console.log("WEBHOOK_VERIFIED");
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

        // 1. Look up user by phone number
        // Ensure it has a leading '+' or format appropriately depending on your DB contents
        const user = await getUserByWhatsappNumber(from);

        if (user) {
          // 2. Pass message to Gemini AI Mentor
          const context: AgentContext = {
            currentTopic: "General Inquiry",
            currentSubject: "General",
            timeSpent: "0 minutes",
            recentErrors: 0,
            streak: user.streak?.current || 0,
            predictedScore: user.predictedScore || 0,
            targetScore: user.targetScore || 0,
            daysToExam: user.examDate ? Math.max(0, Math.ceil((new Date(user.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
            weaknesses: [],
            prepLevel: user.prepLevel || "Unknown",
            favoriteSubject: user.favoriteSubject || "None",
            importantMemories: []
          };

          const sessionId = "whatsapp_" + user.uid;

          try {
             const stream = await processStreamingChat(
               sessionId,
               user.uid,
               msgBody,
               context,
               "manual"
             );

             // Gather the response from stream
             const reader = stream.getReader();
             const decoder = new TextDecoder();
             let aiResponse = "";
             while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                   if (line.startsWith('data: ')) {
                       const data = line.slice(6);
                       if (data === '[DONE]') continue;
                       try {
                           const parsed = JSON.parse(data);
                           if (parsed.type === 'message' && parsed.content) {
                               aiResponse += parsed.content;
                           }
                       } catch(e) {}
                   }
                }
             }

             // 3. Send WhatsApp reply via Meta Graph API
             if (aiResponse) {
                const META_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
                if (META_TOKEN) {
                    await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
                        method: 'POST',
                        headers: {
                           'Authorization': `Bearer ${META_TOKEN}`,
                           'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messaging_product: "whatsapp",
                            to: from,
                            type: "text",
                            text: { body: aiResponse }
                        })
                    });
                }
             }
          } catch(e) {
             console.error("AI or Meta Graph Error:", e);
          }
        } else {
            console.log(`No user found with whatsappNumber: ${from}`);
        }

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
