import { createServerFn } from "@tanstack/react-start";
import { AccessToken } from "livekit-server-sdk";

// Server-only: LIVEKIT_API_KEY/SECRET never reach the client bundle. TanStack
// Start strips this handler's body out of client code automatically and
// replaces calls to it with an RPC to the server.
export const createLiveKitToken = createServerFn({ method: "POST" })
  .validator((data: { roomName: string; identity: string; name: string }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env["LIVEKIT_API_KEY"];
    const apiSecret = process.env["LIVEKIT_API_SECRET"];
    if (!apiKey || !apiSecret) {
      throw new Error("LiveKit is not configured on the server.");
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: data.identity,
      name: data.name,
    });
    token.addGrant({
      room: data.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    return { token: await token.toJwt() };
  });
