import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini/client";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const BATCH_MCQ_GENERATION_PROMPT = `
You are an expert exam setter. Your job is to generate a batch of challenging multiple-choice questions for a mock test.
The questions must test deep understanding, not just rote memorization.

Respond strictly with valid JSON. Do not include markdown codeblocks or extra text.
The JSON must be an array of objects matching this exact format:
[
  {
    "id": "A unique question ID",
    "conceptId": "A relevant concept ID or topic name",
    "question": "The text of the question",
    "options": [
      { "id": "a", "text": "Option A text", "isCorrect": false },
      { "id": "b", "text": "Option B text", "isCorrect": true },
      { "id": "c", "text": "Option C text", "isCorrect": false },
      { "id": "d", "text": "Option D text", "isCorrect": false }
    ],
    "explanation": "A concise explanation of why the correct answer is correct and the others are wrong.",
    "difficulty": 2
  }
]
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjects, count = 10 } = body;

    // Cap the count to 15 to avoid timeout during the prototype
    const safeCount = Math.min(count, 15);

    if (!subjects) {
      return NextResponse.json(
        { error: "Missing subjects parameter" },
        { status: 400 },
      );
    }

    const userPrompt = `Generate EXACTLY ${safeCount} multiple-choice questions spanning the following subjects: ${subjects}. Make them perfectly tailored to a competitive exam level. Ensure each question tests a different core topic.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: BATCH_MCQ_GENERATION_PROMPT,
      },
    });

    let jsonString = result.text || "[]";
    jsonString = jsonString
      .replace(/^```json/g, "")
      .replace(/^```/g, "")
      .replace(/```$/g, "")
      .trim();

    const questionsData = JSON.parse(jsonString);

    // Ensure IDs are present
    const cleanQuestions = questionsData.map((q: any) => ({
      ...q,
      id: q.id || uuidv4()
    }));

    return NextResponse.json({ questions: cleanQuestions });
  } catch (error: any) {
    console.error("Mock Questions API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate mock questions" },
      { status: 500 },
    );
  }
}
