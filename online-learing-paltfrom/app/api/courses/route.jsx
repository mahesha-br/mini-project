import { db } from "@/config/db";
import { coursestable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
        }

        const result = await db.select().from(coursestable).where(eq(coursestable.cid, courseId));
        console.log(result);
        return NextResponse.json(result[0] || null);
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}