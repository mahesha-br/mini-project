import { NextResponse } from "next/server";
import { ai } from "../generate-course-layout/route";
import { db } from "@/config/db";
import { coursestable } from "@/config/schema";
import { eq } from "drizzle-orm";

const PROMPT = `Based on Chapter name and Topic, generate detailed learning content for each topic in valid HTML (paragraphs, code blocks with syntax formatting, bullet points, key concepts) and return response strictly in JSON format.
Schema:
{
  "chapterName": "string",
  "topics": [
    {
      "topic": "string",
      "content": "HTML string"
    }
  ]
}
: User Input: `;

export async function POST(req) {
    try {
        const { course, courseTitle, courseId } = await req.json();

        const courseData = course?.courseJson?.course || course?.courseJson || course;
        const chapters = courseData?.chapters || [];
        const targetCourseId = courseId || course?.cid;

        if (!chapters?.length) {
            return NextResponse.json({ error: "No chapters found in course to generate content" }, { status: 400 });
        }

        const config = {
            responseMimeType: 'application/json',
        };

        const generatedContentResult = await Promise.all(
            chapters.map(async (chapter) => {
                const inputData = {
                    courseName: courseTitle || courseData?.name || course?.name,
                    chapterName: chapter?.chapterName,
                    topics: chapter?.topics || []
                };

                const contents = PROMPT + JSON.stringify(inputData);

                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-3.6-flash',
                        config,
                        contents,
                    });

                    if (response?.text) {
                        return JSON.parse(response.text);
                    }
                } catch (err) {
                    console.warn(`Gemini error for chapter ${chapter?.chapterName}:`, err?.message || err);
                }

                // Fallback structured content if single attempt errors out
                return {
                    chapterName: chapter?.chapterName,
                    topics: (chapter?.topics || []).map(t => ({
                        topic: t,
                        content: `<h3>${t}</h3><p>Detailed study material and lesson guide for ${t} in ${chapter?.chapterName}.</p>`
                    }))
                };
            })
        );

        // Update database courseJson with generated topics content
        if (targetCourseId) {
            const existingCourse = await db.select().from(coursestable).where(eq(coursestable.cid, targetCourseId));
            if (existingCourse?.length > 0) {
                const currentRecord = existingCourse[0];
                let updatedCourseJson = currentRecord.courseJson || {};

                // Attach generated content to course chapters
                if (updatedCourseJson.course?.chapters) {
                    updatedCourseJson.course.chapters = updatedCourseJson.course.chapters.map((chap, idx) => ({
                        ...chap,
                        content: generatedContentResult[idx] || null
                    }));
                }
                updatedCourseJson.generatedContent = generatedContentResult;

                await db.update(coursestable)
                    .set({ courseJson: updatedCourseJson })
                    .where(eq(coursestable.cid, targetCourseId));
            }
        }

        return NextResponse.json({
            success: true,
            result: generatedContentResult
        });
    } catch (error) {
        console.error("Error generating course content:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}