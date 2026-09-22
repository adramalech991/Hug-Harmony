import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.formData();
    const socketId = body.get("socket_id") as string;
    const channelName = body.get("channel_name") as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "socket_id and channel_name are required" },
        { status: 400 }
      );
    }

    // Determine authorization based on channel type
    if (channelName.startsWith("presence-conversation-")) {
      const conversationId = channelName.replace("presence-conversation-", "");
      
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId1: true, userId2: true }
      });

      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      if (
        session.user.id !== conversation.userId1 &&
        session.user.id !== conversation.userId2
      ) {
        return NextResponse.json({ error: "Unauthorized for this conversation" }, { status: 403 });
      }

      // Authorize Presence channel
      const presenceData = {
        user_id: session.user.id,
        user_info: {
          name: session.user.name,
        }
      };

      const authResponse = pusherServer.authorizeChannel(
        socketId,
        channelName,
        presenceData
      );
      
      return NextResponse.json(authResponse);
    }

    if (channelName.startsWith("private-user-")) {
      const targetUserId = channelName.replace("private-user-", "");
      
      if (session.user.id !== targetUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const authResponse = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(authResponse);
    }

    // Default catch-all for other channels
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);

  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
