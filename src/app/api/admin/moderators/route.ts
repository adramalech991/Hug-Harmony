// src/app/api/admin/moderators/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const moderatorSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6),
});


// Helper to check if user is a super-admin
async function checkSuperAdmin() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true },
    });

    if (!user?.isAdmin) return null;
    return session.user.id;
}

// GET - List all moderators
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Allow both admins and moderators to see the list
        if (!session.user.isAdmin && !session.user.isModerator) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const moderators = await prisma.user.findMany({
            where: { isModerator: true },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                lastLoginAt: true,
                status: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ moderators });
    } catch (error) {
        console.error("Fetch moderators error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new moderator
export async function POST(request: NextRequest) {
    try {
        const adminId = await checkSuperAdmin();
        if (!adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = moderatorSchema.parse(body);

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: validatedData.email },
                    { usernameLower: validatedData.username.toLowerCase() },
                ],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username or email already exists" },
                { status: 400 }
            );
        }

        const moderator = await prisma.user.create({
            data: {
                email: validatedData.email,
                username: validatedData.username,
                usernameLower: validatedData.username.toLowerCase(),
                password: validatedData.password, // Plain text as per project preference (Warning: Use hashing in production)
                isModerator: true,
                isAdmin: false,
                emailVerified: true,
                emailVerifiedAt: new Date(),
                status: "active",
            },
        });

        return NextResponse.json({
            success: true,
            moderator: {
                id: moderator.id,
                username: moderator.username,
                email: moderator.email,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        console.error("Create moderator error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
