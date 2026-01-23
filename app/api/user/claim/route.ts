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

    // 🛡️ TRANSACTION BAŞLATIYORUZ
    // Okuma ve Yazma işlemlerini tek bir paket yapıyoruz.
    const result = await prisma.$transaction(async (tx) => {
        
        // 1. Kullanıcıyı Transaction İçinde Bul (Kilitli veri)
        const dbUser = await tx.user.findUnique({
            where: { id: userId },
        });

        if (!dbUser) {
            throw new Error("User not found");
        }

        // 2. TARİH MANTIĞI (Senin yazdığın efsane mantık)
        const now = new Date();
        // UTC Sorununu çözmek için basit bir trick:
        // Eğer sunucu UTC ise ve TR saati istiyorsan buraya offset ekleyebiliriz.
        // Ama şimdilik sunucu saatiyle devam edelim, global standarttır.
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 

        let lastClaimDateOnly = null;
        if (dbUser.lastClaimDate) {
            const d = new Date(dbUser.lastClaimDate);
            lastClaimDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        }

        // Bugün almış mı?
        if (lastClaimDateOnly && lastClaimDateOnly.getTime() === today.getTime()) {
            // Hata fırlatarak transaction'ı iptal ediyoruz, catch bloğu yakalayacak
            throw new Error("ALREADY_CLAIMED");
        }

        // 3. Streak Hesaplama
        let newStreak = 1;

        if (lastClaimDateOnly) {
            const diffTime = Math.abs(today.getTime() - lastClaimDateOnly.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                newStreak = (dbUser.streak || 0) + 1;
            } else {
                newStreak = 1; // Zincir koptu
            }
        }

        // 4. Ödül Döngüsü (Haftalık Reset)
        const normalizedStreak = newStreak > 7 ? 1 : newStreak;
        // 7. Gün Bonusu: 150 SP, Normal günler: 10 * Gün
        const rewardAmount = normalizedStreak === 7 ? 150 : normalizedStreak * 10;

        // 5. Güncelleme (Atomik)
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                currentPoints: { increment: rewardAmount },
                totalEarned: { increment: rewardAmount },
                streak: normalizedStreak,
                lastClaimDate: now, // Tam şu an (Saatli)
                
                // Bildirimi de aynı anda oluşturuyoruz
                notifications: {
                    create: {
                        title: `Gün ${normalizedStreak} Tamamlandı!`,
                        message: `Lojistik destek ulaştı: +${rewardAmount} SP hesabına eklendi.`,
                        type: "GIFT"
                    }
                },
                
                // Opsiyonel: Log tutmak istersen Transaction geçmişi
                transactions: {
                    create: {
                        amount: rewardAmount,
                        type: "DAILY_REWARD",
                        description: `Günlük Ödül (Streak: ${normalizedStreak})`
                    }
                }
            }
        });

        return { 
            success: true, 
            points: updatedUser.currentPoints, 
            streak: updatedUser.streak,
            lastClaimDate: updatedUser.lastClaimDate,
            rewardAmount // Client'a göstermek için geri döndük
        };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    // Özel hata kontrolü
    if (error.message === "ALREADY_CLAIMED") {
         return NextResponse.json({ 
            success: false, 
            message: "Bugünkü ödülü zaten aldın yarın gel!",
         }, { status: 400 });
    }
    
    console.log("[DAILY_CLAIM_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}