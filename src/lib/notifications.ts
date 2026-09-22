import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import {
  sendPushToUser,
  isPushConfigured,
  getPushTitle,
  getNotificationUrl,
} from "@/lib/push";

export type NotificationType =
  | "message"
  | "appointment"
  | "payment"
  | "profile_visit"
  | "video_call";

export interface NotificationData {
  targetUserId: string;
  type: NotificationType;
  content: string;
  senderId?: string;
  relatedId?: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  senderId?: string;
  type: NotificationType;
  content: string;
  timestamp: string;
  unread: string;
  unreadBool: boolean;
  relatedId?: string;
}

/**
 * Create a notification directly in MongoDB and trigger Pusher/Web-Push
 * This replaces the old AWS SNS/SQS system
 */
export async function createNotification(
  data: NotificationData
): Promise<NotificationRecord | null> {
  const { targetUserId, type, content, senderId, relatedId } = data;

  console.log("Creating notification directly in Prisma:", { targetUserId, type });

  try {
    // 1. Save to MongoDB
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        senderId: senderId || null,
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
      type: notification.type as NotificationType,
      content: notification.content,
      timestamp: notification.createdAt.toISOString(),
      unread: "true",
      unreadBool: notification.unread,
      relatedId: notification.relatedId || undefined,
    };

    // 2. Send real-time notification via Pusher
    try {
      await pusherServer.trigger(
        `user-${targetUserId}`,
        "new-notification",
        notificationRecord
      );
    } catch (pusherErr) {
      console.error("[Notifications] Pusher error:", pusherErr);
    }

    // 3. Send push notification
    if (isPushConfigured()) {
      sendPushToUser(targetUserId, {
        title: getPushTitle(type),
        body: content,
        tag: type,
        url: getNotificationUrl(type, relatedId),
        data: { type, relatedId, senderId },
      }).catch((err) => {
        console.error("Push notification error:", err);
      });
    }

    return notificationRecord;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// Ensure backwards compatibility with old function name
export const createNotificationDirect = createNotification;

/**
 * Check if a similar notification was sent recently (for rate limiting)
 */
export async function hasRecentNotification(
  userId: string,
  type: NotificationType,
  relatedId: string,
  withinMinutes: number = 60
): Promise<boolean> {
  const timeAgo = new Date(Date.now() - withinMinutes * 60 * 1000);

  const count = await prisma.notification.count({
    where: {
      userId,
      type,
      relatedId,
      createdAt: {
        gte: timeAgo,
      },
    },
  });

  return count > 0;
}

// ==========================================
// Helper Functions
// ==========================================

export async function createProfileVisitNotification(
  visitorId: string,
  visitorName: string,
  visitedUserId: string
): Promise<NotificationRecord | null> {
  if (visitorId === visitedUserId) {
    return null;
  }

  const hasRecent = await hasRecentNotification(
    visitedUserId,
    "profile_visit",
    visitorId,
    60
  );

  if (hasRecent) {
    console.log("Profile visit notification rate limited");
    return null;
  }

  return createNotification({
    targetUserId: visitedUserId,
    type: "profile_visit",
    content: `${visitorName} viewed your profile`,
    senderId: visitorId,
    relatedId: visitorId,
  });
}

export async function createMessageNotification(
  senderId: string,
  senderName: string,
  recipientId: string,
  conversationId: string,
  messagePreview?: string
): Promise<NotificationRecord | null> {
  const preview = messagePreview
    ? messagePreview.length > 50
      ? messagePreview.substring(0, 50) + "..."
      : messagePreview
    : "sent you a message";

  return createNotification({
    targetUserId: recipientId,
    type: "message",
    content: `${senderName}: ${preview}`,
    senderId,
    relatedId: conversationId,
  });
}

export async function createAppointmentNotification(
  targetUserId: string,
  content: string,
  appointmentId: string,
  senderId?: string
): Promise<NotificationRecord | null> {
  return createNotification({
    targetUserId,
    type: "appointment",
    content,
    senderId,
    relatedId: appointmentId,
  });
}

export async function createPaymentNotification(
  targetUserId: string,
  content: string,
  paymentId: string,
  senderId?: string
): Promise<NotificationRecord | null> {
  return createNotification({
    targetUserId,
    type: "payment",
    content,
    senderId,
    relatedId: paymentId,
  });
}

export async function createVideoCallNotification(
  targetUserId: string,
  callerName: string,
  sessionId: string,
  senderId: string
): Promise<NotificationRecord | null> {
  return createNotification({
    targetUserId,
    type: "video_call",
    content: `${callerName} is calling you`,
    senderId,
    relatedId: sessionId,
  });
}

export async function createEarningConfirmedNotification(
  professionalUserId: string,
  amount: number,
  clientName: string,
  earningId: string
): Promise<NotificationRecord | null> {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

  return createNotification({
    targetUserId: professionalUserId,
    type: "payment",
    content: `Earning of ${formattedAmount} confirmed for session with ${clientName}`,
    relatedId: earningId,
  });
}

export async function createPayoutProcessedNotification(
  professionalUserId: string,
  amount: number,
  payoutId: string
): Promise<NotificationRecord | null> {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

  return createNotification({
    targetUserId: professionalUserId,
    type: "payment",
    content: `Your payout of ${formattedAmount} has been processed!`,
    relatedId: payoutId,
  });
}

export async function createConfirmationRequestNotification(
  targetUserId: string,
  otherPartyName: string,
  appointmentId: string,
  isReminder: boolean = false
): Promise<NotificationRecord | null> {
  const content = isReminder
    ? `Reminder: Please confirm your session with ${otherPartyName}`
    : `Please confirm if your session with ${otherPartyName} occurred`;

  return createNotification({
    targetUserId,
    type: "appointment",
    content,
    relatedId: appointmentId,
  });
}

export async function createDisputeNotificationForAdmin(
  adminUserId: string,
  clientName: string,
  professionalName: string,
  confirmationId: string
): Promise<NotificationRecord | null> {
  return createNotification({
    targetUserId: adminUserId,
    type: "payment",
    content: `Payment dispute between ${clientName} and ${professionalName} requires review`,
    relatedId: confirmationId,
  });
}
