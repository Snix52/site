import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

const ADMIN_ID = "user_38IQNX84WzWPGgn1wdzcOWogLaN";

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
  } catch {
    return NextResponse.json({ error: "Yorumlar yuklenirken hata olustu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giris yapmalisin" }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isBanned: true },
    });

    if (existingUser?.isBanned) {
      return NextResponse.json(
        { error: "Hesabiniz yasakli. Islem yapamazsiniz." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const content = String(body?.content ?? "").trim();
    const guideId = String(body?.guideId ?? "").trim();

    if (!content || !guideId) {
      return NextResponse.json({ error: "Icerik eksik" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Yorum cok uzun" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.emailAddresses[0]?.emailAddress,
        username: user.username || "Oyuncu",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
      create: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        username: user.username || "Oyuncu",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        currentPoints: 0,
      },
    });

    const isAdmin = user.id === ADMIN_ID;

    const newComment = await prisma.comment.create({
      data: {
        content,
        guideId,
        userId: user.id,
        isApproved: isAdmin,
      },
      select: {
        id: true,
        content: true,
        guideId: true,
        isApproved: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newComment);
  } catch {
    return NextResponse.json({ error: "Sunucu hatasi: yorum kaydedilemedi" }, { status: 500 });
  }
}
