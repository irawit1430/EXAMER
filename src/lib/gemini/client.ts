import { GoogleGenAI } from "@google/genai";
import type { AIContextPayload } from "@/types";

// The client automatically picks up the GEMINI_API_KEY environment variable
export const ai = new GoogleGenAI({});

// ---- System Prompts ----
export const MENTOR_SYSTEM_PROMPT = `You are an elite, intense, but deeply caring personal learning mentor. You do not act like a standard helpful AI. You are strictly focused on maximizing the user's exam score based on their specific target exam and syllabus.

You have three modes:
1. REALITY CHECK — When they fail or struggle, be harsh but motivating. No sugarcoating.
2. PRAISE — When they excel, acknowledge it briefly, then push harder.
3. TEACH — When they ask for help, use real-life analogies. Force them into Feynman mode.

Rules:
- Never give direct answers to quiz questions
- Always demand they explain concepts back to you
- Reference their predicted score and days to exam in your motivations
- Keep responses under 3 sentences unless teaching
- Use their performance data to personalize every interaction`;

export function buildMentorPrompt(
  context: AIContextPayload,
  trigger: string,
): string {
  const memoryString =
    context.importantMemories && context.importantMemories.length > 0
      ? context.importantMemories.join(". ")
      : "None recorded yet";

  return `${MENTOR_SYSTEM_PROMPT}

Context: User is studying "${context.currentTopic}". Current Predicted Score: ${context.predictedScore}/${context.targetScore}. Days to exam: ${context.daysToExam}. Current streak: ${context.streak} days.
Time spent on current concept: ${context.timeSpent}. Recent errors: ${context.recentErrors}.
Known weaknesses: ${context.weaknesses.join(", ") || "None identified yet"}.

--- User Profile & Memory (The "Soul") ---
Joined: ${context.joinDate}
Preparation Level: ${context.prepLevel}
Favorite Subject: ${context.favoriteSubject}
Target Score: ${context.targetScore}
Important Memories: ${memoryString}
------------------------------------------

Current Trigger: ${trigger}

Action Required: Respond based on the trigger. Be concise, intense, and always push toward improvement.`;
}

export function buildFeynmanEvalPrompt(
  concept: string,
  userExplanation: string,
): string {
  return `You are evaluating a student's Feynman technique explanation.

The concept they were asked to explain: "${concept}"

Their explanation: "${userExplanation}"

Evaluate their explanation for:
1. Semantic accuracy (0-100 score)
2. Specific misunderstandings or gaps (list each one)
3. What they got right

Respond in JSON format:
{
  "clarityScore": <number 0-100>,
  "misunderstandings": ["<specific gap 1>", "<specific gap 2>"],
  "strengths": ["<what they got right>"],
  "feedback": "<1-2 sentence mentor-style feedback>"
}`;
}

// ---- Model Access ----
export async function streamMentorResponse(prompt: string) {
  return await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
}

export async function evaluateFeynman(
  concept: string,
  userExplanation: string,
) {
  const prompt = buildFeynmanEvalPrompt(concept, userExplanation);
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = result.text || "";

  try {
    return JSON.parse(text);
  } catch {
    return {
      clarityScore: 50,
      misunderstandings: ["Could not parse AI response"],
      strengths: [],
      feedback: text,
    };
  }
}
