// =============================================
// EXAMER Agent — Tool & Skill Integration Layer
// =============================================
// Structured function-calling system. The AI can autonomously
// trigger these tools to help the student. Each tool is defined
// with a JSON Schema for Gemini function declarations.
//
// NOW CONNECTED TO:
// - Firebase Firestore (real student data)
// - LLM Provider (Gemini)
// - Local long-term memory (fallback)
// =============================================

import { getLLMProvider } from "@/lib/llm/provider";
import { getLongTermMemory } from "./memory";
import { traceAsync } from "@/lib/tracing";
import type {
  ToolDefinition,
  ToolCallResult,
  GeminiFunctionDeclaration,
  GeneratedMCQ,
  AnswerEvaluation,
  SyllabusTopic,
  AgentConfig,
} from "./types";
import { DEFAULT_AGENT_CONFIG } from "./types";

// =============================================
// Firebase imports — connecting tools to REAL data
// =============================================
import {
  getSyllabusTree,
  getMentorMemory,
  addImportantMemory,
  appendMentorLog,
  getDashboardStats,
  getWeakTopics as getFirebaseWeakTopics,
  getRecentActivity,
  getMockResults,
} from "@/lib/firebase/firestore-admin";

function isFirebaseAdminConfigError(error: unknown): boolean {
  const message = String((error as any)?.message || "").toLowerCase();
  return (
    message.includes("missing firebase admin credentials") ||
    message.includes("missing firebase project id") ||
    message.includes("set firebase_project_id") ||
    message.includes("firebase_client_email") ||
    message.includes("firebase_private_key") ||
    message.includes("could not load the default credentials") ||
    message.includes("failed to determine service account") ||
    message.includes("service account")
  );
}

// =============================================
// 1. TOOL REGISTRY — Central registry for all tools
// =============================================

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`[ToolRegistry] Overwriting existing tool: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  async execute(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        toolName,
        success: false,
        data: null,
        error: `Tool "${toolName}" not found in registry. Available: ${this.listToolNames().join(", ")}`,
        executionTimeMs: 0,
      };
    }

    // Validate required parameters
    for (const requiredParam of tool.requiredParams) {
      if (
        params[requiredParam] === undefined ||
        params[requiredParam] === null
      ) {
        return {
          toolName,
          success: false,
          data: null,
          error: `Missing required parameter: "${requiredParam}"`,
          executionTimeMs: 0,
        };
      }
    }

    const startTime = Date.now();

    return traceAsync(
      "agent.tool_execute",
      {
        "tool.name": toolName,
      },
      async () => {
        try {
          const result = await tool.handler(params);
          return {
            ...result,
            executionTimeMs: Date.now() - startTime,
          };
        } catch (error: any) {
          console.error(
            `[ToolRegistry] Error executing tool "${toolName}":`,
            error,
          );
          return {
            toolName,
            success: false,
            data: null,
            error: error.message || "Unknown tool execution error",
            executionTimeMs: Date.now() - startTime,
          };
        }
      },
    );
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  listToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  toGeminiFunctionDeclarations(): GeminiFunctionDeclaration[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object" as const,
        properties: Object.fromEntries(
          Object.entries(tool.parameters).map(([key, schema]) => [
            key,
            {
              type: schema.type,
              description: schema.description,
              ...(schema.enum ? { enum: schema.enum } : {}),
            },
          ]),
        ),
        required: tool.requiredParams,
      },
    }));
  }

  /**
   * Generate a plain-text tool catalog for injection into the system prompt.
   * This ensures models that don't support native tool calling (DeepSeek, etc.)
   * can still invoke tools via the XML format we parse in provider.ts.
   */
  toPromptDescription(): string {
    const toolDescs = Array.from(this.tools.values()).map((tool) => {
      const params = Object.entries(tool.parameters)
        .map(([key, schema]) => {
          const req = tool.requiredParams.includes(key)
            ? " (required)"
            : " (optional)";
          return `    - ${key}: ${schema.type} — ${schema.description}${req}`;
        })
        .join("\n");
      return `• **${tool.name}** — ${tool.description}\n  Parameters:\n${params}`;
    });

    return `## AVAILABLE TOOLS
You have access to the following tools. To call a tool, use this EXACT XML format in your response:

<function_calls>
<invoke name="tool_name">
<parameter name="param_name">value</parameter>
</invoke>
</function_calls>

After calling a tool, WAIT for the result before continuing your response.

${toolDescs.join("\n\n")}`;
  }
}

// =============================================
// 2. TOOLS — Connected to Firebase & LLM Provider
// =============================================

/**
 * generate_mcq — Creates dynamic MCQs using Gemini
 */
function createGenerateMCQTool(config: AgentConfig): ToolDefinition {
  return {
    name: "generate_mcq",
    description:
      "Generate multiple-choice questions (MCQs) for a specific topic and difficulty level to test the student's understanding. Use this when the student needs practice questions or when you want to quiz them.",
    parameters: {
      topic: {
        type: "string",
        description:
          "The specific topic or concept to generate questions about",
        required: true,
      },
      difficulty: {
        type: "number",
        description: "Difficulty level from 1 (easy) to 5 (very hard)",
        required: true,
      },
      count: {
        type: "number",
        description: "Number of questions to generate (1-10, default 3)",
        required: false,
      },
      subject: {
        type: "string",
        description:
          "The broader subject area (e.g., Mathematics, Computer Science)",
        required: false,
      },
    },
    requiredParams: ["topic", "difficulty"],

    handler: async (params): Promise<ToolCallResult> => {
      const {
        topic,
        difficulty,
        count = 3,
        subject = "General",
      } = params as {
        topic: string;
        difficulty: number;
        count?: number;
        subject?: string;
      };

      const clampedCount = Math.min(Math.max(Number(count) || 3, 1), 10);
      const clampedDifficulty = Math.min(
        Math.max(Number(difficulty) || 3, 1),
        5,
      );

      // ── QUIZ MODE REDIRECT ──
      // When 2+ questions are requested, it's a quiz/test scenario.
      // Redirect to the interactive mock test page instead of dumping
      // questions as chat text. This ensures proper UX with timer,
      // option selection, and score tracking.
      if (clampedCount >= 2) {
        const testId = `sim-${Math.random().toString(36).substring(2, 9)}`;
        const testName = `${topic} Quick Quiz`;
        const testUrl = `/mocks/${testId}?name=${encodeURIComponent(testName)}&subjects=${encodeURIComponent(topic)}&q=${clampedCount}`;

        console.log(
          `[generate_mcq] Quiz mode (count=${clampedCount}) → redirecting to ${testUrl}`,
        );

        return {
          toolName: "generate_mcq",
          success: true,
          data: {
            redirectToMock: true,
            testUrl,
            testName,
            topic,
            count: clampedCount,
            message: `A quiz with ${clampedCount} questions on "${topic}" has been prepared! The student should be redirected to the mock test page to take it interactively. Do NOT list the questions in chat. Instead, tell the student their quiz is ready and they are being taken to the test page.`,
          },
          executionTimeMs: 0,
        };
      }

      // ── SINGLE QUESTION MODE ──
      // For count=1, generate a single concept-check question inline.
      // This is used during teaching (Socratic/Feynman checks).
      const prompt = `Generate exactly 1 multiple-choice question about "${topic}" in the subject "${subject}" at difficulty level ${clampedDifficulty}/5 (where 1 is basic recall and 5 is application/analysis level for the user's target exam).

Return ONLY valid JSON in this exact format, no markdown fencing:
{
  "questions": [
    {
      "id": "q1",
      "question": "...",
      "options": [
        {"label": "A", "text": "..."},
        {"label": "B", "text": "..."},
        {"label": "C", "text": "..."},
        {"label": "D", "text": "..."}
      ],
      "correctAnswer": "A",
      "explanation": "Brief explanation of why this is correct",
      "topic": "${topic}",
      "difficulty": ${clampedDifficulty}
    }
  ]
}`;

      try {
        // Use the Gemini provider abstraction
        const provider = getLLMProvider();
        const result = await provider.generate({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          maxOutputTokens: 2048,
        });

        const text = result.text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in AI response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const questions: GeneratedMCQ[] = parsed.questions || [];

        return {
          toolName: "generate_mcq",
          success: true,
          data: {
            questions,
            count: questions.length,
            topic,
            difficulty: clampedDifficulty,
          },
          executionTimeMs: 0,
        };
      } catch (error: any) {
        return {
          toolName: "generate_mcq",
          success: false,
          data: null,
          error: `MCQ generation failed: ${error.message}`,
          executionTimeMs: 0,
        };
      }
    },
  };
}

/**
 * evaluate_user_answer — Grades answers using LLM + logs to Firebase
 */
function createEvaluateAnswerTool(config: AgentConfig): ToolDefinition {
  return {
    name: "evaluate_user_answer",
    description:
      "Evaluate and grade a student's answer to a question. Provides a score, detailed feedback, identifies concept gaps, and suggests topics to review. Use this when a student submits an answer to grade it intelligently.",
    parameters: {
      user_answer: {
        type: "string",
        description: "The student's submitted answer",
        required: true,
      },
      correct_concept: {
        type: "string",
        description: "The correct concept or expected answer",
        required: true,
      },
      question: {
        type: "string",
        description: "The original question that was asked",
        required: false,
      },
      topic: {
        type: "string",
        description: "The topic the question belongs to",
        required: false,
      },
      user_id: {
        type: "string",
        description: "The user ID for logging results",
        required: false,
      },
    },
    requiredParams: ["user_answer", "correct_concept"],

    handler: async (params): Promise<ToolCallResult> => {
      const {
        user_answer,
        correct_concept,
        question = "",
        topic = "",
        user_id,
      } = params as {
        user_answer: string;
        correct_concept: string;
        question?: string;
        topic?: string;
        user_id?: string;
      };

      const prompt = `You are a strict but fair exam evaluator.

Question: "${question || "Not provided"}"
Expected concept/answer: "${correct_concept}"
Student's answer: "${user_answer}"
Topic: "${topic || "Not specified"}"

Evaluate the student's answer and return ONLY valid JSON:
{
  "isCorrect": true/false,
  "score": <0-100>,
  "feedback": "Detailed, specific feedback. Be honest but encouraging.",
  "conceptGaps": ["specific gap 1", "specific gap 2"],
  "suggestedReview": ["topic to review 1", "topic to review 2"]
}`;

      try {
        const provider = getLLMProvider();
        const result = await provider.generate({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          maxOutputTokens: 1024,
        });

        const text = result.text.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No valid JSON in response");

        const evaluation: AnswerEvaluation = JSON.parse(jsonMatch[0]);

        // Log evaluation to Firebase if we have user_id
        if (user_id && topic) {
          try {
            await appendMentorLog(
              user_id,
              {
                timestamp: new Date(),
                trigger: "manual",
                context: `Evaluated answer for "${topic}": ${evaluation.isCorrect ? "correct" : "incorrect"} (${evaluation.score}/100)`,
                response: evaluation.feedback,
              },
              evaluation.conceptGaps,
            );
          } catch (firebaseErr) {
            console.warn(
              "[Tool:evaluate] Firebase log failed (non-critical):",
              firebaseErr,
            );
          }
        }

        return {
          toolName: "evaluate_user_answer",
          success: true,
          data: evaluation,
          executionTimeMs: 0,
        };
      } catch (error: any) {
        return {
          toolName: "evaluate_user_answer",
          success: false,
          data: null,
          error: `Answer evaluation failed: ${error.message}`,
          executionTimeMs: 0,
        };
      }
    },
  };
}

/**
 * fetch_syllabus_topic — Fetches from Firebase first, falls back to embedded data
 */
function createFetchSyllabusTool(config: AgentConfig): ToolDefinition {
  // Fallback embedded syllabus (used when Firebase has no data)
  const DEFAULT_FALLBACK_SYLLABUS: Record<string, SyllabusTopic> = {
    mathematics: {
      subject: "Mathematics",
      topics: [
        {
          name: "Algebra",
          subtopics: [
            "Sets, Relations & Functions",
            "Complex Numbers",
            "Matrices & Determinants",
            "Quadratic Equations",
            "Permutations & Combinations",
            "Mathematical Induction",
            "Binomial Theorem",
            "Sequences & Series",
          ],
          weightage: 25,
        },
        {
          name: "Calculus",
          subtopics: [
            "Limits & Continuity",
            "Differentiation",
            "Applications of Derivatives",
            "Integration",
            "Definite Integrals",
            "Differential Equations",
          ],
          weightage: 25,
        },
        {
          name: "Coordinate Geometry",
          subtopics: [
            "Straight Lines",
            "Circles",
            "Conic Sections",
            "3D Geometry",
          ],
          weightage: 15,
        },
        {
          name: "Statistics & Probability",
          subtopics: [
            "Measures of Central Tendency",
            "Dispersion",
            "Probability Theory",
            "Random Variables",
            "Distributions",
          ],
          weightage: 15,
        },
        {
          name: "Linear Programming",
          subtopics: ["Graphical Method", "Simplex Method", "Duality"],
          weightage: 10,
        },
        {
          name: "Trigonometry",
          subtopics: [
            "Trigonometric Functions",
            "Inverse Trigonometric Functions",
            "Trigonometric Equations",
          ],
          weightage: 10,
        },
      ],
    },
    computer_science: {
      subject: "Computer Science",
      topics: [
        {
          name: "Data Structures",
          subtopics: [
            "Arrays",
            "Linked Lists",
            "Stacks",
            "Queues",
            "Trees",
            "Graphs",
            "Hashing",
          ],
          weightage: 20,
        },
        {
          name: "Algorithms",
          subtopics: [
            "Sorting",
            "Searching",
            "Dynamic Programming",
            "Greedy Algorithms",
            "Divide & Conquer",
            "Time & Space Complexity",
          ],
          weightage: 20,
        },
        {
          name: "Database Management",
          subtopics: [
            "ER Model",
            "Relational Algebra",
            "SQL",
            "Normalization",
            "Transactions",
            "Indexing",
          ],
          weightage: 15,
        },
        {
          name: "Operating Systems",
          subtopics: [
            "Process Management",
            "Memory Management",
            "File Systems",
            "CPU Scheduling",
            "Deadlocks",
          ],
          weightage: 15,
        },
        {
          name: "Computer Networks",
          subtopics: [
            "OSI Model",
            "TCP/IP",
            "Routing Algorithms",
            "Network Security",
          ],
          weightage: 10,
        },
        {
          name: "Programming Concepts",
          subtopics: [
            "OOP",
            "C/C++ Basics",
            "Java Basics",
            "Recursion",
            "Pointers",
          ],
          weightage: 10,
        },
        {
          name: "Theory of Computation",
          subtopics: [
            "Finite Automata",
            "Regular Expressions",
            "Context-Free Grammars",
            "Turing Machines",
          ],
          weightage: 10,
        },
      ],
    },
    logical_reasoning: {
      subject: "Logical Reasoning",
      topics: [
        {
          name: "Verbal Reasoning",
          subtopics: [
            "Analogies",
            "Classification",
            "Series Completion",
            "Coding-Decoding",
            "Blood Relations",
            "Direction Sense",
          ],
          weightage: 30,
        },
        {
          name: "Non-Verbal Reasoning",
          subtopics: [
            "Pattern Recognition",
            "Figure Series",
            "Mirror Images",
            "Paper Folding",
          ],
          weightage: 20,
        },
        {
          name: "Analytical Reasoning",
          subtopics: [
            "Syllogisms",
            "Statements & Conclusions",
            "Arrangements",
            "Puzzles",
          ],
          weightage: 25,
        },
        {
          name: "Data Interpretation",
          subtopics: [
            "Tables",
            "Bar Graphs",
            "Pie Charts",
            "Line Graphs",
            "Data Sufficiency",
          ],
          weightage: 25,
        },
      ],
    },
    english: {
      subject: "English",
      topics: [
        {
          name: "Reading Comprehension",
          subtopics: [
            "Passage Analysis",
            "Inference Questions",
            "Vocabulary in Context",
          ],
          weightage: 30,
        },
        {
          name: "Grammar",
          subtopics: [
            "Tenses",
            "Subject-Verb Agreement",
            "Articles",
            "Prepositions",
            "Active/Passive Voice",
            "Direct/Indirect Speech",
          ],
          weightage: 25,
        },
        {
          name: "Verbal Ability",
          subtopics: [
            "Synonyms & Antonyms",
            "Idioms & Phrases",
            "One Word Substitution",
            "Sentence Correction",
          ],
          weightage: 25,
        },
        {
          name: "Writing",
          subtopics: [
            "Para Jumbles",
            "Sentence Rearrangement",
            "Fill in the Blanks",
          ],
          weightage: 20,
        },
      ],
    },
  };

  return {
    name: "fetch_syllabus_topic",
    description:
      "Retrieve specific syllabus topics, subtopics, and their weightage for a given subject. Fetches from the student's Firebase syllabus tree first, falls back to embedded data. Use this to help students understand what to study based on their uploaded syllabus.",
    parameters: {
      subject: {
        type: "string",
        description:
          "The subject to fetch syllabus for (e.g. Mathematics, History, Physics, etc. depending on user syllabus)",
        required: true,
      },
      topic_name: {
        type: "string",
        description:
          'Optional specific topic name to filter (e.g., "Calculus", "Data Structures")',
        required: false,
      },
      user_id: {
        type: "string",
        description:
          "The user ID to fetch their personalized syllabus tree from Firebase",
        required: false,
      },
    },
    requiredParams: ["subject"],

    handler: async (params): Promise<ToolCallResult> => {
      const { subject, topic_name, user_id } = params as {
        subject: string;
        topic_name?: string;
        user_id?: string;
      };
      const normalizedSubject = subject.toLowerCase().replace(/\s+/g, "_");

      // ---- TRY FIREBASE FIRST (real student data) ----
      if (user_id) {
        try {
          const firebaseTree = await getSyllabusTree(user_id);
          if (
            firebaseTree &&
            firebaseTree.tree &&
            firebaseTree.tree.length > 0
          ) {
            // Find the matching subject in the Firebase tree
            const matchedSubject = firebaseTree.tree.find(
              (s: any) =>
                s.id?.toLowerCase().includes(normalizedSubject) ||
                s.name?.toLowerCase().includes(normalizedSubject) ||
                s.subject?.toLowerCase().includes(normalizedSubject),
            );

            if (matchedSubject) {
              let topics =
                (matchedSubject as any).children ||
                (matchedSubject as any).topics ||
                [];

              // Filter by topic name if provided
              if (topic_name) {
                topics = topics.filter((t: any) =>
                  (t.name || t.id || "")
                    .toLowerCase()
                    .includes(topic_name.toLowerCase()),
                );
              }

              return {
                toolName: "fetch_syllabus_topic",
                success: true,
                data: {
                  source: "firebase",
                  subject: matchedSubject.name || subject,
                  topics,
                  preparednessRating: firebaseTree.preparednessRating || {},
                },
                executionTimeMs: 0,
              };
            } else {
              const availableSubjects = firebaseTree.tree
                .map((s: any) => s.name || s.subject || s.id)
                .filter(Boolean);
              return {
                toolName: "fetch_syllabus_topic",
                success: false,
                data: null,
                error: `Subject "${subject}" not found in your user profile syllabus. The available subjects on your syllabus are: ${availableSubjects.join(", ")}. Please query one of these subjects.`,
                executionTimeMs: 0,
              };
            }
          }
        } catch (firebaseErr) {
          if (isFirebaseAdminConfigError(firebaseErr)) {
            return {
              toolName: "fetch_syllabus_topic",
              success: true,
              data: {
                source: "unavailable",
                subject,
                topics: [],
                unavailableReason: "server_data_unavailable",
                selfRecoverable: true,
              },
              executionTimeMs: 0,
            };
          }

          console.warn(
            "[Tool:syllabus] Firebase fetch failed, using embedded data:",
            firebaseErr,
          );
        }
      }

      // ---- FALLBACK: Embedded syllabus data ----
      const syllabusData = DEFAULT_FALLBACK_SYLLABUS[normalizedSubject];
      if (!syllabusData) {
        return {
          toolName: "fetch_syllabus_topic",
          success: false,
          data: null,
          error: `Subject "${subject}" not found in your target syllabus. Please describe the subject exactly as it appears in your uploaded syllabus.`,
          executionTimeMs: 0,
        };
      }

      let result = syllabusData;
      if (topic_name) {
        const matchedTopics = syllabusData.topics.filter((t) =>
          t.name.toLowerCase().includes(topic_name.toLowerCase()),
        );
        if (matchedTopics.length === 0) {
          return {
            toolName: "fetch_syllabus_topic",
            success: false,
            data: null,
            error: `Topic "${topic_name}" not found in ${syllabusData.subject}. Available: ${syllabusData.topics.map((t) => t.name).join(", ")}`,
            executionTimeMs: 0,
          };
        }
        result = { ...syllabusData, topics: matchedTopics };
      }

      return {
        toolName: "fetch_syllabus_topic",
        success: true,
        data: { source: "embedded", ...result },
        executionTimeMs: 0,
      };
    },
  };
}

/**
 * get_weak_topics — Fetches from Firebase progress_nodes + local memory
 */
function createGetWeakTopicsTool(): ToolDefinition {
  return {
    name: "get_weak_topics",
    description:
      "Retrieve the student's identified weak topics from Firebase progress data and performance history. Shows topics where the student struggles most, their mastery level, and attempt count.",
    parameters: {
      user_id: {
        type: "string",
        description: "The user ID to fetch weak topics for",
        required: true,
      },
      limit: {
        type: "number",
        description: "Maximum number of weak topics to return (default 5)",
        required: false,
      },
    },
    requiredParams: ["user_id"],

    handler: async (params): Promise<ToolCallResult> => {
      const { user_id, limit = 5 } = params as {
        user_id: string;
        limit?: number;
      };
      const limitNum = Number(limit) || 5;

      // ---- TRY FIREBASE FIRST (real progress data) ----
      try {
        const firebaseWeakTopics = await getFirebaseWeakTopics(
          user_id,
          limitNum,
        );
        if (firebaseWeakTopics.length > 0) {
          return {
            toolName: "get_weak_topics",
            success: true,
            data: {
              source: "firebase",
              weakTopics: firebaseWeakTopics,
              totalWeakTopics: firebaseWeakTopics.length,
            },
            executionTimeMs: 0,
          };
        }
      } catch (firebaseErr) {
        console.warn("[Tool:weak_topics] Firebase fetch failed:", firebaseErr);
      }

      // ---- FALLBACK: Local long-term memory ----
      try {
        const ltm = getLongTermMemory();
        const localWeakTopics = await ltm.getWeakTopics(user_id);
        return {
          toolName: "get_weak_topics",
          success: true,
          data: {
            source: "local",
            weakTopics: localWeakTopics.slice(0, limitNum),
            totalWeakTopics: localWeakTopics.length,
          },
          executionTimeMs: 0,
        };
      } catch (error: any) {
        return {
          toolName: "get_weak_topics",
          success: false,
          data: null,
          error: `Failed to fetch weak topics: ${error.message}`,
          executionTimeMs: 0,
        };
      }
    },
  };
}

/**
 * log_important_memory — Saves to BOTH Firebase AND local memory
 */
function createLogMemoryTool(): ToolDefinition {
  return {
    name: "log_important_memory",
    description:
      "Save an important observation or insight about the student to BOTH Firebase and local storage. Use this when you notice something significant about their learning pattern, emotional state, or breakthrough moments.",
    parameters: {
      user_id: {
        type: "string",
        description: "The user ID to log memory for",
        required: true,
      },
      memory: {
        type: "string",
        description: "The important observation or insight to save",
        required: true,
      },
    },
    requiredParams: ["user_id", "memory"],

    handler: async (params): Promise<ToolCallResult> => {
      const { user_id, memory } = params as { user_id: string; memory: string };

      const results = { firebase: false, local: false };

      // Save to Firebase
      try {
        await addImportantMemory(user_id, memory);
        results.firebase = true;
      } catch (firebaseErr) {
        console.warn("[Tool:memory] Firebase save failed:", firebaseErr);
      }

      // Save to local long-term memory
      try {
        const ltm = getLongTermMemory();
        await ltm.logImportantMemory(user_id, memory);
        results.local = true;
      } catch (localErr) {
        console.warn("[Tool:memory] Local save failed:", localErr);
      }

      if (!results.firebase && !results.local) {
        return {
          toolName: "log_important_memory",
          success: false,
          data: null,
          error: "Failed to save memory to both Firebase and local storage",
          executionTimeMs: 0,
        };
      }

      return {
        toolName: "log_important_memory",
        success: true,
        data: { saved: true, memory, savedTo: results },
        executionTimeMs: 0,
      };
    },
  };
}

/**
 * NEW: get_study_stats — Fetches real dashboard stats from Firebase
 */
function createGetStudyStatsTool(): ToolDefinition {
  return {
    name: "get_study_stats",
    description:
      "Retrieve the student's overall study statistics from Firebase including concepts learned, mastery count, accuracy, study time, and question attempts. Use this to understand their progress and personalize coaching.",
    parameters: {
      user_id: {
        type: "string",
        description: "The user ID to fetch stats for",
        required: true,
      },
    },
    requiredParams: ["user_id"],

    handler: async (params): Promise<ToolCallResult> => {
      const { user_id } = params as { user_id: string };

      try {
        const stats = await getDashboardStats(user_id);
        return {
          toolName: "get_study_stats",
          success: true,
          data: {
            source: "firebase",
            ...stats,
          },
          executionTimeMs: 0,
        };
      } catch (error: any) {
        if (isFirebaseAdminConfigError(error)) {
          return {
            toolName: "get_study_stats",
            success: true,
            data: {
              source: "unavailable",
              conceptsLearned: 0,
              conceptsMastered: 0,
              todayStudyMinutes: 0,
              totalStudyHours: 0,
              overallAccuracy: 0,
              averageSpeed: 0,
              totalQuestionsAttempted: 0,
              unavailableReason: "server_data_unavailable",
              selfRecoverable: true,
            },
            executionTimeMs: 0,
          };
        }

        return {
          toolName: "get_study_stats",
          success: false,
          data: null,
          error: "Failed to fetch study stats right now.",
          executionTimeMs: 0,
        };
      }
    },
  };
}

/**
 * NEW: get_recent_activity — Fetches recent study activity from Firebase
 */
function createGetRecentActivityTool(): ToolDefinition {
  return {
    name: "get_recent_activity",
    description:
      "Retrieve the student's recent study activity including sessions, topics practiced, and results. Use this to understand what they've been working on recently and provide contextual guidance.",
    parameters: {
      user_id: {
        type: "string",
        description: "The user ID to fetch activity for",
        required: true,
      },
      limit: {
        type: "number",
        description: "Number of recent activities to return (default 5)",
        required: false,
      },
    },
    requiredParams: ["user_id"],

    handler: async (params): Promise<ToolCallResult> => {
      const { user_id, limit = 5 } = params as {
        user_id: string;
        limit?: number;
      };

      try {
        const activities = await getRecentActivity(user_id, Number(limit) || 5);
        return {
          toolName: "get_recent_activity",
          success: true,
          data: {
            source: "firebase",
            activities,
            count: activities.length,
          },
          executionTimeMs: 0,
        };
      } catch (error: any) {
        if (isFirebaseAdminConfigError(error)) {
          return {
            toolName: "get_recent_activity",
            success: true,
            data: {
              source: "unavailable",
              activities: [],
              count: 0,
              unavailableReason: "server_data_unavailable",
              selfRecoverable: true,
            },
            executionTimeMs: 0,
          };
        }

        return {
          toolName: "get_recent_activity",
          success: false,
          data: null,
          error: "Failed to fetch recent activity right now.",
          executionTimeMs: 0,
        };
      }
    },
  };
}

/**
 * NEW: get_mentor_memories — Fetches AI mentor's memories from Firebase
 */
function createGetMentorMemoriesTool(): ToolDefinition {
  return {
    name: "get_mentor_memories",
    description:
      "Retrieve previously saved important memories and observations about the student from Firebase. Use this at the start of a session to recall what you know about the student.",
    parameters: {
      user_id: {
        type: "string",
        description: "The user ID to fetch memories for",
        required: true,
      },
    },
    requiredParams: ["user_id"],

    handler: async (params): Promise<ToolCallResult> => {
      const { user_id } = params as { user_id: string };

      try {
        const mentorMemory = await getMentorMemory(user_id);
        return {
          toolName: "get_mentor_memories",
          success: true,
          data: {
            source: "firebase",
            importantMemories: mentorMemory?.importantMemories || [],
            identifiedWeaknesses: mentorMemory?.identifiedWeaknesses || [],
            lastInteraction: mentorMemory?.lastInteraction || null,
            totalLogs: mentorMemory?.sessionLogs?.length || 0,
          },
          executionTimeMs: 0,
        };
      } catch (error: any) {
        // Fallback to local memory
        try {
          const ltm = getLongTermMemory();
          const profile = await ltm.loadProfile(user_id);
          return {
            toolName: "get_mentor_memories",
            success: true,
            data: {
              source: "local",
              importantMemories: profile.importantMemories,
              identifiedWeaknesses: profile.weakTopics.map((t) => t.topic),
              lastInteraction: profile.lastSessionAt,
            },
            executionTimeMs: 0,
          };
        } catch {
          return {
            toolName: "get_mentor_memories",
            success: false,
            data: null,
            error: `Failed to fetch mentor memories: ${error.message}`,
            executionTimeMs: 0,
          };
        }
      }
    },
  };
}

/**
 * NEW: get_mock_test_results — Fetches mock test performance from Firebase
 */
function createGetMockResultsTool(): ToolDefinition {
  return {
    name: "get_mock_test_results",
    description:
      "Retrieve the student's mock test results and scores from Firebase. Use this to understand their exam readiness and provide targeted advice.",
    parameters: {
      user_id: {
        type: "string",
        description: "The user ID to fetch results for",
        required: true,
      },
      limit: {
        type: "number",
        description: "Number of recent results to return (default 5)",
        required: false,
      },
    },
    requiredParams: ["user_id"],

    handler: async (params): Promise<ToolCallResult> => {
      const { user_id, limit = 5 } = params as {
        user_id: string;
        limit?: number;
      };

      try {
        const results = await getMockResults(user_id, Number(limit) || 5);
        return {
          toolName: "get_mock_test_results",
          success: true,
          data: {
            source: "firebase",
            results,
            count: results.length,
          },
          executionTimeMs: 0,
        };
      } catch (error: any) {
        if (isFirebaseAdminConfigError(error)) {
          return {
            toolName: "get_mock_test_results",
            success: true,
            data: {
              source: "unavailable",
              results: [],
              count: 0,
              unavailableReason: "server_data_unavailable",
              selfRecoverable: true,
            },
            executionTimeMs: 0,
          };
        }

        return {
          toolName: "get_mock_test_results",
          success: false,
          data: null,
          error: "Failed to fetch mock results right now.",
          executionTimeMs: 0,
        };
      }
    },
  };
}

// =============================================
// 3. NEW AGENT TOOLS (Gaps Fixed)
// =============================================

function createRecommendMockTestTool(): ToolDefinition {
  return {
    name: "recommend_mock_test",
    description: "Generate a custom, targeted mock test link for the student based on their weak topics. Use this when the student asks to take a test, or when you notice they should evaluate their recent progress.",
    parameters: {
      testName: { type: "string", description: "A catchy, custom name for this mock test (e.g., 'Calculus Mastery Challenge').", required: true },
      subjects: { type: "string", description: "Comma separated subjects or topics to include (e.g., 'Calculus, Algebra').", required: true },
      questionsCount: { type: "number", description: "Number of questions (e.g., 10 or 15). Keep it to 15 max for quick tests.", required: true }
    },
    requiredParams: ["testName", "subjects", "questionsCount"],
    handler: async (params): Promise<ToolCallResult> => {
      const { testName, subjects, questionsCount } = params as any;
      const count = Math.min(Number(questionsCount) || 10, 30);
      const testId = `sim-${Math.random().toString(36).substring(2, 9)}`;
      const url = `/mocks/${testId}?name=${encodeURIComponent(testName)}&subjects=${encodeURIComponent(subjects)}&q=${count}`;
      
      return {
        toolName: "recommend_mock_test",
        success: true,
        data: {
          testUrl: url,
          instructions: `Tell the user to click this link to start their mock test: ${url}`
        },
        executionTimeMs: 0
      };
    }
  };
}

function createUpdateStudyPreferencesTool(): ToolDefinition {
  return {
    name: "update_study_preferences",
    description: "Update the student's study preferences dynamically (like target specific exams, increasing daily study time, or changing favorite subjects) and store this in their long-term memory.",
    parameters: {
      userId: { type: "string", description: "The user ID", required: true },
      preferenceUpdates: { type: "string", description: "Description of what changed (e.g., 'User now wants to focus on JEE Advanced instead of Mains')", required: true }
    },
    requiredParams: ["userId", "preferenceUpdates"],
    handler: async (params): Promise<ToolCallResult> => {
      const { userId, preferenceUpdates } = params as any;
      try {
        // Appends to the mentor's explicit long term memory
        await addImportantMemory(userId, `Preference Update: ${preferenceUpdates}`);
        return {
          toolName: "update_study_preferences",
          success: true,
          data: { success: true, message: "Preferences updated in memory successfully." },
          executionTimeMs: 0
        };
      } catch (err: any) {
        return {
          toolName: "update_study_preferences",
          success: false,
          data: null,
          error: err.message,
          executionTimeMs: 0
        };
      }
    }
  };
}

// =============================================
// 4. REGISTRY FACTORY
// =============================================

let _registry: ToolRegistry | null = null;

export function getToolRegistry(config?: Partial<AgentConfig>): ToolRegistry {
  if (_registry) return _registry;

  const fullConfig = { ...DEFAULT_AGENT_CONFIG, ...config };
  _registry = new ToolRegistry();

  // Core tools (LLM-powered)
  _registry.register(createGenerateMCQTool(fullConfig));
  _registry.register(createEvaluateAnswerTool(fullConfig));

  // Data tools (Firebase-connected)
  _registry.register(createFetchSyllabusTool(fullConfig));
  _registry.register(createGetWeakTopicsTool());
  _registry.register(createGetStudyStatsTool());
  _registry.register(createGetRecentActivityTool());
  _registry.register(createGetMentorMemoriesTool());
  _registry.register(createGetMockResultsTool());
  
  // Custom Gaps tools
  _registry.register(createRecommendMockTestTool());
  _registry.register(createUpdateStudyPreferencesTool());

  // Memory tools (Firebase + local)
  _registry.register(createLogMemoryTool());

  console.log(
    `[ToolRegistry] Initialized with ${_registry.listToolNames().length} tools: ${_registry.listToolNames().join(", ")}`,
  );

  return _registry;
}

export function resetToolRegistry(): void {
  _registry = null;
}
