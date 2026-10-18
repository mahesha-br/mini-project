import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Fallback questions generator if AI service is temporarily slow or unavailable.
 * Ensures the student can always attend the chapter quiz and earn their certificate.
 */
function generateFallbackChapterQuestions(chapterIndex, chapterName, courseTitle, topics) {
    const rawNames = (topics || []).map(t => typeof t === 'string' ? t : (t?.topic || t?.topics || t?.title || 'Core Concept'));
    const t1 = rawNames[0] || `${chapterName} Fundamentals`;
    const t2 = rawNames[1] || `${chapterName} Implementation`;
    const t3 = rawNames[2] || `${chapterName} Best Practices`;

    return [
        {
            id: 1,
            question: `In Chapter ${chapterIndex + 1} ("${chapterName}"), what is the primary objective of studying "${t1}"?`,
            options: [
                `Understanding and applying the core mechanics of ${t1} within ${chapterName}`,
                `Eliminating all compiler optimizations and debug symbols permanently`,
                `Executing unvalidated script executions in production environments`,
                `Skipping type checks and bypassing input validation`
            ],
            correctIndex: 0,
            explanation: `${t1} forms the primary foundational pillar for mastering ${chapterName}.`
        },
        {
            id: 2,
            question: `Regarding "${t2}", which approach represents standard industry best practice?`,
            options: [
                `Hardcoding mutable global dependencies across separate modules`,
                `Writing modular, maintainable, and type-safe code with structured error handling`,
                `Suppressing all compiler warnings and disabling memory cleanups`,
                `Avoiding documentation and skipping integration tests`
            ],
            correctIndex: 1,
            explanation: `Adhering to modular design and structured error handling ensures maintainability and stability.`
        },
        {
            id: 3,
            question: `When implementing techniques from "${t3}", what is the primary benefit achieved?`,
            options: [
                `Increasing application latency and doubling memory consumption`,
                `Restricting execution to single-threaded environments only`,
                `Predictable execution, robust error resilience, and optimal system efficiency`,
                `Preventing users from modifying application configurations`
            ],
            correctIndex: 2,
            explanation: `Applying proven best practices guarantees predictability, efficiency, and high resilience.`
        }
    ];
}

const CHAPTER_QUIZ_PROMPT = `You are an expert educator and exam creator.
Generate exactly 3 multiple choice questions (MCQs) to evaluate a student's comprehensive understanding of Chapter {chapterNumber}: "{chapterName}".

Course: {courseTitle}
Chapter: {chapterName}
Topics covered in this chapter:
{topicsSummary}

Requirements:
- Exactly 3 questions evaluating the distinct concepts and topics of this specific chapter.
- Questions must be tailored specifically to "{chapterName}".
- 4 clear options per question (Option A, B, C, D).
- Specify correctIndex (0, 1, 2, or 3) indicating the single correct answer.
- Distribute the correctIndex (do not make all answers Option A).
- Provide a brief, educational explanation for why that answer is correct.

Return STRICT JSON matching this schema:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctIndex": 0,
      "explanation": "Brief explanation of the correct choice"
    }
  ]
}`;

export async function POST(req) {
    try {
        const { chapterIndex = 0, chapterName, courseTitle, topics } = await req.json();

        if (!chapterName) {
            return NextResponse.json({ error: "chapterName is required" }, { status: 400 });
        }

        const topicsSummary = Array.isArray(topics) && topics.length > 0
            ? topics.map((t, i) => {
                const title = typeof t === 'string' ? t : (t?.topic || t?.topics || t?.title || `Topic ${i + 1}`);
                const preview = typeof t === 'object' && t?.content ? (t.content.replace(/<[^>]*>?/gm, ' ').slice(0, 150)) : '';
                return `${i + 1}. ${title}${preview ? `: ${preview}` : ''}`;
            }).join("\n")
            : `Key concepts of ${chapterName}`;

        const prompt = CHAPTER_QUIZ_PROMPT
            .replace("{courseTitle}", courseTitle || "Online Course")
            .replace("{chapterNumber}", (chapterIndex + 1).toString())
            .replace(/{chapterName}/g, chapterName)
            .replace("{topicsSummary}", topicsSummary);

        let questions = null;

        if (process.env.GEMINI_API_KEY) {
            const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
            for (const modelName of modelsToTry) {
                try {
                    const response = await ai.models.generateContent({
                        model: modelName,
                        config: {
                            responseMimeType: 'application/json',
                        },
                        contents: prompt,
                    });

                    if (response?.text) {
                        const parsed = JSON.parse(response.text);
                        if (Array.isArray(parsed?.questions) && parsed.questions.length >= 3) {
                            questions = parsed.questions.slice(0, 3);
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`Gemini chapter quiz error (${modelName}):`, err?.message || err);
                }
            }
        }

        if (!questions || questions.length < 3) {
            questions = generateFallbackChapterQuestions(chapterIndex, chapterName, courseTitle, topics);
        }

        return NextResponse.json({
            success: true,
            chapterIndex,
            chapterName,
            questions: questions.slice(0, 3)
        });
    } catch (error) {
        console.error("Error generating chapter quiz:", error);
        return NextResponse.json({
            success: true,
            questions: generateFallbackChapterQuestions(0, "Chapter Assessment", "Course", [])
        });
    }
}
