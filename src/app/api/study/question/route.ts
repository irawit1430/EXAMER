import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini/client";
import { v4 as uuidv4 } from "uuid";
import { getVerifiedUidFromRequest, FirebaseAuthError } from "@/lib/firebase/auth-server";

export const runtime = "nodejs";

const MCQ_GENERATION_PROMPT = `
You are an expert exam setter. Your job is to generate ONE single challenging multiple-choice question to test a student's active recall right after they learned a concept.
The question must test deep understanding, not just rote memorization.

Respond strictly with valid JSON. Do not include markdown codeblocks or extra text.
The JSON must follow this exact format:
{
  "id": "A unique question ID",
  "conceptId": "The concept ID passed to you",
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
`;

export async function POST(req: NextRequest) {
  try {
    await getVerifiedUidFromRequest(req);
    const body = await req.json();
    const { concept, subject, conceptId } = body;

    if (!concept || !subject) {
      return NextResponse.json(
        { error: "Missing concept or subject parameter" },
        { status: 400 },
      );
    }

    const userPrompt = `Generate a single multiple-choice question testing the core intuition of the concept "${concept}" in the subject "${subject}". The conceptId is "${conceptId || uuidv4()}". Make it perfectly tailored to a competitive exam level.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: MCQ_GENERATION_PROMPT,
      },
    });

    let jsonString = result.text || "{}";
    jsonString = jsonString
      .replace(/^```json/g, "")
      .replace(/^```/g, "")
      .replace(/```$/g, "")
      .trim();

    const questionData = JSON.parse(jsonString);

    return NextResponse.json({ question: questionData });
  } catch (error: any) {
    if (error instanceof FirebaseAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Study Question Generation API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate study question" },
      { status: 500 },
    );
  }
}
