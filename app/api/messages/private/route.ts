import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { normalizeFriendPair } from "@/lib/friends";
import { syncUserFromClerk } from "@/lib/user-sync";

const PRIVATE_MESSAGE_MAX_LENGTH = 300;

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const sender = await syncUserFromClerk(clerkUser);
    if (sender.isBanned) {
      return NextResponse.json({ error: "Banli hesap ozel mesaj gonderemez." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const recipientId = typeof body?.recipientId === "string" ? body.recipientId.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!recipientId) {
      return NextResponse.json({ error: "Alici kimligi gerekli." }, { status: 400 });
    }
    if (!content || content.length > PRIVATE_MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Mesaj 1-${PRIVATE_MESSAGE_MAX_LENGTH} karakter olmali.` },
        { status: 400 },
      );
    }
    if (recipientId === sender.id) {
      return NextResponse.json({ error: "Kendine ozel mesaj gonderemezsin." }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, isBanned: true },
    });
    if (!recipient || recipient.isBanned) {
      return NextResponse.json({ error: "Alici bulunamadi." }, { status: 404 });
    }

    const friendPair = normalizeFriendPair(sender.id, recipientId);
    const friendship = await prisma.friendship.findUnique({
      where: { userAId_userBId: friendPair },
      select: { id: true },
    });
    if (!friendship) {
      return NextResponse.json(
        { error: "Ozel mesaj icin once arkadas olmalisiniz." },
        { status: 403 },
      );
    }

    const senderName = sender.username?.trim() || clerkUser.username?.trim() || "Oyuncu";
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: `Ozel Mesaj - ${senderName}`,
        message: content,
        type: "INFO",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PRIVATE_MESSAGE_POST_ERROR]", error);
    return NextResponse.json({ error: "Ozel mesaj gonderilemedi." }, { status: 500 });
  }
}

