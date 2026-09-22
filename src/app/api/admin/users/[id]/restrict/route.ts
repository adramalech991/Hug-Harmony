import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const restrictSchema = z.object({
    restrictionType: z.enum(["messaging", "booking", "posting", "all"]),
    reason: z.string().min(3),
    durationHours: z.number().min(1).max(720), // Max 30 days
});

// POST - Apply temporary restriction
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
        const { restrictionType, reason, durationHours } = restrictSchema.parse(body);

        // Check if user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isAdmin: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Cannot restrict admins
        if (targetUser.isAdmin) {
            return NextResponse.json({ error: "Cannot restrict admin users" }, { status: 400 });
        }

        const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

        const restriction = await prisma.temporaryRestriction.create({
            data: {
                userId,
                restrictionType,
                reason,
                imposedBy: session.user.id,
                expiresAt,
            },
        });

        // Log action
        await prisma.moderationAction.create({
            data: {
                moderatorId: session.user.id,
                actionType: "restrict_user",
                targetUserId: userId,
                reason,
                details: `${restrictionType} restricted for ${durationHours} hours`,
                severity: "high",
            },
        });

        return NextResponse.json({
            success: true,
            message: "User restriction applied",
            restriction,
        });
    } catch (error) {
        console.error("Restrict user error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET - Get active restrictions for user
export async function GET(
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
        const restrictions = await prisma.temporaryRestriction.findMany({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() },
            },
            include: {
                moderator: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { startedAt: "desc" },
        });

        return NextResponse.json({ restrictions });
    } catch (error) {
        console.error("Get restrictions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove restriction
export async function DELETE(
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
        const { searchParams } = new URL(request.url);
        const restrictionId = searchParams.get("restrictionId");

        if (!restrictionId) {
            return NextResponse.json({ error: "Restriction ID required" }, { status: 400 });
        }

        await prisma.temporaryRestriction.update({
            where: { id: restrictionId },
            data: {
                isActive: false,
                removedAt: new Date(),
                removedBy: session.user.id,
            },
        });

        // Log action
        await prisma.moderationAction.create({
            data: {
                moderatorId: session.user.id,
                actionType: "remove_restriction",
                targetUserId: userId,
                reason: "Restriction removed early",
                severity: "normal",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Restriction removed",
        });
    } catch (error) {
        console.error("Remove restriction error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
