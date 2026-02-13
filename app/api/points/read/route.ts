import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

const REWARD_AMOUNT = 20;
const REWARD_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ALLOWED_GUIDE_IDS = new Set(["mid-lane-rehberi-s16", "jungle-rehberi-s16"]);

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giris gerekli" }, { status: 401 });
    }

    const body = await request.json();
    const guideId = typeof body?.guideId === "string" ? body.guideId.trim() : "";

    if (!guideId) {
      return NextResponse.json({ error: "Rehber ID yok" }, { status: 400 });
    }

    if (!ALLOWED_GUIDE_IDS.has(guideId)) {
      return NextResponse.json({ error: "Gecersiz rehber ID" }, { status: 400 });
    }

    const rewardType = `READ_GUIDE:${guideId}`;
    const cooldownCutoff = new Date(Date.now() - REWARD_COOLDOWN_MS);

    const claimResult = await prisma.$transaction(
      async (tx) => {
        const dbUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { id: true, isBanned: true, currentPoints: true },
        });

        if (!dbUser) {
          return { status: "NOT_FOUND" as const };
        }

        if (dbUser.isBanned) {
          return { status: "BANNED" as const };
        }

        const existingReward = await tx.pointTransaction.findFirst({
          where: {
            userId: user.id,
            type: rewardType,
            createdAt: { gte: cooldownCutoff },
          },
          select: { id: true },
        });

        if (existingReward) {
          return { status: "ALREADY_CLAIMED" as const };
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
            type: rewardType,
            description: `${guideId} guide reward`,
          },
        });

        return { status: "SUCCESS" as const, points: updatedUser.currentPoints };
      },
      {
        isolationLevel: "Serializable",
      },
    );

    if (claimResult.status === "NOT_FOUND") {
      return NextResponse.json({ error: "Kullanici bulunamadi" }, { status: 404 });
    }

    if (claimResult.status === "BANNED") {
      return NextResponse.json({ error: "Banli hesap islem yapamaz." }, { status: 403 });
    }

    if (claimResult.status === "ALREADY_CLAIMED") {
      return NextResponse.json(
        { error: "Bu rehber icin son 24 saatte puan zaten alindi." },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "+20 Puan Eklendi!",
      points: claimResult.points,
    });
  } catch {
    return NextResponse.json({ error: "Hata olustu" }, { status: 500 });
  }
}
