import { db } from "@/config/db";
import { coursestable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {

    const { searchParams } = new URL(req.url);
    const courseId = searchParams?.get('courseId');
    const user = await currentUser();

    if (courseId) {
        const result = await db.select().from(coursestable)
            .where(eq(coursestable.cid, courseId));

        console.log(result);
        return NextResponse.json(result[0]);
    }
    else {
        const result = await db.select().from(coursestable)
            .where(eq(coursestable.userEmail, user.primaryEmailAddress?.emailAddress));;
        console.log(result);
        return NextResponse.json(result);
    }
}


