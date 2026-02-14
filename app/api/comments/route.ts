import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { canModerateComments } from "@/lib/admin-auth";
import { resolveStaffRole } from "@/lib/admin-auth-server";
import { syncUserFromClerk } from "@/lib/user-sync";

const COMMENT_RATE_WINDOW_MS = 60 * 1000;
const COMMENT_RATE_MAX = 3;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get("guideId");

    if (!guideId) {
      return NextResponse.json({ error: "Rehber ID eksik" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        guideId,
        isApproved: true,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            firstName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[COMMENTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Yorumlar yuklenirken hata olustu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giris yapmalisin" }, { status: 401 });
    }

    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const guideId = typeof body?.guideId === "string" ? body.guideId.trim() : "";

    if (!content || !guideId) {
      return NextResponse.json({ error: "Icerik eksik" }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: "Yorum cok uzun (maksimum 1000 karakter)." }, { status: 400 });
    }

    const dbUser = await syncUserFromClerk(user);
    if (dbUser.isBanned) {
      return NextResponse.json(
        { error: "Hesabiniz yasaklanmistir. Islem yapamazsiniz." },
        { status: 403 },
      );
    }

    const recentCommentCount = await prisma.comment.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - COMMENT_RATE_WINDOW_MS) },
      },
    });

    if (recentCommentCount >= COMMENT_RATE_MAX) {
      return NextResponse.json(
        { error: "Cok hizli yorum atiyorsun. Lutfen biraz bekleyip tekrar dene." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.floor(COMMENT_RATE_WINDOW_MS / 1000)) },
        },
      );
    }

    const role = await resolveStaffRole(user.id);
    const isModerator = canModerateComments(role);

    const newComment = await prisma.comment.create({
      data: {
        content,
        guideId,
        userId: user.id,
        isApproved: isModerator,
      },
    });

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("[COMMENTS_POST_ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatasi: Yorum kaydedilemedi" }, { status: 500 });
  }
}
