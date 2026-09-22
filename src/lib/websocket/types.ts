/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ChatMessage } from "@/types/chat";

export interface Notification {
  id: string;
  userId: string;
  senderId?: string | null;
  type: string;
  content: string;
  timestamp: string;
  unread: string;
  unreadBool: boolean;
  relatedId?: string | null;
}

export interface VideoCallSignal {
  type: string;
  senderId: string;
  senderName: string;
  sessionId: string;
  appointmentId?: string;
  sdp?: any;
  candidate?: any;
}

export type WSMessage = 
  | { type: "newMessage"; message: ChatMessage }
  | { type: "videoCallSignal"; videoSignal: VideoCallSignal }
  | { type: "notification"; notification: Notification }
  | { type: "typing"; userId: string };
