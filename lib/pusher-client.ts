"use client";

import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;

export function isPusherClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER);
}

export function getPusherClient(): Pusher | null {
  if (!isPusherClientConfigured()) return null;

  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      channelAuthorization: {
        endpoint: "/api/teamup/chat/auth",
        transport: "ajax",
      },
    });
  }

  return pusherClient;
}
