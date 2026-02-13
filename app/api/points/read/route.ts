import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

const REWARD_AMOUNT = 20;
const COOLDOWN_HOURS = 24;

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giris gerekli" }, { status: 401 });
    }

    const body = await request.json();
    const guideId = String(body?.guideId ?? "").trim();

    if (!guideId) {
      return NextResponse.json({ error: "Rehber ID yok" }, { status: 400 });
    }

    const cutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000);
    const txType = `READ_GUIDE:${guideId}`;

    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({ where: { id: user.id } });

      if (!dbUser) {
        return { status: 404 as const, body: { error: "Kullanici bulunamadi" } };
      }

      if (dbUser.isBanned) {
        return { status: 403 as const, body: { error: "Banli hesap islem yapamaz" } };
      }

      const alreadyRewarded = await tx.pointTransaction.findFirst({
        where: {
          userId: user.id,
          type: txType,
          createdAt: { gte: cutoff },
        },
        select: { id: true },
      });

      if (alreadyRewarded) {
        return { status: 429 as const, body: { error: "Bu rehber icin 24 saat dolmadi" } };
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          currentPoints: { increment: REWARD_AMOUNT },
          totalEarned: { increment: REWARD_AMOUNT },
        },
        select: { currentPoints: true },
      });

      await tx.pointTransaction.create({
        data: {
          userId: user.id,
          amount: REWARD_AMOUNT,
          type: txType,
          description: `${guideId} rehberi okundu`,
        },
      });

      return {
        status: 200 as const,
        body: {
          success: true,
          message: `+${REWARD_AMOUNT} puan eklendi`,
          points: updatedUser.currentPoints,
        },
      };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Hata olustu" }, { status: 500 });
  }
}
