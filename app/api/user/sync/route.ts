import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapılmamış' }, { status: 401 });

    const userId = user.id;

    // KULLANICIYI BUL VEYA OLUŞTUR (UPSERT)
    // Buradaki kritik nokta: firstName ve lastName bilgilerini de güncelliyoruz.
    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        lastLoginDate: new Date(),
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
      create: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        username: user.username || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Oyuncu",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        currentPoints: 10,
        totalEarned: 10,
        lastLoginDate: new Date(),
      },
    });

    // BAN KONTROLÜ
    if (dbUser.isBanned) {
      return NextResponse.json({ banned: true, points: 0 });
    }

    // GÜNLÜK ÖDÜL MANTIĞI
    const now = new Date();
    const lastLogin = new Date(dbUser.lastLoginDate);
    const diffHours = Math.abs(now.getTime() - lastLogin.getTime()) / 36e5;
    const isEligible = diffHours >= 20 || dbUser.totalEarned === 0;
    
    let rewardGiven = false;

    if (isEligible) {
      await prisma.pointTransaction.create({
        data: {
          amount: 10,
          type: dbUser.totalEarned === 0 ? 'WELCOME_BONUS' : 'DAILY_LOGIN',
          description: dbUser.totalEarned === 0 ? 'Hoşgeldin Bonusu' : 'Günlük Giriş Ödülü',
          userId: userId,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          currentPoints: { increment: 10 },
          totalEarned: { increment: 10 },
          lastLoginDate: now
        }
      });
      rewardGiven = true;
    }

    return NextResponse.json({ 
      success: true, 
      rewardGiven,
      points: dbUser.currentPoints + (rewardGiven ? 10 : 0)
    });

  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}