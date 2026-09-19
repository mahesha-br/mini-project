import { NextResponse } from "next/server";
import { ai } from "../generate-course-layout/route";
import { db } from "@/config/db";
import { coursestable } from "@/config/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

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
:User Input:`;

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
                const chapterTitle = chapter?.chapterName || "Chapter";
                const inputData = {
                    courseName: courseTitle || courseData?.name || course?.name,
                    chapterName: chapterTitle,
                    topics: chapter?.topics || []
                };

                const contents = PROMPT + JSON.stringify(inputData);
                let JSONResp = null;

                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-3.6-flash',
                        config,
                        contents,
                    });

                    if (response?.text) {
                        try {
                            JSONResp = JSON.parse(response.text);
                        } catch (parseErr) {
                            console.warn(`JSON parse error for chapter ${chapterTitle}:`, parseErr);
                        }
                    }
                } catch (err) {
                    console.warn(`Gemini error for chapter ${chapterTitle}:`, err?.message || err);
                }

                if (!JSONResp) {
                    // Fallback structured content if single attempt errors out
                    JSONResp = {
                        chapterName: chapterTitle,
                        topics: (chapter?.topics || []).map(t => ({
                            topic: typeof t === 'string' ? t : (t?.topic || 'Topic'),
                            content: `<h3>${typeof t === 'string' ? t : (t?.topic || 'Topic')}</h3><p>Detailed study material and lesson guide for ${typeof t === 'string' ? t : (t?.topic || 'Topic')} in ${chapterTitle}.</p>`
                        }))
                    };
                }

                const searchQuery = `${courseTitle || courseData?.name || ''} ${chapterTitle}`.trim();
                const youtubeData = await GetYoutubeVideo(searchQuery);

                return {
                    chapterName: chapterTitle,
                    content: JSONResp,
                    youtubeVideo: youtubeData
                };
            })
        );

        // Update database courseContent & courseJson with generated topics content & YouTube videos
        if (targetCourseId) {
            const existingCourse = await db.select().from(coursestable).where(eq(coursestable.cid, targetCourseId));
            if (existingCourse?.length > 0) {
                const currentRecord = existingCourse[0];
                let updatedCourseJson = currentRecord.courseJson || {};

                // Attach generated content and YouTube videos to course chapters
                if (updatedCourseJson.course?.chapters) {
                    updatedCourseJson.course.chapters = updatedCourseJson.course.chapters.map((chap, idx) => ({
                        ...chap,
                        content: generatedContentResult[idx]?.content || null,
                        youtubeVideo: generatedContentResult[idx]?.youtubeVideo || []
                    }));
                }
                updatedCourseJson.generatedContent = generatedContentResult;

                const dbResp = await db.update(coursestable)
                    .set({
                        courseContent: generatedContentResult,
                        courseJson: updatedCourseJson
                    })
                    .where(eq(coursestable.cid, targetCourseId))
                    .returning();

                console.log("Successfully updated course content & layout in database:", dbResp);
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

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

const GetYoutubeVideo = async (topic) => {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            console.warn("YOUTUBE_API_KEY is not configured in process.env");
            return [];
        }

        const params = {
            part: 'snippet',
            q: topic,
            maxResults: 4,
            type: 'video',
            key: apiKey
        };

        const resp = await axios.get(YOUTUBE_BASE_URL, { params });
        const youtubeVideoListResp = resp.data?.items || [];
        const youtubeVideoList = [];

        youtubeVideoListResp.forEach(item => {
            if (item.id?.videoId) {
                youtubeVideoList.push({
                    videoId: item.id.videoId,
                    title: item.snippet?.title || ''
                });
            }
        });

        console.log("youtubeVideoList", youtubeVideoList);
        return youtubeVideoList;
    } catch (err) {
        console.error(`Error fetching YouTube videos for topic "${topic}":`, err?.response?.data || err?.message || err);
        return [];
    }
};