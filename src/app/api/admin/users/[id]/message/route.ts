import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const messageSchema = z.object({
    message: z.string().min(1).max(2000),
    template: z.string().optional(), // "policy_violation", "general_notice", etc.
});

// POST - Send message to user
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

    const { id: targetUserId } = await params;

    try {
        const body = await request.json();
        const { message } = messageSchema.parse(body);

        // Check if target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, firstName: true, lastName: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find or create conversation between moderator and user
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { userId1: session.user.id, userId2: targetUserId },
                    { userId1: targetUserId, userId2: session.user.id },
                ],
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    userId1: session.user.id,
                    userId2: targetUserId,
                },
            });
        }

        // Create system message
        const systemMessage = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: session.user.id,
                recipientId: targetUserId,
                text: message,
                isSystem: true,
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        });

        // Log moderation action
        await prisma.moderationAction.create({
            data: {
                moderatorId: session.user.id,
                actionType: "message_user",
                targetUserId,
                reason: "Direct communication",
                details: message.substring(0, 200),
                severity: "normal",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Message sent successfully",
            systemMessage: {
                id: systemMessage.id,
                text: systemMessage.text,
                createdAt: systemMessage.createdAt,
            },
        });
    } catch (error) {
        console.error("Send moderator message error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
