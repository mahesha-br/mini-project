import { db } from "@/config/db";
import { coursestable, enrollCourseTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req) {
    const { courseId } = await req.json();
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // if course already enrolled
    const enrollCourse = await db.select().from(enrollCourseTable)
        .where(and(
            eq(enrollCourseTable.userEmail, userEmail),
            eq(enrollCourseTable.cid, courseId)
        ));

    if (enrollCourse?.length === 0) {
        const result = await db.insert(enrollCourseTable).values({
            cid: courseId,
            userEmail: userEmail
        }).returning(enrollCourseTable);

        return NextResponse.json(result);
    }

    return NextResponse.json({ 'resp': 'Already Enrolled' });
}

export async function GET(req) {
    const user = await currentUser();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams?.get('courseId');
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (courseId) {
        const result = await db.select().from(coursestable)
            .innerJoin(enrollCourseTable, eq(coursestable.cid, enrollCourseTable.cid))
            .where(and(
                eq(enrollCourseTable.userEmail, userEmail),
                eq(enrollCourseTable.cid, courseId)
            ))
            .orderBy(desc(enrollCourseTable.id));
        return NextResponse.json(result[0] || null);
    } else {
        const result = await db.select().from(coursestable)
            .innerJoin(enrollCourseTable, eq(coursestable.cid, enrollCourseTable.cid))
            .where(eq(enrollCourseTable.userEmail, userEmail))
            .orderBy(desc(enrollCourseTable.id));
        return NextResponse.json(result);
    }
}

export async function PUT(req) {
    const body = await req.json();
    const { completedChapters, completedChapter, completedChapetr, courseId, videoProgress, quizScores } = body;
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!courseId) {
        return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
    }

    const existing = await db.select().from(enrollCourseTable)
        .where(and(
            eq(enrollCourseTable.cid, courseId),
            eq(enrollCourseTable.userEmail, userEmail)
        ));

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
        updateData.videoProgress = (typeof videoProgress === 'object' && !Array.isArray(videoProgress))
            ? { ...prevVideo, ...videoProgress }
            : videoProgress;
    }

    if (quizScores !== undefined) {
        const prevScores = (currentRecord.quizScores && typeof currentRecord.quizScores === 'object') ? currentRecord.quizScores : {};
        updateData.quizScores = (typeof quizScores === 'object' && !Array.isArray(quizScores))
            ? { ...prevScores, ...quizScores }
            : quizScores;
    }

    const result = await db.update(enrollCourseTable).set(updateData).where(and(
        eq(enrollCourseTable.cid, courseId),
        eq(enrollCourseTable.userEmail, userEmail)
    )).returning(enrollCourseTable);

    return NextResponse.json(result);
}