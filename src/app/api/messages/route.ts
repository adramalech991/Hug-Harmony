import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createMessageNotification } from "@/lib/notifications";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { conversationId, text, recipientId, imageUrl } = body;

  // Validation
  if (!conversationId || (!text && !imageUrl) || !recipientId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (
    !/^[0-9a-fA-F]{24}$/.test(conversationId) ||
    !/^[0-9a-fA-F]{24}$/.test(recipientId)
  ) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId1: true, userId2: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant = [conversation.userId1, conversation.userId2].includes(
      session.user.id
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if conversation is blocked by moderator
    const activeBlock = await prisma.conversationBlock.findFirst({
      where: {
        conversationId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    if (activeBlock) {
      return NextResponse.json(
        { error: "This conversation has been temporarily blocked by a moderator" },
        { status: 403 }
      );
    }

    // Check if users have blocked each other
    const { canUsersInteract } = await import("@/lib/services/blocking.service");
    const canInteract = await canUsersInteract(session.user.id, recipientId);

    if (!canInteract) {
      return NextResponse.json(
        { error: "Cannot send message to this user" },
        { status: 403 }
      );
    }

    // Check if user has active messaging restriction
    const messagingRestriction = await prisma.temporaryRestriction.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: { gt: new Date() },
        restrictionType: { in: ["messaging", "all"] }
      }
    });

    if (messagingRestriction) {
      return NextResponse.json(
        { error: "Your messaging privileges have been temporarily restricted" },
        { status: 403 }
      );
    }

    // Create message with sender info
    const message = await prisma.message.create({
      data: {
        text: text || "",
        senderId: session.user.id,
        recipientId,
        conversationId,
        imageUrl,
        isAudio: false,
      },
      include: {
        senderUser: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
            professionalApplication: {
              select: { professionalId: true },
            },
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Get professional application info
    const profApp = message.senderUser?.professionalApplication;
    const isProfessional = !!profApp?.professionalId;
    const professionalId = profApp?.professionalId ?? null;

    // Get sender name for notification
    const senderName =
      `${message.senderUser?.firstName ?? ""} ${message.senderUser?.lastName ?? ""}`.trim() ||
      "Someone";

    // Format message for response
    const formattedMessage = {
      id: message.id,
      text: message.text,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
      userId: message.recipientId,
      isAudio: message.isAudio,
      isSystem: false,
      proposalId: null,
      proposalStatus: null,
      initiator: null,
      sender: {
        name: senderName,
        profileImage: message.senderUser?.profileImage ?? null,
        isProfessional,
        userId: professionalId,
      },
    };

    // Still send notification to recipient (push/email/etc.)
    createMessageNotification(
      session.user.id,
      senderName,
      recipientId,
      conversationId,
      text || (imageUrl ? "📷 Image" : undefined)
    ).catch((err) => {
      console.error("Notification error:", err);
    });

    // Broadcast message via Pusher
    try {
      await pusherServer.trigger(
        `presence-conversation-${conversationId}`,
        "newMessage",
        {
          type: "newMessage",
          message: formattedMessage,
        }
      );
    } catch (err) {
      console.error("Failed to trigger Pusher event for message:", err);
    }

    return NextResponse.json(formattedMessage, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
