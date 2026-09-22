// File: src/app/api/appointment/[id]/dispute/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { createAppointmentSystemMessage } from "@/lib/services/appointment-messages";

const disputeSchema = z.object({
  reason: z.string().min(1, "Dispute reason is required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = disputeSchema.parse(body);

    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        professionalId: true,
        startTime: true,
        endTime: true,
        status: true,
        disputeStatus: true,
      },
    });

    if (!appt) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (appt.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (appt.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot dispute a cancelled appointment" },
        { status: 400 }
      );
    }

    if (appt.disputeStatus !== "none") {
      return NextResponse.json(
        { error: "Appointment already disputed" },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: "disputed",
        disputeReason: reason,
        disputeStatus: "disputed",
      },
    });

    // Get professional user ID for system message
    const professional = await prisma.professional.findUnique({
      where: { id: appt.professionalId },
      include: {
        applications: {
          where: { status: "APPROVED" },
          select: { userId: true },
          take: 1,
        },
      },
    });

    const professionalUserId = professional?.applications[0]?.userId;

    // Create system message in conversation if we have both user IDs
    if (appt.userId && professionalUserId) {
      const messageText = `⚠️ Appointment disputed. Reason: ${reason}. An admin will review this.`;

      createAppointmentSystemMessage(
        appt.userId,
        professionalUserId,
        messageText,
        id
      ).catch((err) =>
        console.error("Failed to create dispute system message:", err)
      );
    }

    return NextResponse.json({
      message: "Dispute submitted",
      appointment: updated,
    });
  } catch (error) {
    console.error("Dispute error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
