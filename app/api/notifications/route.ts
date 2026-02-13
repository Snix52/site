import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

async function getAllowedUserId() {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, isBanned: true },
  });

  if (!dbUser) return { error: "Kullanici bulunamadi", status: 404 as const };
  if (dbUser.isBanned) return { error: "Banli hesap islem yapamaz", status: 403 as const };

  return { userId: dbUser.id };
}

export async function GET() {
  try {
    const authResult = await getAllowedUserId();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: authResult.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const authResult = await getAllowedUserId();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await prisma.notification.updateMany({
      where: { userId: authResult.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Hata" }, { status: 500 });
  }
}
