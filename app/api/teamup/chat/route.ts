import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { getPusherServer, isPusherConfigured } from "@/lib/pusher-server";
import { resolveTeamupChatAccess } from "@/lib/teamup-chat-access";
import {
  getTeamupChatChannelName,
  TEAMUP_CHAT_EVENT,
  TEAMUP_CHAT_HISTORY_LIMIT,
  TEAMUP_CHAT_MAX_MESSAGE_LENGTH,
  TEAMUP_CHAT_RATE_LIMIT_MAX,
  TEAMUP_CHAT_RATE_LIMIT_WINDOW_MS,
} from "@/lib/teamup-chat";

export const runtime = "nodejs";

function toPublicMessage(message: {
  id: string;
  teamPostId: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string | null;
    imageUrl: string | null;
    mainRole: string;
    selectedFrame: string;
  };
}) {
  return {
    id: message.id,
    teamPostId: message.teamPostId,
    content: message.content,
    createdAt: message.createdAt,
    sender: {
      id: message.sender.id,
      username: message.sender.username,
      imageUrl: message.sender.imageUrl,
      mainRole: message.sender.mainRole,
      selectedFrame: message.sender.selectedFrame,
    },
  };
}

function mapAccessError(reason: "NOT_FOUND" | "BANNED" | "NOT_ALLOWED") {
  if (reason === "NOT_FOUND") {
    return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
  }
  if (reason === "BANNED") {
    return NextResponse.json({ error: "Banlı hesap sohbeti kullanamaz." }, { status: 403 });
  }
  return NextResponse.json({ error: "Bu sohbet için yetkin yok." }, { status: 403 });
}

async function pruneTeamupChatMessages(postId: string) {
  const keepMessages = await prisma.teamChatMessage.findMany({
    where: { teamPostId: postId },
    orderBy: { createdAt: "desc" },
    take: TEAMUP_CHAT_HISTORY_LIMIT,
    select: { id: true },
  });

  const keepIds = keepMessages.map((message) => message.id);
  if (keepIds.length === 0) return;

  await prisma.teamChatMessage.deleteMany({
    where: {
      teamPostId: postId,
      id: { notIn: keepIds },
    },
  });
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = (searchParams.get("postId") || "").trim();
    if (!postId) {
      return NextResponse.json({ error: "İlan ID gerekli." }, { status: 400 });
    }

    const access = await resolveTeamupChatAccess(user.id, postId);
    if (!access.allowed) {
      return mapAccessError(access.reason);
    }

    const [rawMessages, viewerProfile] = await Promise.all([
      prisma.teamChatMessage.findMany({
        where: { teamPostId: postId },
        orderBy: { createdAt: "desc" },
        take: TEAMUP_CHAT_HISTORY_LIMIT,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              imageUrl: true,
              mainRole: true,
              selectedFrame: true,
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { selectedFrame: true },
      }),
    ]);

    return NextResponse.json({
      realtimeEnabled: isPusherConfigured,
      currentUserFrame: viewerProfile?.selectedFrame || "BASIC",
      messages: rawMessages.reverse().map(toPublicMessage),
    });
  } catch (error) {
    console.error("[TEAMUP_CHAT_GET_ERROR]", error);
    return NextResponse.json({ error: "Sohbet mesajları yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!postId) {
      return NextResponse.json({ error: "İlan ID gerekli." }, { status: 400 });
    }
    if (!content || content.length > TEAMUP_CHAT_MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Mesaj 1-${TEAMUP_CHAT_MAX_MESSAGE_LENGTH} karakter olmalı.` },
        { status: 400 },
      );
    }

    const access = await resolveTeamupChatAccess(user.id, postId);
    if (!access.allowed) {
      return mapAccessError(access.reason);
    }

    const recentMessageCount = await prisma.teamChatMessage.count({
      where: {
        teamPostId: postId,
        senderId: user.id,
        createdAt: {
          gte: new Date(Date.now() - TEAMUP_CHAT_RATE_LIMIT_WINDOW_MS),
        },
      },
    });

    if (recentMessageCount >= TEAMUP_CHAT_RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Çok hızlı mesaj gönderiyorsun. Biraz bekleyip tekrar dene." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.floor(TEAMUP_CHAT_RATE_LIMIT_WINDOW_MS / 1000)) },
        },
      );
    }

    const created = await prisma.teamChatMessage.create({
      data: {
        teamPostId: postId,
        senderId: user.id,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            mainRole: true,
            selectedFrame: true,
          },
        },
      },
    });

    const message = toPublicMessage(created);
    const channel = getTeamupChatChannelName(postId);

    const pusher = getPusherServer();
    const realtimeAttempted = Boolean(pusher);
    if (pusher) {
      void pusher.trigger(channel, TEAMUP_CHAT_EVENT, message).catch((pushError) => {
        console.error("[TEAMUP_CHAT_PUSH_ERROR]", pushError);
      });
    }
    void pruneTeamupChatMessages(postId).catch((pruneError) => {
      console.error("[TEAMUP_CHAT_PRUNE_ERROR]", pruneError);
    });

    return NextResponse.json({ success: true, realtimeAttempted, message });
  } catch (error) {
    console.error("[TEAMUP_CHAT_POST_ERROR]", error);
    return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 });
  }
}

