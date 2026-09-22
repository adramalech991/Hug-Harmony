"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

export interface VideoCallState {
  isConnecting: boolean;
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localVideoTileId: string | null;
  remoteVideoTileId: string | null;
  error: string | null;
}

export interface UseVideoCallOptions {
  sessionId: string;
  onParticipantJoined?: (attendeeId: string) => void;
  onParticipantLeft?: (attendeeId: string) => void;
  onSessionEnded?: () => void;
  onError?: (error: string) => void;
}

export interface UseVideoCallReturn extends VideoCallState {
  join: () => Promise<void>;
  leave: () => Promise<void>;
  endSession: () => Promise<void>;
  toggleVideo: () => void;
  toggleAudio: () => void;
  bindVideoElement: (tileId: string, element: HTMLVideoElement) => void;
  unbindVideoElement: (tileId: string) => void;
}

export function useVideoCall(options: UseVideoCallOptions): UseVideoCallReturn {
  const {
    sessionId,
    onParticipantJoined,
    onParticipantLeft,
    onSessionEnded,
    onError,
  } = options;
  
  const { data: session } = useSession();

  const [state, setState] = useState<VideoCallState>({
    isConnecting: false,
    isConnected: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    localVideoTileId: null,
    remoteVideoTileId: null,
    error: null,
  });

  const callObjectRef = useRef<DailyCall | null>(null);

  // Video track mapping for easy binding
  const trackMapRef = useRef<{ [key: string]: MediaStreamTrack }>({});

  const leave = useCallback(async () => {
    try {
      if (callObjectRef.current) {
        await callObjectRef.current.leave();
        await callObjectRef.current.destroy();
        callObjectRef.current = null;
      }

      await fetch(`/api/video/leave/${sessionId}`, { method: "POST" });

      setState({
        isConnecting: false,
        isConnected: false,
        isVideoEnabled: true,
        isAudioEnabled: true,
        localVideoTileId: null,
        remoteVideoTileId: null,
        error: null,
      });
      
      trackMapRef.current = {};
    } catch (error) {
      console.error("Failed to leave video call:", error);
    }
  }, [sessionId]);

  const join = useCallback(async () => {
    if (!session?.user?.id) {
      setState((s) => ({ ...s, error: "Not authenticated" }));
      return;
    }

    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      const response = await fetch(`/api/video/join/${sessionId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join session");
      }

      const { meeting, attendee } = await response.json();
      const roomUrl = meeting.MediaPlacement.roomUrl;
      const token = attendee.JoinToken;

      const callObject = DailyIframe.createCallObject();
      callObjectRef.current = callObject;

      // Event listeners
      callObject.on("joined-meeting", (e) => {
        console.log("Joined meeting", e);
        setState((s) => ({
          ...s,
          isConnected: true,
          isConnecting: false,
          localVideoTileId: "local",
        }));
        
        // Grab local tracks
        if (e && e.participants && e.participants.local) {
            const localParticipant = e.participants.local;
            if (localParticipant.tracks.video.persistentTrack) {
                trackMapRef.current["local"] = localParticipant.tracks.video.persistentTrack;
            }
        }
      });

      callObject.on("participant-joined", (e) => {
        console.log("Participant joined", e);
        if (e && e.participant) {
            setState((s) => ({ ...s, remoteVideoTileId: e.participant.session_id }));
            onParticipantJoined?.(e.participant.user_id);
        }
      });

      callObject.on("participant-left", (e) => {
        console.log("Participant left", e);
        if (e && e.participant) {
            setState((s) => ({
                ...s,
                remoteVideoTileId: s.remoteVideoTileId === e.participant.session_id ? null : s.remoteVideoTileId
            }));
            onParticipantLeft?.(e.participant.user_id);
            delete trackMapRef.current[e.participant.session_id];
        }
      });
      
      callObject.on("track-started", (e) => {
          if (e && e.participant && e.track && e.track.kind === "video") {
              const id = e.participant.local ? "local" : e.participant.session_id;
              trackMapRef.current[id] = e.track;
              
              // Trigger a re-render to bind the new track
              setState(s => ({...s}));
          }
      });

      callObject.on("error", (e) => {
        console.error("Daily.co error:", e);
        setState((s) => ({ ...s, error: e?.errorMsg || "Video error" }));
        onError?.(e?.errorMsg || "Video error");
      });

      callObject.on("left-meeting", () => {
        onSessionEnded?.();
      });

      // Join the room
      await callObject.join({ url: roomUrl, token });
    } catch (error: unknown) {
      console.error("Failed to join video call:", error);
      const errorMessage = (error as Error).message || "Failed to join video call";
      setState((s) => ({ ...s, isConnecting: false, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [sessionId, session?.user?.id, onParticipantJoined, onParticipantLeft, onSessionEnded, onError]);

  const endSession = useCallback(async () => {
    try {
      await leave();
      await fetch(`/api/video/end/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "completed" }),
      });
      onSessionEnded?.();
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  }, [sessionId, leave, onSessionEnded]);

  const toggleVideo = useCallback(() => {
    if (!callObjectRef.current) return;
    const currentVideo = callObjectRef.current.localVideo();
    callObjectRef.current.setLocalVideo(!currentVideo);
    setState((s) => ({ ...s, isVideoEnabled: !currentVideo }));
  }, []);

  const toggleAudio = useCallback(() => {
    if (!callObjectRef.current) return;
    const currentAudio = callObjectRef.current.localAudio();
    callObjectRef.current.setLocalAudio(!currentAudio);
    setState((s) => ({ ...s, isAudioEnabled: !currentAudio }));
  }, []);

  const bindVideoElement = useCallback((tileId: string, element: HTMLVideoElement) => {
    const track = trackMapRef.current[tileId];
    if (track && element) {
      const stream = new MediaStream([track]);
      element.srcObject = stream;
      element.play().catch(e => console.error("Error playing video:", e));
    }
  }, []);

  const unbindVideoElement = useCallback((tileId: string) => {
      // With native MediaStreams, just leave it be or null it out if needed on unmount
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callObjectRef.current) {
        callObjectRef.current.leave().then(() => {
            callObjectRef.current?.destroy();
        }).catch(() => {});
      }
    };
  }, []);

  return {
    ...state,
    join,
    leave,
    endSession,
    toggleVideo,
    toggleAudio,
    bindVideoElement,
    unbindVideoElement,
  };
}
