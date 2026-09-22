// src/lib/services/daily.ts

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_REST_URL = "https://api.daily.co/v1";

interface DailyRoomResponse {
  id: string;
  name: string;
  api_created: boolean;
  privacy: "public" | "private";
  url: string;
  created_at: string;
}

export interface CreateMeetingResult {
  roomUrl: string;
  meetingId: string;
  token: string;
}

/**
 * Create a new short-lived private Daily room and a token for the host
 */
export async function createDailyMeeting(
  externalMeetingId: string,
  hostUserId: string,
  hostDisplayName: string
): Promise<CreateMeetingResult> {
  if (!DAILY_API_KEY) {
    throw new Error("DAILY_API_KEY is not configured");
  }

  console.log("Creating Daily meeting:", {
    externalMeetingId,
    hostUserId,
    hostDisplayName,
  });

  // 1. Create a private room that expires in 2 hours
  const exp = Math.floor(Date.now() / 1000) + 7200;
  
  const roomRes = await fetch(`${DAILY_REST_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        exp,
        privacy: "private",
        enable_chat: true,
      },
    }),
  });

  if (!roomRes.ok) {
    const errorText = await roomRes.text();
    console.error("Failed to create Daily room:", errorText);
    throw new Error("Failed to create Daily room");
  }

  const roomData = (await roomRes.json()) as DailyRoomResponse;
  console.log("Daily room created:", roomData.name);

  // 2. Create a meeting token for the host
  const tokenRes = await fetch(`${DAILY_REST_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomData.name,
        user_name: hostDisplayName,
        user_id: hostUserId,
        is_owner: true,
      },
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("Failed to create Daily token:", errorText);
    throw new Error("Failed to create Daily token for host");
  }

  const tokenData = await tokenRes.json();

  return {
    roomUrl: roomData.url,
    meetingId: roomData.name,
    token: tokenData.token,
  };
}

/**
 * Create a meeting token to add an attendee to an existing meeting
 */
export async function createDailyAttendeeToken(
  roomName: string,
  userId: string,
  displayName: string
): Promise<string> {
  if (!DAILY_API_KEY) {
    throw new Error("DAILY_API_KEY is not configured");
  }

  console.log("Creating token for Daily meeting:", { roomName, userId });

  const tokenRes = await fetch(`${DAILY_REST_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: displayName,
        user_id: userId,
        is_owner: false,
      },
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error("Failed to create Daily token:", errorText);
    throw new Error("Failed to create Daily attendee token");
  }

  const tokenData = await tokenRes.json();
  return tokenData.token;
}

/**
 * End/delete a meeting (Daily rooms can just be deleted)
 */
export async function endDailyMeeting(roomName: string): Promise<void> {
  if (!DAILY_API_KEY) return;

  try {
    console.log("Ending (deleting) Daily meeting:", roomName);

    await fetch(`${DAILY_REST_URL}/rooms/${roomName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    console.log("Daily meeting deleted:", roomName);
  } catch (error) {
    console.error("Error ending Daily meeting:", error);
    // Don't throw, just log
  }
}
