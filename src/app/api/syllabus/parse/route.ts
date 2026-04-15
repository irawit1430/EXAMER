import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini/client";
import {
  getVerifiedUidFromRequest,
  FirebaseAuthError,
} from "@/lib/firebase/auth-server";

export const runtime = "nodejs"; // Node runtime needed for heavier parsing if using external libs

const SYLLABUS_PARSE_SYSTEM_PROMPT = `
You are an expert curriculum analyzer. Your job is to take raw text extracted from a user's syllabus document and convert it into a highly structured JSON format that our software can use to generate a study plan.

The output MUST be a valid JSON object following this exact schema:
{
  "subjectName": "Name of the subject (e.g., Mathematics, Physics)",
  "topics": [
    {
      "name": "Name of the topic",
      "subTopics": [
        {
          "name": "Name of the sub-topic",
          "microConcepts": [
            {
              "name": "Specific granular concept to learn",
              "difficulty": 1-5 (estimate of difficulty, 5 being hardest)
            }
          ]
        }
      ]
    }
  ]
}

Rules:
1. ONLY return the JSON object. Do not include markdown formatting like \`\`\`json.
2. Ensure the output is valid JSON.
3. Break down topics into granular 'microConcepts'. For example, if the topic is "Calculus", a sub-topic is "Derivatives", and a microConcept is "Chain Rule".
`;

export async function POST(req: NextRequest) {
  try {
    await getVerifiedUidFromRequest(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawText = formData.get("text") as string | null; // Allow client to send pre-parsed text

    if (!file && !rawText) {
      return NextResponse.json(
        { error: "No file or text provided" },
        { status: 400 },
      );
    }

    let extractedText = rawText || "";
    let pdfPart = null;

    // If a file is uploaded but no rawText, we parse it based on type.
    if (file && !extractedText) {
      const arrayBuffer = await file.arrayBuffer();

      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        // Send the PDF directly to Gemini via inlineData
        const base64Data = Buffer.from(arrayBuffer).toString("base64");
        pdfPart = {
          inlineData: {
            data: base64Data,
            mimeType: "application/pdf",
          },
        };
      } else if (
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".md") ||
        file.name.toLowerCase().endsWith(".txt")
      ) {
        extractedText = new TextDecoder("utf-8").decode(arrayBuffer);
      } else {
        return NextResponse.json(
          {
            error:
              "Unsupported file type. Please upload a PDF, TXT, or MD file.",
          },
          { status: 400 },
        );
      }
    }

    // Prepare contents array for Gemini
    const contents: any[] = [];
    if (extractedText) contents.push(extractedText);
    if (pdfPart) contents.push(pdfPart);

    // Call Gemini
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYLLABUS_PARSE_SYSTEM_PROMPT,
      },
    });

    let jsonString = result.text || "";

    // Clean up potential markdown formatting from Gemini
    jsonString = jsonString
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsedJSON = JSON.parse(jsonString);
      return NextResponse.json(parsedJSON);
    } catch (parseError) {
      console.error("Failed to parse Gemini output into JSON:", jsonString);
      return NextResponse.json(
        { error: "Failed to generate valid JSON structure" },
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
    console.error("\n\n=== SYLLABUS PARSER FATAL ERROR ===\n");
    console.error(error);
    console.error("\n===================================\n\n");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
