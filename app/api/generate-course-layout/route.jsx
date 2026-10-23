import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursestable, usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";

export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const PROMPT = `You are an expert curriculum designer and educator.
Generate a structured, high-quality learning course in strictly valid JSON format based on the details provided.

MANDATORY RULES FOR CHAPTERS & TOPICS:
1. Exact Number of Chapters: Generate exactly the requested number of chapters ("noOfChapters").
2. EXACTLY 4 TOPICS PER CHAPTER: Every single chapter in the "chapters" array MUST have an array of EXACTLY 4 distinct topic titles (strings). Never 3, never 5, ALWAYS exactly 4 topics per chapter.
3. DIFFERENT & PROGRESSIVE TOPICS ACCORDING TO CHAPTERS:
   - Each chapter represents a distinct phase of learning in the course (e.g. Chapter 1 covers introductory fundamentals and setup; Chapter 2 covers core principles and architecture; Chapter 3 covers practical implementation and deep-dive techniques; Chapter 4+ covers advanced patterns, testing, performance, security, and capstone applications).
   - The 4 topics within each chapter must be specifically tailored to that chapter's theme and focus.
   - Topics must be completely DIFFERENT across chapters — no duplicate, repeated, or generic placeholder topics. Every chapter must explore 4 fresh, in-depth topics relevant to that stage of the course.
   - Topics should be descriptive, clear, educational titles.

JSON Schema to follow strictly:
{
  "course": {
    "name": "Course Title",
    "description": "Comprehensive course overview describing what the student will learn",
    "category": "Category name",
    "level": "beginner | moderate | advanced",
    "includeVideo": boolean,
    "noOfChapters": number,
    "chapters": [
      {
        "chapterName": "Chapter 1: Descriptive Title Reflecting This Chapter's Specific Focus",
        "duration": "45 mins",
        "topics": [
          "Unique Chapter 1 Topic 1 Title",
          "Unique Chapter 1 Topic 2 Title",
          "Unique Chapter 1 Topic 3 Title",
          "Unique Chapter 1 Topic 4 Title"
        ]
      }
    ]
  }
}
User Input: `;

const PROGRESSIVE_CHAPTER_THEMES = [
    {
        phase: "Foundations & Environment",
        topics: [
            (title) => `Core Concepts & Foundational Principles of ${title}`,
            (title) => `Environment Setup, Tooling & Prerequisites`,
            (title) => `Fundamental Syntax, Data Structures & Basic Workflows`,
            (title) => `Hands-on Milestone: Your First Working Implementation`
        ]
    },
    {
        phase: "Core Architecture & Mechanics",
        topics: [
            (title) => `Architectural Patterns & Component Mechanics in ${title}`,
            (title) => `State Management, Data Flow & Working with APIs`,
            (title) => `Handling User Inputs, Validations & Edge Scenarios`,
            (title) => `Practical Exercise: Building Interactive Core Features`
        ]
    },
    {
        phase: "Advanced Engineering & Scalability",
        topics: [
            (title) => `Modular Design, Code Organization & Reusability`,
            (title) => `Asynchronous Operations, Concurrency & Stream Processing`,
            (title) => `Integration with External Ecosystems & Third-Party Libraries`,
            (title) => `End-to-End Implementation: Constructing a Full Module`
        ]
    },
    {
        phase: "Performance, Testing & Security",
        topics: [
            (title) => `Performance Profiling, Caching & Memory Optimization`,
            (title) => `Defensive Engineering, Authentication & Security Standards`,
            (title) => `Automated Unit, Integration & End-to-End Testing`,
            (title) => `Production Readiness, CI/CD & Deployment Strategies`
        ]
    },
    {
        phase: "Ecosystem Mastery & Capstone",
        topics: [
            (title) => `Modern Ecosystem Trends & Next-Gen Tooling for ${title}`,
            (title) => `Enterprise Design Systems & Microservice Architecture`,
            (title) => `Troubleshooting Complex Scenarios & Incident Management`,
            (title) => `Comprehensive Capstone Project & Real-World Portfolio Piece`
        ]
    }
];

function getStageTheme(index, courseTitle) {
    const themeIndex = index % PROGRESSIVE_CHAPTER_THEMES.length;
    const cycle = Math.floor(index / PROGRESSIVE_CHAPTER_THEMES.length);
    const theme = PROGRESSIVE_CHAPTER_THEMES[themeIndex];
    const prefix = cycle > 0 ? `Advanced Part ${cycle + 1}: ` : '';
    const chapterName = `Chapter ${index + 1}: ${prefix}${theme.phase} in ${courseTitle}`;
    const topics = theme.topics.map(tFn => tFn(courseTitle));
    return { chapterName, topics };
}

function generateFallbackChapters(courseTitle, numChaps) {
    const total = Math.max(1, Number(numChaps || 1));
    const result = [];
    for (let i = 0; i < total; i++) {
        const stage = getStageTheme(i, courseTitle);
        result.push({
            chapterName: stage.chapterName,
            duration: "45 mins",
            topics: stage.topics
        });
    }
    return result;
}

/**
 * Normalizes chapters to ensure each chapter has exactly 4 distinct topics,
 * tailored specifically to that chapter and non-repeating across chapters.
 */
function normalizeChaptersWithFourTopics(chapters, courseTitle, requestedCount = 1) {
    const targetCount = Math.max(1, Number(requestedCount || 1));
    let baseChapters = Array.isArray(chapters) && chapters.length > 0
        ? [...chapters]
        : generateFallbackChapters(courseTitle, targetCount);

    // If fewer chapters than requested, supplement them
    while (baseChapters.length < targetCount) {
        const stage = getStageTheme(baseChapters.length, courseTitle);
        baseChapters.push({
            chapterName: stage.chapterName,
            duration: "45 mins",
            topics: stage.topics
        });
    }

    // If more chapters than requested, slice to requested count
    if (baseChapters.length > targetCount) {
        baseChapters = baseChapters.slice(0, targetCount);
    }

    const seenTopicsAllChapters = new Set();

    return baseChapters.map((chap, index) => {
        const stage = getStageTheme(index, courseTitle);
        const chapterName = chap?.chapterName?.trim() || stage.chapterName;
        const duration = chap?.duration || "45 mins";

        // Extract raw topics
        const rawTopics = Array.isArray(chap?.topics)
            ? chap.topics
                .map(t => typeof t === 'string' ? t.trim() : (t?.topic || t?.name || '').trim())
                .filter(Boolean)
            : [];

        // Deduplicate within chapter
        const distinctTopics = [];
        const seenInChapter = new Set();

        for (const t of rawTopics) {
            const lower = t.toLowerCase();
            if (!seenInChapter.has(lower)) {
                seenInChapter.add(lower);
                distinctTopics.push(t);
            }
        }

        // Keep top 4 if more than 4
        let finalTopics = distinctTopics.slice(0, 4);

        // Fill up to 4 if fewer than 4
        if (finalTopics.length < 4) {
            for (const fallbackTopic of stage.topics) {
                if (finalTopics.length >= 4) break;
                const lower = fallbackTopic.toLowerCase();
                if (!seenInChapter.has(lower) && !seenTopicsAllChapters.has(lower)) {
                    seenInChapter.add(lower);
                    finalTopics.push(fallbackTopic);
                }
            }

            let subCounter = 1;
            while (finalTopics.length < 4) {
                const generatedTopic = `${chapterName} - Key Focus ${subCounter}: Practical Applications & Analysis`;
                const lower = generatedTopic.toLowerCase();
                if (!seenInChapter.has(lower)) {
                    seenInChapter.add(lower);
                    finalTopics.push(generatedTopic);
                }
                subCounter++;
            }
        }

        // Record topics to prevent duplicate across chapters
        finalTopics.forEach(t => seenTopicsAllChapters.add(t.toLowerCase()));

        return {
            ...chap,
            chapterName,
            duration,
            topics: finalTopics
        };
    });
}

const CURATED_BANNERS = {
    code: [
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&h=900&auto=format&fit=crop&q=80'
    ],
    design: [
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1600&h=900&auto=format&fit=crop&q=80'
    ],
    business: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=900&auto=format&fit=crop&q=80'
    ],
    data: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1600&h=900&auto=format&fit=crop&q=80'
    ],
    general: [
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&h=900&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=900&auto=format&fit=crop&q=80'
    ]
};

export const maxDuration = 60;

export async function POST(req) {
    try {
        const formData = await req.json();

        let userEmail = formData?.userEmail || null;
        let hasPremiumAccess = false;
        try {
            const { has } = await auth();
            const user = await currentUser();
            if (user?.primaryEmailAddress?.emailAddress) {
                userEmail = user.primaryEmailAddress.emailAddress;
            }
            if (has) {
                hasPremiumAccess = has({ plan: 'starter' });
            }
        } catch (authErr) {
            console.warn("Clerk auth check warning in API:", authErr?.message || authErr);
        }

        if (!hasPremiumAccess && userEmail) {
            const result = await db.select().from(coursestable).where(eq(coursestable.userEmail, userEmail));
            if (result?.length >= 1) {
                return NextResponse.json({ 'resp': 'limit reached' });
            }
        }

        const config = {
            responseMimeType: 'application/json',
        };
        const contents = PROMPT + JSON.stringify(formData);

        const modelsToTry = [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
        ];
        let response = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    response = await ai.models.generateContent({
                        model: modelName,
                        config,
                        contents,
                    });
                    if (response?.text) {
                        break;
                    }
                } catch (err) {
                    console.warn(`Gemini model ${modelName} attempt ${attempt + 1} error:`, err?.message || err);
                    lastError = err;
                    await new Promise(r => setTimeout(r, 500));
                }
            }
            if (response?.text) {
                break;
            }
        }

        let courseLayoutJson = {};
        if (response?.text) {
            try {
                const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                courseLayoutJson = JSON.parse(cleaned);
            } catch {
                try {
                    courseLayoutJson = JSON.parse(response.text);
                } catch (parseErr) {
                    console.warn("JSON parse error from Gemini:", parseErr);
                    courseLayoutJson = {};
                }
            }
        }

        const courseTitle = formData?.name || "New Course";
        const userDescription = formData?.description?.trim() ? formData.description.trim() : '';
        const requestedChapters = Math.max(1, Number(formData?.noOfChapters || 1));

        if (!courseLayoutJson?.course) {
            console.warn("Gemini API overloaded or unavailable; generating fallback course structure.");
            courseLayoutJson = {
                course: {
                    name: courseTitle,
                    description: userDescription || `Comprehensive learning course covering ${courseTitle} key concepts and practical applications.`,
                    category: formData?.category || "General",
                    level: formData?.level || "beginner",
                    includeVideo: Boolean(formData?.includeVideo),
                    noOfChapters: requestedChapters,
                    chapters: generateFallbackChapters(courseTitle, requestedChapters)
                }
            };
        }

        // Normalize chapters: enforce EXACTLY 4 distinct, chapter-specific topics for each chapter
        courseLayoutJson.course.chapters = normalizeChaptersWithFourTopics(
            courseLayoutJson?.course?.chapters,
            courseLayoutJson?.course?.name || courseTitle,
            requestedChapters
        );
        courseLayoutJson.course.noOfChapters = courseLayoutJson.course.chapters.length;

        const aiDescription = courseLayoutJson?.course?.description?.trim() ? courseLayoutJson.course.description.trim() : '';
        const finalDescription = userDescription || aiDescription || '';

        if (courseLayoutJson?.course) {
            courseLayoutJson.course.description = finalDescription;
        }

        const finalCourseTitle = courseLayoutJson?.course?.name || courseTitle;
        const bannerImageUrl = await GenerateBannerImage(finalCourseTitle, finalDescription);

        const courseId = formData?.courseId || crypto.randomUUID();

        let validUserEmail = null;
        if (userEmail) {
            const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
            if (existingUser?.length > 0) {
                validUserEmail = userEmail;
            } else {
                try {
                    const userName = userEmail.split('@')[0] || "User";
                    await db.insert(usersTable).values({
                        name: userName,
                        email: userEmail
                    }).returning();
                    validUserEmail = userEmail;
                } catch (userErr) {
                    console.error("Error creating user entry in DB:", userErr);
                    validUserEmail = null;
                }
            }
        }

        const dbResult = await db.insert(coursestable).values({
            cid: courseId,
            name: formData?.name || courseLayoutJson?.course?.name,
            description: finalDescription,
            noOfChapters: Number(courseLayoutJson?.course?.noOfChapters || requestedChapters),
            includeVideo: Boolean(formData?.includeVideo),
            level: formData?.level || courseLayoutJson?.course?.level || 'beginner',
            catetgory: formData?.category || courseLayoutJson?.course?.category,
            courseJson: courseLayoutJson,
            bannerImageUrl: bannerImageUrl,
            userEmail: validUserEmail
        }).returning();

        console.log("Successfully stored course in database:", dbResult[0]);

        return NextResponse.json({
            courseId: courseId,
            result: dbResult[0],
            courseLayout: courseLayoutJson,
            bannerImageUrl: bannerImageUrl
        });
    } catch (error) {
        console.error("Error generating course layout:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GenerateBannerImage = async (courseName, description) => {
    try {
        const prompt = `Based on the course title "${courseName || 'Course'}" and description "${description || ''}", respond with ONLY 2 comma-separated keywords describing the subject (e.g. "programming, code" or "design, art").`;

        const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        let response = null;
        for (const modelName of modelsToTry) {
            try {
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                });
                if (response?.text) break;
            } catch (err) {
                console.warn(`Banner model ${modelName} error:`, err?.message || err);
            }
        }

        const text = (response?.text || "").toLowerCase();
        let category = 'general';
        if (text.includes('code') || text.includes('program') || text.includes('python') || text.includes('react') || text.includes('web') || text.includes('tech') || text.includes('dev')) {
            category = 'code';
        } else if (text.includes('design') || text.includes('art') || text.includes('ui') || text.includes('ux') || text.includes('graphic')) {
            category = 'design';
        } else if (text.includes('data') || text.includes('ai') || text.includes('science') || text.includes('machine')) {
            category = 'data';
        } else if (text.includes('business') || text.includes('finance') || text.includes('market') || text.includes('management')) {
            category = 'business';
        }

        const list = CURATED_BANNERS[category] || CURATED_BANNERS.general;
        const randomIndex = Math.floor(Math.random() * list.length);
        return list[randomIndex];
    } catch (err) {
        console.warn("Banner selection error:", err);
        return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&h=900&auto=format&fit=crop&q=80';
    }
};
