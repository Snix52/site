import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapılmamış' }, { status: 401 });

    const userId = user.id;

    // Kullanıcıyı bul
    let dbUser = await prisma.user.findUnique({ where: { id: userId } });

    // Kullanıcı yoksa oluştur
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: user.emailAddresses[0]?.emailAddress,
          username: user.username || "Oyuncu",
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          currentPoints: 0,
          totalEarned: 0,
          lastLoginDate: new Date(0),
        },
      });
    }

    // BAN KONTROLÜ
    if (dbUser.isBanned) {
      return NextResponse.json({ banned: true, points: 0 });
    }

    // ÖDÜL MANTIĞI
    const now = new Date();
    const lastLogin = new Date(dbUser.lastLoginDate);
    const diffHours = Math.abs(now.getTime() - lastLogin.getTime()) / 36e5;
    const isEligible = diffHours >= 20 || dbUser.totalEarned === 0;
    
    let rewardGiven = false;

    if (isEligible) {
      // 1. İşlem Kaydı
      await prisma.pointTransaction.create({
        data: {
          amount: 10,
          type: dbUser.totalEarned === 0 ? 'WELCOME_BONUS' : 'DAILY_LOGIN',
          description: dbUser.totalEarned === 0 ? 'Hoşgeldin Bonusu' : 'Günlük Giriş Ödülü',
          userId: userId,
        },
      });

      // 2. BİLDİRİM OLUŞTUR (YENİ EKLEME) 🔥
      await prisma.notification.create({
        data: {
            userId: userId,
            title: dbUser.totalEarned === 0 ? "Aramıza Hoşgeldin!" : "Günlük Ödül",
            message: "Hesabına 10 SP yüklendi. Yarın yine bekleriz!",
            type: "GIFT"
        }
      });

      // 3. Puanı Ver
      dbUser = await prisma.user.update({
        where: { id: userId },
        data: {
          currentPoints: { increment: 10 },
          totalEarned: { increment: 10 },
          lastLoginDate: now,
        },
      });
      rewardGiven = true;
    }

    return NextResponse.json({ 
      points: dbUser.currentPoints, 
      rewardGiven: rewardGiven,
      banned: false 
    });

  } catch (error) {
    console.error("Sync Hatası:", error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}