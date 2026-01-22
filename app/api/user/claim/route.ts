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

    // 1. Kullanıcıyı Bul
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
        return new NextResponse("User not found", { status: 404 });
    }

    // 2. TARİH MANTIĞI (KURŞUN GEÇİRMEZ VERSİYON)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Saat 00:00:00
    
    let lastClaimDateOnly = null;
    if (dbUser.lastClaimDate) {
        const d = new Date(dbUser.lastClaimDate);
        lastClaimDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // Saat 00:00:00
    }

    // Bugün almış mı? (Milisaniye karşılaştırması)
    if (lastClaimDateOnly && lastClaimDateOnly.getTime() === today.getTime()) {
        return NextResponse.json({ 
            success: false, 
            message: "Already claimed today",
            points: dbUser.currentPoints,
            streak: dbUser.streak,
            lastClaimDate: dbUser.lastClaimDate
        }, { status: 400 });
    }

    // 3. Streak Hesaplama
    let newStreak = 1;
    
    if (lastClaimDateOnly) {
        // İki tarih arasındaki gün farkını bul
        const diffTime = Math.abs(today.getTime() - lastClaimDateOnly.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        // Eğer fark 1 gün ise seriyi artır (Dün almış demektir)
        if (diffDays === 1) {
            newStreak = (dbUser.streak || 0) + 1;
        } else {
            // Fark 1 günden fazlaysa seri 1'e düşer (Zincir koptu)
            newStreak = 1; 
        }
    } else {
        // Hiç almamışsa 1
        newStreak = 1;
    }

    // 4. Ödül Miktarı
    // Eğer seri 7'yi geçerse başa mı dönsün yoksa 7'den mi devam etsin?
    // Genelde 7'den sonra 1'e döner (Haftalık Döngü)
    const normalizedStreak = newStreak > 7 ? 1 : newStreak;
    const rewardAmount = normalizedStreak === 7 ? 150 : normalizedStreak * 10;

    // 5. Güncelleme
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            currentPoints: { increment: rewardAmount },
            totalEarned: { increment: rewardAmount },
            streak: normalizedStreak,
            lastClaimDate: new Date(), // Tam şu anın tarihi
            notifications: {
                create: {
                    title: `Gün ${normalizedStreak} Tamamlandı!`,
                    message: `Lojistik destek ulaştı: +${rewardAmount} SP hesabına eklendi.`,
                    type: "GIFT"
                }
            }
        }
    });

    return NextResponse.json({ 
        success: true, 
        points: updatedUser.currentPoints, 
        streak: updatedUser.streak,
        lastClaimDate: updatedUser.lastClaimDate 
    });

  } catch (error) {
    console.log("[DAILY_CLAIM_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}