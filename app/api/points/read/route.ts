import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });

    const body = await request.json();
    const { guideId } = body;

    if (!guideId) return NextResponse.json({ error: 'Rehber ID yok' }, { status: 400 });

    // Spam Koruması: Bu kullanıcı bu rehberden son 24 saatte puan almış mı?
    // (Bunu daha sonra Redis veya veritabanı sorgusuyla yapabilirsin, şimdilik basit tutuyoruz)
    
    // Puanı ver
    const REWARD_AMOUNT = 20;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { 
          currentPoints: { increment: REWARD_AMOUNT },
          totalEarned: { increment: REWARD_AMOUNT },
        }
      }),
      prisma.pointTransaction.create({
        data: {
          userId: user.id,
          amount: REWARD_AMOUNT,
          type: "READ_GUIDE",
          description: `${guideId} rehberi okundu`,
        }
      })
    ]);

    return NextResponse.json({ success: true, message: '+20 Puan Eklendi!' });

  } catch (error) {
    return NextResponse.json({ error: 'Hata oluştu' }, { status: 500 });
  }
}