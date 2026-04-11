import { NextRequest, NextResponse } from "next/server";
import { getLLMProvider } from "@/lib/llm/provider";

export const runtime = "nodejs";

const LESSON_GENERATION_PROMPT = `
You are an expert AI tutor specialized in creating engaging, perfectly tailored lessons for students.
Your task is to teach the requested concept in a way that is easy to understand, comprehensive, and structured nicely using Markdown.

Guidelines for formatting the lesson:
1. Use clear Markdown headings (##, ###) to structure the explanation.
2. Provide a simple, intuitive analogy to explain the core idea first before diving into technical details.
3. Use bullet points for key characteristics or rules.
4. Bold **important terms** and concepts.
5. If applicable (e.g., Mathematics, Physics, Chemistry, CS), provide a clear, step-by-step example.
6. End with a very brief "Key Takeaway" section.
7. Tone should be encouraging, clear, and direct. Do not add conversational filler like "Here is your lesson" — just output the raw markdown of the lesson content itself.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { concept, subject } = body;

    if (!concept || !subject) {
      return NextResponse.json(
        { error: "Missing concept or subject parameter" },
        { status: 400 },
      );
    }

    const userPrompt = `Please teach me about "${concept}" in the context of the subject "${subject}".`;

    const result = await getLLMProvider().generate({
      messages: [{ role: "user", content: userPrompt }],
      systemInstruction: LESSON_GENERATION_PROMPT,
      model: "gemini-2.5-flash", // Hint primarily for gemini
    });

    const generatedContent = result.text || "";

    return NextResponse.json({ content: generatedContent });
  } catch (error: any) {
    console.error("Study Content Generation API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate study content" },
      { status: 500 },
    );
  }
}
