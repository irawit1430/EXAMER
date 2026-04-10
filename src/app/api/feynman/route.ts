import { NextRequest } from "next/server";
import { evaluateFeynman } from "@/lib/gemini/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { concept, userExplanation } = body;

    if (!concept || !userExplanation) {
      return new Response(
        JSON.stringify({ error: "Missing logic parameters" }),
        { status: 400 },
      );
    }

    const evaluation = await evaluateFeynman(concept, userExplanation);

    return new Response(JSON.stringify(evaluation), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Feynman API Route Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
