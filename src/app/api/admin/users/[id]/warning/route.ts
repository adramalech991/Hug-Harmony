import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const warningSchema = z.object({
    title: z.string().min(3).max(100),
    message: z.string().min(10).max(1000),
    severity: z.enum(["low", "medium", "high"]),
});

// POST - Issue warning to user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, isModerator: true },
    });

    if (!user?.isAdmin && !user?.isModerator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = await params;

    try {
        const body = await request.json();
        const { title, message, severity } = warningSchema.parse(body);

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, firstName: true, lastName: true, email: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create user-visible warning
        const warning = await prisma.userWarning.create({
            data: {
                userId,
                title,
                message,
                severity,
                issuedBy: session.user.id,
            },
        });

        // Log moderation action
        await prisma.moderationAction.create({
            data: {
                moderatorId: session.user.id,
                actionType: "warn",
                targetUserId: userId,
                reason: title,
                details: message,
                severity,
            },
        });

        // TODO: Send email/push notification to user about the warning

        return NextResponse.json({
            success: true,
            message: "Warning issued successfully",
            warning,
        });
    } catch (error) {
        console.error("Issue warning error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET - Fetch user's warnings
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Users can only see their own warnings, moderators/admins can see any
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, isModerator: true },
    });

    if (userId !== session.user.id && !user?.isAdmin && !user?.isModerator) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const warnings = await prisma.userWarning.findMany({
            where: { userId },
            include: {
                moderator: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ warnings });
    } catch (error) {
        console.error("Fetch warnings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
