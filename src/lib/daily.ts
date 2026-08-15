import { createServerFn } from "@tanstack/react-start";

// Server-only: DAILY_API_KEY never reaches the client bundle. TanStack Start
// strips this handler's body out of client code automatically and replaces
// calls to it with an RPC to the server.
export const createDailyRoom = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env["DAILY_API_KEY"];
  if (!apiKey) {
    throw new Error("DAILY_API_KEY is not configured on the server.");
  }

  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
        enable_screenshare: true,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create video call room: ${text}`);
  }

  const room = (await response.json()) as { url: string };
  return { url: room.url };
});
