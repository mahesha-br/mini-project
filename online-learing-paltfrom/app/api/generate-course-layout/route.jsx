import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursestable, usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";

export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const PROMPT = `Generate Learning Course based on the following details. In which Make sure to add Course Name, Description, Chapter Name, Topic under each chapter, Duration for each chapter etc, in JSON format only.
Schema:
{
  "course": {
    "name": "string",
    "description": "string",
    "category": "string",
    "level": "string",
    "includeVideo": "boolean",
    "noOfChapters": "number",
    "chapters": [
      {
        "chapterName": "string",
        "duration": "string",
        "topics": [
          "string"
        ]
      }
    ]
  }
}
, User Input: `;

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

export async function POST(req) {
    try {
        const formData = await req.json();

        const config = {
            responseMimeType: 'application/json',
        };
        const contents = PROMPT + JSON.stringify(formData);

        const modelsToTry = [
            'gemini-3.6-flash',
            'gemini-3.5-flash'
        ];
        let response = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
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
                console.warn(`Gemini model ${modelName} attempt error:`, err?.message || err);
                lastError = err;
            }
        }

        if (!response?.text) {
            throw lastError || new Error("All Gemini model attempts failed. Please try again.");
        }

        let courseLayoutJson = {};
        try {
            courseLayoutJson = JSON.parse(response.text);
        } catch {
            courseLayoutJson = response.text;
        }

        const userDescription = formData?.description?.trim() ? formData.description.trim() : '';
        const aiDescription = courseLayoutJson?.course?.description?.trim() ? courseLayoutJson.course.description.trim() : '';
        const finalDescription = userDescription || aiDescription || '';

        if (courseLayoutJson?.course) {
            courseLayoutJson.course.description = finalDescription;
        }

        const courseTitle = courseLayoutJson?.course?.name || formData?.name || "Course";
        const bannerImageUrl = await GenerateBannerImage(courseTitle, finalDescription);

        const courseId = formData?.courseId || crypto.randomUUID();

        let validUserEmail = null;
        if (formData?.userEmail) {
            const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, formData.userEmail));
            if (existingUser?.length > 0) {
                validUserEmail = formData.userEmail;
            } else {
                try {
                    const userName = formData.userEmail.split('@')[0] || "User";
                    await db.insert(usersTable).values({
                        name: userName,
                        email: formData.userEmail
                    }).returning();
                    validUserEmail = formData.userEmail;
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
            noOfChapters: Number(formData?.noOfChapters || courseLayoutJson?.course?.noOfChapters || 1),
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

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        });

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
