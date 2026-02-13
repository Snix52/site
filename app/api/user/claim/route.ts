import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!dbUser) {
        throw new Error("USER_NOT_FOUND");
      }

      if (dbUser.isBanned) {
        throw new Error("BANNED");
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let lastClaimDateOnly = null;
      if (dbUser.lastClaimDate) {
        const d = new Date(dbUser.lastClaimDate);
        lastClaimDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }

      if (lastClaimDateOnly && lastClaimDateOnly.getTime() === today.getTime()) {
        throw new Error("ALREADY_CLAIMED");
      }

      let newStreak = 1;
      if (lastClaimDateOnly) {
        const diffTime = Math.abs(today.getTime() - lastClaimDateOnly.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak = (dbUser.streak || 0) + 1;
        }
      }

      const normalizedStreak = newStreak > 7 ? 1 : newStreak;
      const rewardAmount = normalizedStreak === 7 ? 150 : normalizedStreak * 10;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          currentPoints: { increment: rewardAmount },
          totalEarned: { increment: rewardAmount },
          streak: normalizedStreak,
          lastClaimDate: now,
          notifications: {
            create: {
              title: `Gun ${normalizedStreak} tamamlandi`,
              message: `Lojistik destek: +${rewardAmount} SP eklendi.`,
              type: "GIFT",
            },
          },
          transactions: {
            create: {
              amount: rewardAmount,
              type: "DAILY_REWARD",
              description: `Gunluk odul (streak: ${normalizedStreak})`,
            },
          },
        },
      });

      return {
        success: true,
        points: updatedUser.currentPoints,
        streak: updatedUser.streak,
        lastClaimDate: updatedUser.lastClaimDate,
        rewardAmount,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ALREADY_CLAIMED") {
      return NextResponse.json(
        { success: false, message: "Bugunku odulu zaten aldin." },
        { status: 400 },
      );
    }
    if (message === "BANNED") {
      return NextResponse.json(
        { success: false, message: "Banli hesap islem yapamaz." },
        { status: 403 },
      );
    }
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Kullanici bulunamadi." },
        { status: 404 },
      );
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}
