import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Giriş yapılmamış' }, { status: 401 });

    const userId = user.id;

    // 1. KULLANICIYI BUL VEYA OLUŞTUR (UPSERT)
    // Bu kısım kullanıcının Clerk'teki adı/resmi değişirse veritabanını da günceller.
    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        lastLoginDate: new Date(),
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress || "",
      },
      create: {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        username: user.username || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Oyuncu",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        currentPoints: 10, // İlk kayıt bonusu (Hoşgeldin)
        totalEarned: 10,
        lastLoginDate: new Date(),
        streak: 0,
      },
    });

    // 2. BAN KONTROLÜ
    if (dbUser.isBanned) {
      return NextResponse.json({ banned: true, points: 0 });
    }

    // ⚡ ÖNEMLİ DEĞİŞİKLİK:
    // Artık burada "Otomatik Günlük Ödül" vermiyoruz. 
    // Onu kullanıcı butona basarak /api/user/claim üzerinden alacak.
    // Burası sadece Frontend'e "Durum Raporu" verir.

    return NextResponse.json({ 
      success: true, 
      points: dbUser.currentPoints,
      streak: dbUser.streak,           // <--- F5 atınca sayacın bozulmaması için ŞART
      lastClaimDate: dbUser.lastClaimDate, // <--- Butonun kilitli kalması için ŞART
      isBanned: dbUser.isBanned
    });

  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}