import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { normalizeFriendPair } from "@/lib/friends";
import { syncUserFromClerk } from "@/lib/user-sync";

const FRIEND_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const FRIEND_REQUEST_MAX = 20;

function friendProfileSelect() {
  return {
    id: true,
    username: true,
    imageUrl: true,
    mainRole: true,
  } as const;
}

export async function GET(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const dbUser = await syncUserFromClerk(clerkUser);
    if (dbUser.isBanned) {
      return NextResponse.json({ error: "Banlı hesap arkadaş sistemi kullanamaz." }, { status: 403 });
    }

    const userId = clerkUser.id;
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();

    const [incomingRequests, outgoingRequests, friendships] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { recipientId: userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: friendProfileSelect() },
        },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: userId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
          recipient: { select: friendProfileSelect() },
        },
      }),
      prisma.friendship.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        orderBy: { createdAt: "desc" },
        include: {
          userA: { select: friendProfileSelect() },
          userB: { select: friendProfileSelect() },
        },
      }),
    ]);

    const friends = friendships.map((friendship) => {
      const friend = friendship.userAId === userId ? friendship.userB : friendship.userA;
      return {
        id: friendship.id,
        createdAt: friendship.createdAt,
        user: friend,
      };
    });

    let searchResults: Array<{
      id: string;
      username: string | null;
      imageUrl: string | null;
      mainRole: string;
      relationship: "NONE" | "FRIEND" | "INCOMING_PENDING" | "OUTGOING_PENDING";
    }> = [];

    if (search.length >= 2) {
      const [foundUsers] = await Promise.all([
        prisma.user.findMany({
          where: {
            id: { not: userId },
            isBanned: false,
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
          select: friendProfileSelect(),
          take: 10,
        }),
      ]);

      const friendIds = new Set(friends.map((f) => f.user.id));
      const incomingIds = new Set(incomingRequests.map((r) => r.sender.id));
      const outgoingIds = new Set(outgoingRequests.map((r) => r.recipient.id));

      searchResults = foundUsers.map((u) => {
        let relationship: "NONE" | "FRIEND" | "INCOMING_PENDING" | "OUTGOING_PENDING" = "NONE";

        if (friendIds.has(u.id)) {
          relationship = "FRIEND";
        } else if (incomingIds.has(u.id)) {
          relationship = "INCOMING_PENDING";
        } else if (outgoingIds.has(u.id)) {
          relationship = "OUTGOING_PENDING";
        }

        return {
          id: u.id,
          username: u.username,
          imageUrl: u.imageUrl,
          mainRole: u.mainRole,
          relationship,
        };
      });
    }

    return NextResponse.json({
      friends,
      incomingRequests: incomingRequests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        sender: request.sender,
      })),
      outgoingRequests: outgoingRequests.map((request) => ({
        id: request.id,
        createdAt: request.createdAt,
        recipient: request.recipient,
      })),
      searchResults,
    });
  } catch (error) {
    console.error("[FRIENDS_GET_ERROR]", error);
    return NextResponse.json({ error: "Arkadaş verileri yüklenemedi." }, { status: 500 });
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
      return NextResponse.json({ error: "Banlı hesap arkadaş isteği gönderemez." }, { status: 403 });
    }

    const senderId = clerkUser.id;
    const body = await request.json().catch(() => ({}));
    const targetUserIdRaw = typeof body?.targetUserId === "string" ? body.targetUserId.trim() : "";
    const targetUsernameRaw = typeof body?.targetUsername === "string" ? body.targetUsername.trim() : "";

    const recentRequestCount = await prisma.friendRequest.count({
      where: {
        senderId,
        createdAt: { gte: new Date(Date.now() - FRIEND_REQUEST_WINDOW_MS) },
      },
    });
    if (recentRequestCount >= FRIEND_REQUEST_MAX) {
      return NextResponse.json(
        { error: "Çok hızlı arkadaş isteği gönderiyorsun. Biraz bekleyip tekrar dene." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.floor(FRIEND_REQUEST_WINDOW_MS / 1000)) },
        },
      );
    }

    let targetUser = null as null | {
      id: string;
      isBanned: boolean;
    };

    if (targetUserIdRaw) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserIdRaw },
        select: { id: true, isBanned: true },
      });
    } else if (targetUsernameRaw) {
      targetUser = await prisma.user.findFirst({
        where: {
          username: { equals: targetUsernameRaw, mode: "insensitive" },
        },
        select: { id: true, isBanned: true },
      });
    } else {
      return NextResponse.json({ error: "Hedef kullanıcı gerekli." }, { status: 400 });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }
    if (targetUser.id === senderId) {
      return NextResponse.json({ error: "Kendine arkadaş isteği gönderemezsin." }, { status: 400 });
    }
    if (targetUser.isBanned) {
      return NextResponse.json({ error: "Bu kullanıcıya istek gönderemezsin." }, { status: 403 });
    }

    const pair = normalizeFriendPair(senderId, targetUser.id);
    const [friendship, sameDirection, reverseDirection] = await Promise.all([
      prisma.friendship.findUnique({
        where: { userAId_userBId: pair },
        select: { id: true },
      }),
      prisma.friendRequest.findUnique({
        where: { senderId_recipientId: { senderId, recipientId: targetUser.id } },
      }),
      prisma.friendRequest.findUnique({
        where: { senderId_recipientId: { senderId: targetUser.id, recipientId: senderId } },
      }),
    ]);

    if (friendship) {
      return NextResponse.json({ error: "Bu kullanıcı zaten arkadaşın." }, { status: 409 });
    }

    if (sameDirection?.status === "PENDING") {
      return NextResponse.json({ error: "Bu kullanıcıya zaten istek gönderdin." }, { status: 409 });
    }

    if (reverseDirection?.status === "PENDING") {
      await prisma.$transaction(async (tx) => {
        await tx.friendRequest.update({
          where: { id: reverseDirection.id },
          data: { status: "ACCEPTED" },
        });

        await tx.friendship.upsert({
          where: { userAId_userBId: pair },
          create: pair,
          update: {},
        });
      });

      return NextResponse.json({
        success: true,
        autoAccepted: true,
        message: "Karşılıklı istek eşleşti, artık arkadaşsınız.",
      });
    }

    if (sameDirection) {
      await prisma.friendRequest.update({
        where: { id: sameDirection.id },
        data: { status: "PENDING" },
      });
    } else {
      await prisma.friendRequest.create({
        data: {
          senderId,
          recipientId: targetUser.id,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Arkadaş isteği gönderildi." });
  } catch (error) {
    console.error("[FRIENDS_POST_ERROR]", error);
    return NextResponse.json({ error: "Arkadaş isteği gönderilemedi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const dbUser = await syncUserFromClerk(clerkUser);
    if (dbUser.isBanned) {
      return NextResponse.json({ error: "Banlı hesap arkadaş isteği güncelleyemez." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const requestId = typeof body?.requestId === "string" ? body.requestId.trim() : "";
    const action = typeof body?.action === "string" ? body.action.trim().toUpperCase() : "";

    if (!requestId || !["ACCEPT", "REJECT", "CANCEL"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        status: true,
      },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: "Arkadaş isteği bulunamadı." }, { status: 404 });
    }
    if (friendRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Bu istek artık beklemede değil." }, { status: 400 });
    }

    const currentUserId = clerkUser.id;

    if (action === "CANCEL") {
      if (friendRequest.senderId !== currentUserId) {
        return NextResponse.json({ error: "Bu isteği iptal etme yetkin yok." }, { status: 403 });
      }

      await prisma.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: "CANCELED" },
      });

      return NextResponse.json({ success: true });
    }

    if (friendRequest.recipientId !== currentUserId) {
      return NextResponse.json({ error: "Bu isteği güncelleme yetkin yok." }, { status: 403 });
    }

    if (action === "REJECT") {
      await prisma.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: "REJECTED" },
      });
      return NextResponse.json({ success: true });
    }

    const pair = normalizeFriendPair(friendRequest.senderId, friendRequest.recipientId);
    await prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: friendRequest.id },
        data: { status: "ACCEPTED" },
      });

      await tx.friendship.upsert({
        where: { userAId_userBId: pair },
        create: pair,
        update: {},
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FRIENDS_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Arkadaş isteği güncellenemedi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const dbUser = await syncUserFromClerk(clerkUser);
    if (dbUser.isBanned) {
      return NextResponse.json({ error: "Banlı hesap arkadaş silemez." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const friendUserId = (searchParams.get("friendUserId") || "").trim();

    if (!friendUserId) {
      return NextResponse.json({ error: "Arkadaş kullanıcı ID gerekli." }, { status: 400 });
    }
    if (friendUserId === clerkUser.id) {
      return NextResponse.json({ error: "Geçersiz kullanıcı." }, { status: 400 });
    }

    const pair = normalizeFriendPair(clerkUser.id, friendUserId);
    const deleted = await prisma.friendship.deleteMany({
      where: pair,
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Arkadaşlık bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FRIENDS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Arkadaş silinemedi." }, { status: 500 });
  }
}
