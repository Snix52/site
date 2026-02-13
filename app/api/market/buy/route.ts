import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { MARKET_PRICES } from "@/lib/market";

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Giris yapmalisin." }, { status: 401 });
    }

    const body = await req.json();
    const frameId = String(body?.frameId ?? "").trim();
    const realUserId = clerkUser.id;

    if (!frameId) {
      return NextResponse.json({ error: "Urun secilmedi." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: realUserId } });
    if (!user) {
      return NextResponse.json({ error: "Kullanici verisi bulunamadi." }, { status: 404 });
    }
    if (user.isBanned) {
      return NextResponse.json({ error: "Banli hesap islem yapamaz." }, { status: 403 });
    }

    const currentFrames = user.ownedFrames || ["BASIC"];
    if (currentFrames.includes(frameId)) {
      return NextResponse.json({ error: "Buna zaten sahipsin." }, { status: 400 });
    }

    const price = MARKET_PRICES[frameId];
    if (price === undefined) {
      return NextResponse.json({ error: "Gecersiz urun." }, { status: 400 });
    }

    if (user.currentPoints < price) {
      return NextResponse.json({ error: "Yetersiz SP." }, { status: 402 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({ where: { id: realUserId } });
      if (!freshUser) {
        throw new Error("USER_NOT_FOUND");
      }
      if (freshUser.isBanned) {
        throw new Error("BANNED");
      }
      if (freshUser.currentPoints < price) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
      if ((freshUser.ownedFrames || ["BASIC"]).includes(frameId)) {
        throw new Error("ALREADY_OWNED");
      }

      return tx.user.update({
        where: { id: realUserId },
        data: {
          currentPoints: { decrement: price },
          ownedFrames: { push: frameId },
          transactions: {
            create: {
              amount: -price,
              type: "MARKET_PURCHASE",
              description: `${frameId} cerceve alimi`,
            },
          },
        },
        select: { currentPoints: true, ownedFrames: true },
      });
    });

    return NextResponse.json({
      success: true,
      newPoints: updatedUser.currentPoints,
      ownedFrames: updatedUser.ownedFrames,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "BANNED") {
      return NextResponse.json({ error: "Banli hesap islem yapamaz." }, { status: 403 });
    }
    if (message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Yetersiz SP." }, { status: 402 });
    }
    if (message === "ALREADY_OWNED") {
      return NextResponse.json({ error: "Buna zaten sahipsin." }, { status: 400 });
    }
    if (message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Kullanici verisi bulunamadi." }, { status: 404 });
    }

    return NextResponse.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}
