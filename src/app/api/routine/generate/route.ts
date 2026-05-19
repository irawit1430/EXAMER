import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini/client";
import {
  getVerifiedUidFromRequest,
  FirebaseAuthError,
} from "@/lib/firebase/auth-server";

export const runtime = "nodejs";

const ROUTINE_GENERATION_PROMPT = `
You are an expert mentor AI. Your task is to generate a personalized, day-by-day study routine based on the provided syllabus, user's current preparation level, target daily study time, and favorite subject.

The output MUST be a valid JSON object matching the exact format shown below.
Do NOT include markdown like \`\`\`json. Return ONLY the raw JSON object.

Format:
{
  "dayPlan": [
    {
      "dayNumber": 1,
      "focus": "Brief 3-4 word focus",
      "tasks": [
        {
          "timeSlot": "Morning/Afternoon/Evening",
          "subject": "Subject Name",
          "topic": "Specific Topic to Study",
          "durationMinutes": 60,
          "type": "learning | review | practice"
        }
      ]
    }
  ],
  "overallStrategy": "A short, 2-3 sentence motivational and strategic advice for this user."
}

Rules:
1. Ensure the total daily study time roughly matches their requested 'dailyStudyTime'.
2. Prioritize harder subjects or weak areas if their 'prepLevel' is low.
3. If they have a 'favoriteSubject', use it as a warmup or confidence booster.
4. Keep the plan to 7 days (day 1 to 7) to start.
`;

export async function POST(req: NextRequest) {
  try {
    await getVerifiedUidFromRequest(req);
    const body = await req.json();
    const { syllabus, prepLevel, dailyStudyTime, favoriteSubject } = body;

    if (!syllabus) {
      return NextResponse.json(
        { error: "Syllabus data is required" },
        { status: 400 },
      );
    }

    const promptContext = `
User Context:
- Preparation Level: ${prepLevel || "Unknown"}
- Target Daily Study Time: ${dailyStudyTime ? dailyStudyTime + " hours" : "Unknown"}
- Favorite Subject: ${favoriteSubject || "None specified"}

Syllabus to cover (JSON format):
${syllabus}
        `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptContext,
      config: {
        systemInstruction: ROUTINE_GENERATION_PROMPT,
      },
    });

    let jsonString = result.text || "";
    jsonString = jsonString
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsedRoutine = JSON.parse(jsonString);
      return NextResponse.json(parsedRoutine);
    } catch (parseError) {
      console.error("Failed to parse Gemini routine output:", jsonString);
      return NextResponse.json(
        { error: "Failed to generate valid JSON routine" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    if (error instanceof FirebaseAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Routine Generation API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
