import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

    const body = await request.json();
    const guideId = typeof body?.guideId === 'string' ? body.guideId.trim() : '';

    if (!guideId) return NextResponse.json({ error: 'Rehber ID yok' }, { status: 400 });

    const REWARD_AMOUNT = 20;
    const rewardDescription = `${guideId} rehberi okundu`;

    const claimResult = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { id: true, isBanned: true },
      });

      if (!dbUser) {
        return { status: 'NOT_FOUND' as const };
      }

      if (dbUser.isBanned) {
        return { status: 'BANNED' as const };
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existingReward = await tx.pointTransaction.findFirst({
        where: {
          userId: user.id,
          type: 'READ_GUIDE',
          description: rewardDescription,
          createdAt: { gte: twentyFourHoursAgo },
        },
        select: { id: true },
      });

      if (existingReward) {
        return { status: 'ALREADY_CLAIMED' as const };
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          currentPoints: { increment: REWARD_AMOUNT },
          totalEarned: { increment: REWARD_AMOUNT },
        },
      });

      await tx.pointTransaction.create({
        data: {
          userId: user.id,
          amount: REWARD_AMOUNT,
          type: 'READ_GUIDE',
          description: rewardDescription,
        },
      });

      return { status: 'SUCCESS' as const };
    }, {
      isolationLevel: 'Serializable',
    });

    if (claimResult.status === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    if (claimResult.status === 'BANNED') {
      return NextResponse.json({ error: 'Hesabınız yasaklı, işlem yapamazsınız.' }, { status: 403 });
    }

    if (claimResult.status === 'ALREADY_CLAIMED') {
      return NextResponse.json(
        { error: 'Bu rehber için son 24 saatte puan zaten alındı.' },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true, message: '+20 Puan Eklendi!' });

  } catch (error) {
    return NextResponse.json({ error: 'Hata oluştu' }, { status: 500 });
  }
}
