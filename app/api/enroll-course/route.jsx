import { db } from "@/config/db";
import { coursestable, enrollCourseTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const maxDuration = 60;

// Retry helper for handling momentary network connection drops (Neon/Clerk)
async function withRetry(fn, retries = 2, delayMs = 600) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < retries) {
                await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
            }
        }
    }
    throw lastError;
}

export async function POST(req) {
    try {
        const { courseId } = await req.json();
        const user = await withRetry(() => currentUser());
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // if course already enrolled
        const enrollCourse = await withRetry(() =>
            db.select().from(enrollCourseTable)
                .where(and(
                    eq(enrollCourseTable.userEmail, userEmail),
                    eq(enrollCourseTable.cid, courseId)
                ))
        );

        if (enrollCourse?.length === 0) {
            const result = await withRetry(() =>
                db.insert(enrollCourseTable).values({
                    cid: courseId,
                    userEmail: userEmail
                }).returning(enrollCourseTable)
            );

            return NextResponse.json(result);
        }

        return NextResponse.json({ 'resp': 'Already Enrolled' });
    } catch (error) {
        console.error("POST /api/enroll-course error:", error);
        return NextResponse.json(
            { error: "Database or network connection error. Please check your internet connection.", details: error?.message },
            { status: 503 }
        );
    }
}

export async function GET(req) {
    try {
        const user = await withRetry(() => currentUser());
        const { searchParams } = new URL(req.url);
        const courseId = searchParams?.get('courseId');
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (courseId) {
            const result = await withRetry(() =>
                db.select().from(coursestable)
                    .innerJoin(enrollCourseTable, eq(coursestable.cid, enrollCourseTable.cid))
                    .where(and(
                        eq(enrollCourseTable.userEmail, userEmail),
                        eq(enrollCourseTable.cid, courseId)
                    ))
                    .orderBy(desc(enrollCourseTable.id))
            );
            return NextResponse.json(result[0] || null);
        } else {
            const result = await withRetry(() =>
                db.select().from(coursestable)
                    .innerJoin(enrollCourseTable, eq(coursestable.cid, enrollCourseTable.cid))
                    .where(eq(enrollCourseTable.userEmail, userEmail))
                    .orderBy(desc(enrollCourseTable.id))
            );
            return NextResponse.json(result);
        }
    } catch (error) {
        console.error("GET /api/enroll-course error:", error);
        return NextResponse.json(
            { error: "Database or network connection error. Please check your internet connection.", details: error?.message },
            { status: 503 }
        );
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { completedChapters, completedChapter, completedChapetr, courseId, videoProgress, quizScores } = body;
        const user = await withRetry(() => currentUser());
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        const existing = await withRetry(() =>
            db.select().from(enrollCourseTable)
                .where(and(
                    eq(enrollCourseTable.cid, courseId),
                    eq(enrollCourseTable.userEmail, userEmail)
                ))
        );

        if (!existing || existing.length === 0) {
            return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
        }

        const currentRecord = existing[0];
        const updateData = {};

        if (completedChapters !== undefined || completedChapter !== undefined || completedChapetr !== undefined) {
            updateData.completedChapters = completedChapters ?? completedChapter ?? completedChapetr ?? [];
        }

        if (videoProgress !== undefined) {
            const prevVideo = (currentRecord.videoProgress && typeof currentRecord.videoProgress === 'object') ? currentRecord.videoProgress : {};
            if (typeof videoProgress === 'object' && !Array.isArray(videoProgress)) {
                updateData.videoProgress = {
                    ...prevVideo,
                    ...videoProgress,
                    watchedSeconds: {
                        ...(prevVideo.watchedSeconds || {}),
                        ...(videoProgress.watchedSeconds || {}),
                    },
                    durations: {
                        ...(prevVideo.durations || {}),
                        ...(videoProgress.durations || {}),
                    },
                    percentages: {
                        ...(prevVideo.percentages || {}),
                        ...(videoProgress.percentages || {}),
                    },
                    chapterVideos: {
                        ...(prevVideo.chapterVideos || {}),
                        ...(videoProgress.chapterVideos || {}),
                    },
                };
            } else {
                updateData.videoProgress = videoProgress;
            }
        }

        if (quizScores !== undefined) {
            const prevScores = (currentRecord.quizScores && typeof currentRecord.quizScores === 'object') ? currentRecord.quizScores : {};
            updateData.quizScores = (typeof quizScores === 'object' && !Array.isArray(quizScores))
                ? { ...prevScores, ...quizScores }
                : quizScores;
        }

        const result = await withRetry(() =>
            db.update(enrollCourseTable).set(updateData).where(and(
                eq(enrollCourseTable.cid, courseId),
                eq(enrollCourseTable.userEmail, userEmail)
            )).returning(enrollCourseTable)
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("PUT /api/enroll-course error:", error);
        return NextResponse.json(
            { error: "Database or network connection error. Please check your internet connection.", details: error?.message },
            { status: 503 }
        );
    }
}