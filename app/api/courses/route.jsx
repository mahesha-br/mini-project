import { db } from "@/config/db";
import { coursestable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams?.get('courseId');

    if (courseId == 0) {
        const result = await db.select().from(coursestable)
            .where(sql`${coursestable.courseContent}::jsonb!='{}'::jsonb`)
            .orderBy(desc(coursestable.id));

        console.log(result);
        return NextResponse.json(result);
    }

    if (courseId) {
        const result = await db.select().from(coursestable)
            .where(eq(coursestable.cid, courseId));

        console.log(result);
        return NextResponse.json(result[0]);
    }
    else {
        let userEmail = null;
        try {
            const user = await currentUser();
            userEmail = user?.primaryEmailAddress?.emailAddress;
        } catch (err) {
            console.warn("Auth check error in GET /api/courses:", err);
        }
        if (!userEmail) {
            return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
        }
        const result = await db.select().from(coursestable)
            .where(eq(coursestable.userEmail, userEmail))
            .orderBy(desc(coursestable.id));
        return NextResponse.json(result);
    }
}


