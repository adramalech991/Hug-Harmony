import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Ensure environment variables are loaded for the server-side client
const appId = process.env.PUSHER_APP_ID!;
const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
const secret = process.env.PUSHER_SECRET!;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;

// Server-side Pusher client (for sending events)
export const pusherServer = new PusherServer({
  appId: appId || "app-id",
  key: key || "key",
  secret: secret || "secret",
  cluster: cluster || "us2",
  useTLS: true,
});

// Client-side Pusher client (for receiving events - mostly used in React components)
export const getPusherClient = () => {
  if (typeof window !== "undefined") {
    // Only initialize the client once in the browser
    if (!window.pusherClient) {
      window.pusherClient = new PusherClient(key, {
        cluster,
      });
    }
    return window.pusherClient;
  }
  return null;
};

declare global {
  interface Window {
    pusherClient?: PusherClient;
  }
}
