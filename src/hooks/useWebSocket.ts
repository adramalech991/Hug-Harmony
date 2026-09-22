/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { getPusherClient } from "@/lib/pusher";
import type { Channel, PresenceChannel } from "pusher-js";
import { WSMessage, VideoCallSignal, Notification } from "@/lib/websocket/types";
import type { ChatMessage } from "@/types/chat";

interface UseWebSocketOptions {
  conversationId?: string;
  onMessage?: (data: WSMessage) => void;
  onNewMessage?: (message: ChatMessage) => void;
  onEditMessage?: (messageId: string, updatedText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onTyping?: (userId: string) => void;
  onNotification?: (notification: Notification) => void;
  onVideoCallSignal?: (signal: VideoCallSignal) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onOnlineStatusChange?: (userId: string, isOnline: boolean) => void;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionError: string | null;
  send: (data: object) => void; // Deprecated, kept for compat
  sendTyping: () => void;
  joinConversation: (conversationId: string) => void; // Deprecated
  sendNotification: (
    targetUserId: string,
    type: Notification["type"],
    content: string,
    relatedId?: string
  ) => void; // Unused mostly
  sendHeartbeat: () => void; // Unused
  reconnect: () => void;
  // Video call methods
  sendVideoInvite: (
    targetUserId: string,
    sessionId: string,
    senderName: string,
    appointmentId?: string
  ) => void;
  sendVideoAccept: (
    targetUserId: string,
    sessionId: string,
    senderName: string
  ) => void;
  sendVideoDecline: (
    targetUserId: string,
    sessionId: string,
    senderName: string
  ) => void;
  sendVideoEnd: (targetUserId: string, sessionId: string) => void;
  sendVideoJoin: (
    targetUserId: string,
    sessionId: string,
    senderName: string
  ) => void;
}

export function useWebSocket(
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const { data: session, status } = useSession();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const conversationChannelRef = useRef<PresenceChannel | null>(null);
  const userChannelRef = useRef<Channel | null>(null);
  const lastTypingSentRef = useRef(0);

  const {
    conversationId,
    onMessage,
    onNewMessage,
    onEditMessage,
    onDeleteMessage,
    onTyping,
    onNotification,
    onVideoCallSignal,
    onConnect,
    onDisconnect,
    onError,
    onOnlineStatusChange,
    enabled = true,
  } = options;

  // Initialize Pusher
  useEffect(() => {
    if (status !== "authenticated" || !enabled || !session?.user?.id) return;

    // Use a custom auth endpoint for Pusher
    const pusher = getPusherClient();
    if (!pusher) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pusher.config as any).authEndpoint = "/api/pusher/auth";
    
    // Connect event
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionError(null);
      onConnect?.();
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      onDisconnect?.();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleError = (err: any) => {
      setConnectionError(err?.message || "Pusher error");
      onError?.(err);
    };

    pusher.connection.bind("connected", handleConnected);
    pusher.connection.bind("disconnected", handleDisconnected);
    pusher.connection.bind("error", handleError);

    // Subscribe to user private channel (for notifications and video calls)
    const privateChannelName = `private-user-${session.user.id}`;
    const userChannel = pusher.subscribe(privateChannelName);
    userChannelRef.current = userChannel;

    userChannel.bind("notification", (data: { type: string; notification: Notification }) => {
      onNotification?.(data.notification);
    });

    userChannel.bind("videoCallSignal", (data: { videoSignal: VideoCallSignal }) => {
      onVideoCallSignal?.(data.videoSignal);
    });

    // Subscribe to conversation presence channel if we have a conversationId
    if (conversationId) {
      const convChannelName = `presence-conversation-${conversationId}`;
      const convChannel = pusher.subscribe(convChannelName) as PresenceChannel;
      conversationChannelRef.current = convChannel;

      convChannel.bind("newMessage", (data: { type: string; message: ChatMessage }) => {
        onMessage?.({ type: "newMessage", message: data.message } as WSMessage);
        onNewMessage?.(data.message);
      });

      convChannel.bind("editMessage", (data: { messageId: string; updatedText: string }) => {
        onEditMessage?.(data.messageId, data.updatedText);
      });

      convChannel.bind("deleteMessage", (data: { messageId: string }) => {
        onDeleteMessage?.(data.messageId);
      });

      // Typing indicators via client events
      convChannel.bind("client-typing", (data: { userId: string }) => {
        onTyping?.(data.userId);
      });

      // Presence events
      convChannel.bind("pusher:member_added", (member: any) => {
        onOnlineStatusChange?.(member.id, true);
      });

      convChannel.bind("pusher:member_removed", (member: any) => {
        onOnlineStatusChange?.(member.id, false);
      });
    }

    return () => {
      pusher.connection.unbind("connected", handleConnected);
      pusher.connection.unbind("disconnected", handleDisconnected);
      pusher.connection.unbind("error", handleError);
      
      if (userChannelRef.current) {
        pusher.unsubscribe(privateChannelName);
      }
      if (conversationChannelRef.current && conversationId) {
        pusher.unsubscribe(`presence-conversation-${conversationId}`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, enabled, session?.user?.id, conversationId]);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    
    if (conversationChannelRef.current) {
      try {
        conversationChannelRef.current.trigger("client-typing", {
          userId: session?.user?.id,
        });
        lastTypingSentRef.current = now;
      } catch (err) {
        // Client events may throw if not authorized yet
      }
    }
  }, [session?.user?.id]);

  // Video call signaling over API (which uses Pusher backend)
  const sendVideoSignal = useCallback(async (targetUserId: string, action: string, data: any) => {
    try {
      await fetch("/api/video/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          action,
          ...data
        })
      });
    } catch (e) {
      console.error("Failed to send video signal", e);
    }
  }, []);

  const sendVideoInvite = useCallback((targetUserId: string, sessionId: string, senderName: string, appointmentId?: string) => {
    sendVideoSignal(targetUserId, "video_invite", { sessionId, senderName, appointmentId });
  }, [sendVideoSignal]);

  const sendVideoAccept = useCallback((targetUserId: string, sessionId: string, senderName: string) => {
    sendVideoSignal(targetUserId, "video_accept", { sessionId, senderName });
  }, [sendVideoSignal]);

  const sendVideoDecline = useCallback((targetUserId: string, sessionId: string, senderName: string) => {
    sendVideoSignal(targetUserId, "video_decline", { sessionId, senderName });
  }, [sendVideoSignal]);

  const sendVideoEnd = useCallback((targetUserId: string, sessionId: string) => {
    sendVideoSignal(targetUserId, "video_end", { sessionId });
  }, [sendVideoSignal]);

  const sendVideoJoin = useCallback((targetUserId: string, sessionId: string, senderName: string) => {
    sendVideoSignal(targetUserId, "video_join", { sessionId, senderName });
  }, [sendVideoSignal]);

  // Deprecated/Unused legacy methods
  const send = useCallback((_data: object) => {}, []);
  const joinConversation = useCallback((_convId: string) => {}, []);
  const sendNotification = useCallback(() => {}, []);
  const sendHeartbeat = useCallback(() => {}, []);
  const reconnect = useCallback(() => {}, []);

  return {
    isConnected,
    connectionError,
    send,
    sendTyping,
    joinConversation,
    sendNotification,
    sendHeartbeat,
    reconnect,
    sendVideoInvite,
    sendVideoAccept,
    sendVideoDecline,
    sendVideoEnd,
    sendVideoJoin,
  };
}
