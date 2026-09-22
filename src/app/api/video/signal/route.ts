import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, action, ...data } = body;

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "targetUserId and action are required" },
        { status: 400 }
      );
    }

    // Trigger video signal event to the target user's private channel
    await pusherServer.trigger(
      `private-user-${targetUserId}`,
      "videoCallSignal",
      {
        videoSignal: {
          type: action,
          senderId: session.user.id,
          timestamp: new Date().toISOString(),
          ...data,
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video signal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
