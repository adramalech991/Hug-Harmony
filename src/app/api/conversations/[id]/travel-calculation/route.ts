// src/app/api/conversations/[id]/travel-calculation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: conversationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { fromAddress, toAddress, distanceMiles, durationMinutes, fee, ratePerMile } = body;

        if (!fromAddress || !toAddress || distanceMiles === undefined || fee === undefined || ratePerMile === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify conversation exists and user is a participant
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conversation = await (prisma as any).conversation.findUnique({
            where: { id: conversationId },
            include: {
                user1: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
                user2: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
            },
        });

        if (!conversation) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        const isParticipant = conversation.userId1 === session.user.id || conversation.userId2 === session.user.id;
        if (!isParticipant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if user is a professional
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const professionalApp = await (prisma as any).professionalApplication.findFirst({
            where: { userId: session.user.id, status: "APPROVED" },
            select: { professionalId: true },
        });

        if (!professionalApp) {
            return NextResponse.json({ error: "Only professionals can submit travel calculations" }, { status: 403 });
        }

        const recipientId = conversation.userId1 === session.user.id ? conversation.userId2 : conversation.userId1;

        // Create travel calculation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const travelCalculation = await (prisma as any).travelCalculation.create({
            data: {
                fromAddress,
                toAddress,
                distanceMiles: parseFloat(distanceMiles),
                durationMinutes: durationMinutes ? parseFloat(durationMinutes) : null,
                fee: parseFloat(fee),
                ratePerMile: parseFloat(ratePerMile),
            },
        });

        // Create system message to record the calculation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = await (prisma as any).message.create({
            data: {
                conversationId,
                senderId: session.user.id,
                recipientId,
                text: `🚗 Travel Expense Calculated: ${distanceMiles} miles @ $${ratePerMile}/mile = $${fee}`,
                isSystem: false, // It's a professional message but with a specialized card
                travelCalculationId: travelCalculation.id,
            },
            include: {
                senderUser: {
                    select: {
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        professionalApplication: { select: { professionalId: true } },
                    },
                },
            },
        });

        const senderName = `${message.senderUser?.firstName ?? ""} ${message.senderUser?.lastName ?? ""}`.trim() || "Professional";

        // Broadcast via WebSocket
        const formattedMessage = {
            id: message.id,
            text: message.text,
            createdAt: message.createdAt.toISOString(),
            senderId: message.senderId,
            recipientId: message.recipientId,
            isAudio: false,
            isSystem: false,
            travelCalculationId: travelCalculation.id,
            travelCalculation: {
                ...travelCalculation,
                createdAt: travelCalculation.createdAt.toISOString(),
            },
            sender: {
                name: senderName,
                profileImage: message.senderUser?.profileImage ?? null,
                isProfessional: true,
                professionalId: professionalApp.professionalId,
            },
        };

        pusherServer.trigger(
            `presence-conversation-${conversationId}`,
            "newMessage",
            {
                type: "newMessage",
                conversationId,
                message: formattedMessage,
            }
        ).catch((err) => console.error("Pusher broadcast error:", err));

        return NextResponse.json({ success: true, message: formattedMessage }, { status: 201 });
    } catch (error) {
        console.error("Error creating travel calculation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
