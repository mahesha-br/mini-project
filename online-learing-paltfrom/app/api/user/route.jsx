import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { email, name } = await req.json();

        // Check if user already exists
        const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, email));

        // If new user
        if (existingUsers?.length === 0) {
            const newUser = await db.insert(usersTable).values({
                name: name,
                email: email
            }).returning();

            console.log("Created new user:", newUser);
            return NextResponse.json(newUser[0]);
        }

        return NextResponse.json(existingUsers[0]);
    } catch (error) {
        console.error("User API error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}