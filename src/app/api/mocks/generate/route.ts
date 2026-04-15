import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini/client";
import {
  getVerifiedUidFromRequest,
  FirebaseAuthError,
} from "@/lib/firebase/auth-server";

export async function POST(req: NextRequest) {
  try {
    await getVerifiedUidFromRequest(req);
    const data = await req.json();

    const promptContext = `
      User Target Exam: ${data.targetExam || "Generic"}
      Target Score: ${data.targetScore || "N/A"}
      Prep Level: ${data.prepLevel || "Beginner"}
      Study Time: ${data.dailyStudyTime || "2 hours"}
      Favorite Subject: ${data.favoriteSubject || "Any"}
      Syllabus/Subjects: ${data.syllabus || "Default Subjects"}
    `;

    const systemPrompt = `You are an expert exam setter. Generate an array of 4 personalized mock test configurations based on the student's profile.
    Respond ONLY with valid JSON. Do not include markdown codeblocks or extra text.
    The response should be an array of objects shaped exactly like this:
    [
      {
        "id": "<A random unique uuid-like string>",
        "name": "<Test Name (e.g. subject specific or full mock)>",
        "questions": <Number of questions, e.g. 50 or 150>,
        "duration": "<String duration e.g. '60 min'>",
        "difficulty": "<'Easy' | 'Medium' | 'Hard'>",
        "subjects": ["Subject 1", "Subject 2"],
        "unlockCriteria": { "minConceptsMastered": <Number, start at 0 and scale up> }
      }
    ]
    
    Make the tests progressively harder. The first test should have 0 for minConceptsMastered. Make the tests highly relevant to their target exam and syllabus. Use their favorite subject for at least one focused test.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptContext,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    let jsonString = result.text || "[]";
    jsonString = jsonString
      .replace(/^```json/g, "")
      .replace(/^```/g, "")
      .replace(/```$/g, "")
      .trim();

    const mockTests = JSON.parse(jsonString);

    return NextResponse.json(mockTests);
  } catch (error: any) {
    if (error instanceof FirebaseAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Mock Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate mock tests" },
      { status: 500 },
    );
  }
}
