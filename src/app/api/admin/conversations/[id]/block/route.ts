import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const blockSchema = z.object({
    reason: z.string().min(3),
    duration: z.number().optional(), // hours, null = indefinite
});

// POST - Block conversation
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

    const { id: conversationId } = await params;

    try {
        const body = await request.json();
        const { reason, duration } = blockSchema.parse(body);

        // Check if conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        // Calculate expiration
        const expiresAt = duration
            ? new Date(Date.now() + duration * 60 * 60 * 1000)
            : null;

        // Create block record
        const block = await prisma.conversationBlock.create({
            data: {
                conversationId,
                blockedBy: session.user.id,
                reason,
                expiresAt,
            },
        });

        // Log moderation action
        await prisma.moderationAction.create({
            data: {
                moderatorId: session.user.id,
                actionType: "block_conversation",
                targetConversationId: conversationId,
                reason,
                details: duration ? `Blocked for ${duration} hours` : "Blocked indefinitely",
                severity: "high",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Conversation blocked successfully",
            block,
        });
    } catch (error) {
        console.error("Block conversation error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Unblock conversation
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

    const { id: conversationId } = await params;

    try {
        // Find active block
        const block = await prisma.conversationBlock.findFirst({
            where: {
                conversationId,
                isActive: true,
            },
        });

        if (!block) {
            return NextResponse.json({ error: "No active block found" }, { status: 404 });
        }

        // Deactivate block
        await prisma.conversationBlock.update({
            where: { id: block.id },
            data: {
                isActive: false,
                unblockedAt: new Date(),
                unblockedBy: session.user.id,
            },
        });

        // Log action
        await prisma.moderationAction.create({
            data: {
                moderatorId: session.user.id,
                actionType: "unblock_conversation",
                targetConversationId: conversationId,
                reason: "Block removed",
                severity: "normal",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Conversation unblocked successfully",
        });
    } catch (error) {
        console.error("Unblock conversation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
