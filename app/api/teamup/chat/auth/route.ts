import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { getPusherServer, isPusherConfigured } from "@/lib/pusher-server";
import { resolveTeamupChatAccess } from "@/lib/teamup-chat-access";
import { getPostIdFromTeamupChannel } from "@/lib/teamup-chat";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    if (!isPusherConfigured) {
      return NextResponse.json({ error: "Gerçek zamanlı servis yapılandırılmamış." }, { status: 503 });
    }

    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json({ error: "Gerçek zamanlı servis hazır değil." }, { status: 503 });
    }

    const contentType = request.headers.get("content-type") || "";
    let socketId = "";
    let channelName = "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      socketId = String(formData.get("socket_id") || "");
      channelName = String(formData.get("channel_name") || "");
    } else {
      const body = await request.json().catch(() => ({}));
      socketId = typeof body?.socket_id === "string" ? body.socket_id : "";
      channelName = typeof body?.channel_name === "string" ? body.channel_name : "";
    }

    socketId = socketId.trim();
    channelName = channelName.trim();

    if (!socketId || !channelName) {
      return NextResponse.json({ error: "Eksik auth parametresi." }, { status: 400 });
    }

    const postId = getPostIdFromTeamupChannel(channelName);
    if (!postId) {
      return NextResponse.json({ error: "Geçersiz kanal." }, { status: 400 });
    }

    const access = await resolveTeamupChatAccess(user.id, postId);
    if (!access.allowed) {
      if (access.reason === "NOT_FOUND") {
        return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
      }
      return NextResponse.json({ error: "Bu kanal için yetkin yok." }, { status: 403 });
    }

    const auth = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(auth);
  } catch (error) {
    console.error("[TEAMUP_CHAT_AUTH_ERROR]", error);
    return NextResponse.json({ error: "Kanal doğrulama başarısız." }, { status: 500 });
  }
}

