// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export type NotificationType =
  | "message"
  | "appointment"
  | "payment"
  | "profile_visit"
  | "video_call";

export interface NotificationRecord {
  id: string;
  userId: string;
  senderId?: string;
  type: string;
  content: string;
  timestamp: string;
  unread: string;
  unreadBool: boolean;
  relatedId?: string;
}

/**
 * GET - Fetch user's notifications from MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") as NotificationType | null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      whereClause.unread = true;
    }

    if (type) {
      whereClause.type = type;
    }

    const rawNotifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Format for frontend
    const notifications: NotificationRecord[] = rawNotifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      senderId: n.senderId || undefined,
      type: n.type,
      content: n.content,
      timestamp: n.createdAt.toISOString(),
      unread: n.unread ? "true" : "false",
      unreadBool: n.unread,
      relatedId: n.relatedId || undefined,
    }));

    // Calculate unread count
    const totalUnread = await prisma.notification.count({
      where: {
        userId: session.user.id,
        unread: true,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount: totalUnread,
      total: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a notification manually (usually done internal via lib/notifications.ts)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, type, content, relatedId } = body;

    if (!targetUserId || !type || !content) {
      return NextResponse.json(
        { error: "Missing required fields: targetUserId, type, content" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        senderId: session.user.id,
        type,
        content,
        relatedId: relatedId || null,
        unread: true,
      },
    });

    const notificationRecord: NotificationRecord = {
      id: notification.id,
      userId: notification.userId,
      senderId: notification.senderId || undefined,
      type: notification.type,
      content: notification.content,
      timestamp: notification.createdAt.toISOString(),
      unread: "true",
      unreadBool: notification.unread,
      relatedId: notification.relatedId || undefined,
    };
    
    // Trigger pusher event
    await pusherServer.trigger(
      `user-${targetUserId}`,
      "new-notification",
      notificationRecord
    );

    return NextResponse.json({ notification: notificationRecord }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
