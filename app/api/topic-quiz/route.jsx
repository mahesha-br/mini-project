import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Fallback questions generator if AI service is temporarily slow or unavailable.
 * Ensures the student can always attend the quiz and earn their certificate.
 */
function generateFallbackQuestions(topicTitle, topicContent, chapterName) {
    const cleanContent = (topicContent || "")
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();

    return [
        {
            id: 1,
            question: `What is the primary concept covered in "${topicTitle}"?`,
            options: [
                `Understanding and applying core principles of ${topicTitle}`,
                `Deprecating existing features without replacement`,
                `Executing arbitrary scripts without validation`,
                `Skipping compilation and syntax validation`
            ],
            correctIndex: 0,
            explanation: `The lesson focuses on mastering the foundational concepts and practical application of ${topicTitle}.`
        },
        {
            id: 2,
            question: `In the context of ${chapterName || topicTitle}, which of the following represents a best practice?`,
            options: [
                `Writing modular, maintainable, and type-safe code following established conventions`,
                `Ignoring error handling and logging in critical paths`,
                `Hardcoding mutable global states across independent modules`,
                `Bypassing standard unit and integration tests`
            ],
            correctIndex: 0,
            explanation: `Following clean architecture and standard best practices ensures scalability and reliability.`
        },
        {
            id: 3,
            question: `When implementing ${topicTitle}, why is structured validation important?`,
            options: [
                `It guarantees predictable behavior, reduces runtime exceptions, and improves efficiency`,
                `It forces the program to consume unnecessary memory`,
                `It disables garbage collection permanently`,
                `It prevents any user interaction with the application`
            ],
            correctIndex: 0,
            explanation: `Structured validation prevents runtime failures and maintains system stability.`
        }
    ];
}

const QUIZ_PROMPT = `You are an expert educator. Generate 3 multiple choice questions (MCQs) to test a student's understanding of the given topic and lesson content.
Topic: {topicTitle}
Chapter: {chapterName}
Course: {courseTitle}
Content: {topicContent}

Return STRICT JSON adhering to this schema:
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
      "explanation": "Brief explanation of why this option is correct"
    }
  ]
}
Make sure correctIndex is an integer between 0 and 3 matching the correct option. Keep questions clear, relevant, and educational.`;

export async function POST(req) {
    try {
        const { topicTitle, topicContent, chapterName, courseTitle } = await req.json();

        if (!topicTitle) {
            return NextResponse.json({ error: "topicTitle is required" }, { status: 400 });
        }

        const prompt = QUIZ_PROMPT
            .replace("{topicTitle}", topicTitle)
            .replace("{chapterName}", chapterName || "")
            .replace("{courseTitle}", courseTitle || "")
            .replace("{topicContent}", (topicContent || "").slice(0, 1500));

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
                        if (Array.isArray(parsed?.questions) && parsed.questions.length >= 2) {
                            questions = parsed.questions;
                            break;
                        }
                    }
                } catch (err) {
                    console.warn(`Gemini quiz generation warning (${modelName}):`, err?.message || err);
                }
            }
        }

        if (!questions || !questions.length) {
            questions = generateFallbackQuestions(topicTitle, topicContent, chapterName);
        }

        return NextResponse.json({
            success: true,
            topicTitle,
            questions
        });
    } catch (error) {
        console.error("Error generating topic quiz:", error);
        return NextResponse.json({
            success: true,
            questions: generateFallbackQuestions("Topic Assessment", "", "Course")
        });
    }
}
