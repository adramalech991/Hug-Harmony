// src/app/api/video/join/[sessionId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createDailyAttendeeToken } from "@/lib/services/daily";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get video session
    const videoSession = await prisma.videoSession.findUnique({
      where: { id: sessionId },
      include: {
        attendees: true,
        professional: {
          select: {
            id: true,
            name: true,
            applications: {
              where: { status: "APPROVED" },
              select: { userId: true },
              take: 1,
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!videoSession) {
      return NextResponse.json(
        { error: "Video session not found" },
        { status: 404 }
      );
    }

    // Check if session is joinable
    if (
      ["COMPLETED", "CANCELLED", "FAILED", "NO_SHOW"].includes(
        videoSession.status
      )
    ) {
      return NextResponse.json(
        { error: "Video session is no longer active" },
        { status: 400 }
      );
    }

    // Verify user is authorized to join
    const professionalUserId =
      videoSession.professional?.applications?.[0]?.userId;
    const isClient = session.user.id === videoSession.userId;
    const isProfessional = session.user.id === professionalUserId;

    if (!isClient && !isProfessional) {
      return NextResponse.json(
        { error: "Not authorized to join this session" },
        { status: 403 }
      );
    }

    // Check if user already has an attendee record with valid token
    let attendee = videoSession.attendees.find(
      (a) => a.externalUserId === session.user.id
    );

    // Get user display name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, firstName: true, lastName: true },
    });

    const displayName =
      user?.name ||
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      "Participant";

    // Daily mediaPlacement hack check
    const mediaPlacement = videoSession.mediaPlacement as { roomUrl: string, token: string } | null;
    if (!mediaPlacement || !mediaPlacement.roomUrl) {
       return NextResponse.json(
        { error: "Invalid meeting data" },
        { status: 410 }
      );
    }

    if (!attendee) {
      try {
        const token = await createDailyAttendeeToken(
          videoSession.meetingId,
          session.user.id,
          displayName
        );

        // Save attendee record
        attendee = await prisma.videoAttendee.create({
          data: {
            videoSessionId: sessionId,
            attendeeId: session.user.id,
            externalUserId: session.user.id,
            joinToken: token,
            role: isProfessional ? "host" : "participant",
            displayName,
          },
        });
      } catch (error) {
        console.error("Failed to create Daily attendee:", error);
        return NextResponse.json(
          { error: "Failed to join meeting. It may have expired." },
          { status: 410 }
        );
      }
    }

    // Update attendee join time
    await prisma.videoAttendee.update({
      where: { id: attendee.id },
      data: { joinedAt: new Date() },
    });

    // Update session status
    const activeAttendees = videoSession.attendees.filter(
      (a) => a.joinedAt && !a.leftAt
    );

    const newStatus = activeAttendees.length === 0 ? "WAITING" : "IN_PROGRESS";

    await prisma.videoSession.update({
      where: { id: sessionId },
      data: {
        status: newStatus,
        actualStart: videoSession.actualStart || new Date(),
      },
    });

    return NextResponse.json({
      meeting: {
        MeetingId: videoSession.meetingId,
        MediaPlacement: mediaPlacement,
      },
      attendee: {
        AttendeeId: attendee.attendeeId,
        ExternalUserId: attendee.externalUserId,
        JoinToken: attendee.joinToken,
      },
    });
  } catch (error) {
    console.error("Join video session error:", error);
    return NextResponse.json(
      { error: "Failed to join video session" },
      { status: 500 }
    );
  }
}
