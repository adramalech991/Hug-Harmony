// src/lib/services/appointment-messages.ts

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { createAppointmentNotification } from "@/lib/notifications";

/**
 * Create a system message in the conversation for an appointment update
 * This makes appointment events visible in the chat timeline
 */
export async function createAppointmentSystemMessage(
    userId: string,
    professionalUserId: string,
    messageText: string,
    appointmentId: string,
    sendNotifications: boolean = true
): Promise<void> {
    try {
        // Find conversation between user and professional
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { userId1: userId, userId2: professionalUserId },
                    { userId1: professionalUserId, userId2: userId },
                ],
            },
        });

        if (!conversation) {
            console.log(
                `No conversation found between user ${userId} and professional ${professionalUserId}. Creating one...`
            );
            // Create conversation if it doesn't exist
            conversation = await prisma.conversation.create({
                data: {
                    userId1: userId,
                    userId2: professionalUserId,
                },
            });
        }

        // Create system message
        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: userId,
                recipientId: professionalUserId,
                text: messageText,
                isSystem: true,
                isAudio: false,
            },
            include: {
                senderUser: {
                    select: {
                        firstName: true,
                        lastName: true,
                        name: true,
                        profileImage: true,
                    },
                },
            },
        });

        // Format message for WebSocket broadcast
        const formattedMessage = {
            id: message.id,
            text: message.text,
            imageUrl: null,
            createdAt: message.createdAt.toISOString(),
            senderId: message.senderId,
            recipientId: message.recipientId,
            userId: message.senderId,
            isAudio: false,
            isSystem: true,
            sender: {
                name:
                    message.senderUser?.name ||
                    `${message.senderUser?.firstName || ""} ${message.senderUser?.lastName || ""}`.trim() ||
                    "System",
                profileImage: message.senderUser?.profileImage || null,
                isProfessional: false,
                userId: message.senderId,
            },
            conversationId: conversation.id,
        };

        // Broadcast via WebSocket for real-time updates
        pusherServer.trigger(
            `presence-conversation-${conversation.id}`,
            "newMessage",
            {
                type: "newMessage",
                conversationId: conversation.id,
                message: formattedMessage,
            }
        ).catch((err) => console.error("Pusher broadcast error:", err));

        // Send notifications to both parties if requested
        if (sendNotifications) {
            await Promise.all([
                createAppointmentNotification(
                    userId,
                    messageText,
                    appointmentId
                ).catch((err) =>
                    console.error("Failed to send notification to user:", err)
                ),
                createAppointmentNotification(
                    professionalUserId,
                    messageText,
                    appointmentId
                ).catch((err) =>
                    console.error("Failed to send notification to professional:", err)
                ),
            ]);
        }

        console.log(
            `Created appointment system message in conversation ${conversation.id}`
        );
    } catch (error) {
        console.error("Failed to create appointment system message:", error);
        // Don't throw - this is a non-critical operation
    }
}
