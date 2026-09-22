// src/app/api/appointment/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createAppointmentSystemMessage } from "@/lib/services/appointment-messages";
import { createAppointmentNotification } from "@/lib/notifications";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get appointment
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                professional: {
                    include: {
                        applications: {
                            where: { status: "APPROVED" },
                            select: { userId: true },
                        },
                    },
                },
            },
        });

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }

        const professionalUserId = appointment.professional.applications[0]?.userId;
        const isClient = appointment.userId === session.user.id;
        const isProfessional = professionalUserId === session.user.id;

        if (!isClient && !isProfessional) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Cancellation only allowed before session starts
        if (appointment.startTime < new Date()) {
            return NextResponse.json(
                { error: "Cannot cancel an appointment that has already started or ended." },
                { status: 400 }
            );
        }

        // Already cancelled
        if (appointment.status === "cancelled") {
            return NextResponse.json({ message: "Already cancelled." });
        }

        const otherPartyUserId = isClient ? professionalUserId : appointment.userId;

        // If first request
        if (!appointment.cancelRequestedBy) {
            await prisma.appointment.update({
                where: { id },
                data: {
                    cancelRequestedBy: session.user.id,
                    cancelRequestedAt: new Date(),
                },
            });

            const message = "🚫 Cancellation requested. The other party must confirm to cancel.";
            await createAppointmentSystemMessage(
                appointment.userId!,
                professionalUserId!,
                message,
                id
            );

            if (otherPartyUserId) {
                await createAppointmentNotification(
                    otherPartyUserId,
                    "The other party has requested to cancel the appointment. Please confirm.",
                    id
                );
            }

            return NextResponse.json({
                message: "Cancellation request sent.",
                cancelRequestedBy: session.user.id,
            });
        }

        // If second request (confirmation)
        if (appointment.cancelRequestedBy !== session.user.id) {
            await prisma.appointment.update({
                where: { id },
                data: {
                    status: "cancelled",
                },
            });

            // Release slots in availability (restore them)
            const dateObj = appointment.startTime;
            const dayOfWeekNum = dateObj.getDay();
            const slotTime = `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;

            await prisma.availability.updateMany({
                where: {
                    professionalId: appointment.professionalId,
                    dayOfWeek: dayOfWeekNum,
                },
                data: {
                    slots: {
                        push: slotTime,
                    },
                },
            });

            const message = "❌ Appointment cancelled by mutual agreement. Slots have been released.";
            await createAppointmentSystemMessage(
                appointment.userId!,
                professionalUserId!,
                message,
                id
            );

            if (otherPartyUserId) {
                await createAppointmentNotification(
                    otherPartyUserId,
                    "The appointment has been mutually cancelled.",
                    id
                );
            }

            return NextResponse.json({
                message: "Appointment cancelled.",
                status: "cancelled",
            });
        }

        // If same user requesting again
        return NextResponse.json({ message: "Already requested. Waiting for other party." });

    } catch (error) {
        console.error("Cancel appointment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
