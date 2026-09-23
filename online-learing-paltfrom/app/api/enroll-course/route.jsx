import { db } from "@/config/db";
import { coursestable, enrollCourseTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.select().from(coursestable)
        .innerJoin(enrollCourseTable, eq(coursestable.cid, enrollCourseTable.cid))
        .where(eq(enrollCourseTable.userEmail, userEmail))
        .orderBy(desc(enrollCourseTable.id));

    return NextResponse.json(result);
}