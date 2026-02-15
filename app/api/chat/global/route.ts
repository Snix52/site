import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { getPusherServer, isPusherConfigured } from "@/lib/pusher-server";
import { syncUserFromClerk } from "@/lib/user-sync";
import {
  GLOBAL_CHAT_CHANNEL,
  GLOBAL_CHAT_EVENT,
  GLOBAL_CHAT_HISTORY_LIMIT,
  GLOBAL_CHAT_MAX_MESSAGE_LENGTH,
  GLOBAL_CHAT_RATE_LIMIT_MAX,
  GLOBAL_CHAT_RATE_LIMIT_WINDOW_MS,
} from "@/lib/global-chat";

export const runtime = "nodejs";

function toPublicMessage(message: {
  id: string;
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

function parseLimit(raw: string | null): number {
  const numeric = Number(raw ?? "");
  if (!Number.isFinite(numeric)) return GLOBAL_CHAT_HISTORY_LIMIT;
  return Math.min(GLOBAL_CHAT_HISTORY_LIMIT, Math.max(20, Math.floor(numeric)));
}

async function pruneGlobalChatMessages() {
  const keepMessages = await prisma.globalChatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: GLOBAL_CHAT_HISTORY_LIMIT,
    select: { id: true },
  });

  const keepIds = keepMessages.map((message) => message.id);
  if (keepIds.length === 0) return;

  await prisma.globalChatMessage.deleteMany({
    where: {
      id: { notIn: keepIds },
    },
  });
}

export async function GET(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const dbUser = await syncUserFromClerk(clerkUser);
    if (dbUser.isBanned) {
      return NextResponse.json({ error: "Banlı hesap genel sohbeti kullanamaz." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const take = parseLimit(searchParams.get("take"));

    const rawMessages = await prisma.globalChatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take,
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

    return NextResponse.json({
      realtimeEnabled: isPusherConfigured,
      currentUserFrame: dbUser.selectedFrame || "BASIC",
      messages: rawMessages.reverse().map(toPublicMessage),
    });
  } catch (error) {
    console.error("[GLOBAL_CHAT_GET_ERROR]", error);
    return NextResponse.json({ error: "Genel sohbet yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const dbUser = await syncUserFromClerk(clerkUser);
    if (dbUser.isBanned) {
      return NextResponse.json({ error: "Banlı hesap genel sohbete mesaj atamaz." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!content || content.length > GLOBAL_CHAT_MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Mesaj 1-${GLOBAL_CHAT_MAX_MESSAGE_LENGTH} karakter olmalı.` },
        { status: 400 },
      );
    }

    const recentMessageCount = await prisma.globalChatMessage.count({
      where: {
        senderId: clerkUser.id,
        createdAt: { gte: new Date(Date.now() - GLOBAL_CHAT_RATE_LIMIT_WINDOW_MS) },
      },
    });

    if (recentMessageCount >= GLOBAL_CHAT_RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Çok hızlı mesaj atıyorsun. Biraz bekleyip tekrar dene." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.floor(GLOBAL_CHAT_RATE_LIMIT_WINDOW_MS / 1000)) },
        },
      );
    }

    const created = await prisma.globalChatMessage.create({
      data: {
        senderId: clerkUser.id,
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
    const pusher = getPusherServer();
    const realtimeAttempted = Boolean(pusher);
    if (pusher) {
      void pusher.trigger(GLOBAL_CHAT_CHANNEL, GLOBAL_CHAT_EVENT, message).catch((pushError) => {
        console.error("[GLOBAL_CHAT_PUSH_ERROR]", pushError);
      });
    }
    void pruneGlobalChatMessages().catch((pruneError) => {
      console.error("[GLOBAL_CHAT_PRUNE_ERROR]", pruneError);
    });

    return NextResponse.json({ success: true, realtimeAttempted, message });
  } catch (error) {
    console.error("[GLOBAL_CHAT_POST_ERROR]", error);
    return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 });
  }
}

