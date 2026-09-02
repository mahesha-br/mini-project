import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { coursestable } from "@/config/schema";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const PROMPT = `Genrate Learning Course depends on following details. In which Make sure to add Course Name, Description,Course Banner Image Prompt (Create a modern, flat-style 2D digital illustration representing user Topic. Include UI/UX elements such as mockup screens, text blocks, icons, buttons, and creative workspace tools. Add symbolic elements related to user Course, like sticky notes, design components, and visual aids. Use a vibrant color palette (blues, purples, oranges) with a clean, professional look. The illustration should feel creative, tech-savvy, and educational, ideal for visualizing concepts in user Course) for Course Banner in 3d format Chapter Name, , Topic under each chapters , Duration for each chapters etc, in JSON format only
Schema:
{
  "course": {
    "name": "string",
    "description": "string",
    "category": "string",
    "level": "string",
    "includeVideo": "boolean",
    "noOfChapters": "number",
    "bannerImagePrompt": "string",
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

export async function POST(req) {
    try {
        const formData = await req.json();

        // Model set to gemini-2.0-flash
        const model = 'gemini-3.6-flash';
        const config = {
            responseMimeType: 'application/json',
        };
        const contents = PROMPT + JSON.stringify(formData);

        const response = await ai.models.generateContent({
            model,
            config,
            contents,
        });

        console.log(response.text);

        // Parse generated AI response JSON
        let courseLayoutJson = {};
        try {
            courseLayoutJson = JSON.parse(response.text);
        } catch {
            courseLayoutJson = response.text;
        }

        // Get banner image prompt from generated course layout
        const imagePrompt = courseLayoutJson?.course?.bannerImagePrompt;
        let bannerImageData = null;
        if (imagePrompt) {
            bannerImageData = await GenerateImage(imagePrompt);
        }

        // Unique Course ID (from client or generated on server)
        const courseId = formData?.courseId || crypto.randomUUID();

        // Save to database
        const dbResult = await db.insert(coursestable).values({
            cid: courseId,
            name: formData?.name || courseLayoutJson?.course?.name,
            description: formData?.description || courseLayoutJson?.course?.description,
            noOfChapters: Number(formData?.noOfChapters || courseLayoutJson?.course?.noOfChapters || 1),
            includeVideo: Boolean(formData?.includeVideo),
            level: formData?.level || courseLayoutJson?.course?.level || 'beginner',
            catetgory: formData?.category || courseLayoutJson?.course?.category,
            courseJson: courseLayoutJson,
            userEmail: formData?.userEmail || null
        }).returning();

        return NextResponse.json({
            courseId: courseId,
            result: dbResult[0],
            courseLayout: courseLayoutJson,
            bannerImage: bannerImageData
        });
    } catch (error) {
        console.error("Error generating course layout:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GenerateImage = async (prompt) => {
    try {
        const response = await fetch("https://api.limewire.com/v1/generations/image", {
            method: "POST",
            headers: {
                "x-api-key": process.env.GEMINI_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input: prompt || "self-portrait of a woman, lightning in the background",
                aspect_ratio: "1:1",
                width: 1024,
                height: 1024,
                mode: "sdxl"
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};
