import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursestable } from "@/config/schema";
import { eq } from "drizzle-orm";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

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
        const { courseId, courseName, description } = await req.json();

        const prompt = `Based on the course title "${courseName || 'Course'}" and description "${description || ''}", respond with ONLY 2 comma-separated keywords describing the topic.`;

        let category = 'general';
        const modelsToTry = ['gemini-3.5-flash', 'gemini-3.0-flash', 'gemini-2.5-flash'];
        let response = null;
        for (const modelName of modelsToTry) {
            try {
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                });
                if (response?.text) break;
            } catch (err) {
                console.warn(`Banner API model ${modelName} error:`, err?.message || err);
            }
        }
        const text = (response?.text || "").toLowerCase();
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
        const bannerImageUrl = list[randomIndex];

        if (courseId) {
            await db.update(coursestable)
                .set({ bannerImageUrl: bannerImageUrl })
                .where(eq(coursestable.cid, courseId));
        }

        return NextResponse.json({ bannerImageUrl: bannerImageUrl });
    } catch (error) {
        console.error("Error generating banner image:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
