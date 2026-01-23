import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server"; // 🛡️ GÜVENLİK KATMANI
import { MARKET_PRICES } from "@/lib/market"; // 👈 MERKEZİ FİYATLAR

export async function POST(req: Request) {
  try {
    // 🛡️ 1. ADIM: İsteği yapan GERÇEK kişiyi bul
    const clerkUser = await currentUser();

    if (!clerkUser) {
        return NextResponse.json({ error: "Giriş yapmalısın!" }, { status: 401 });
    }

    const body = await req.json();
    const { frameId } = body; // ⚠️ userId'yi body'den ALMIYORUZ!
    const realUserId = clerkUser.id; // ✅ ID'yi Clerk'ten alıyoruz.

    if (!frameId) {
        return NextResponse.json({ error: "Ürün seçilmedi." }, { status: 400 });
    }

    // 2. Kullanıcıyı veritabanından çek (Transaction için hazırlık)
    const user = await prisma.user.findUnique({ where: { id: realUserId } });
    
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı verisi bulunamadı." }, { status: 404 });
    }

    const currentFrames = user.ownedFrames || ["BASIC"];

    // 3. Zaten sahip mi?
    if (currentFrames.includes(frameId)) {
      return NextResponse.json({ error: "Buna zaten sahipsin!" }, { status: 400 });
    }

    // 4. Fiyat kontrolü (Merkezi Dosyadan)
    const price = MARKET_PRICES[frameId];
    
    // Eğer olmayan bir ürün ID'si gönderilirse (örn: Postman ile)
    if (price === undefined) {
      return NextResponse.json({ error: "Geçersiz ürün." }, { status: 400 });
    }

    // 5. Bakiye yetiyor mu?
    if (user.currentPoints < price) {
      return NextResponse.json({ error: "Yetersiz SP!" }, { status: 402 });
    }

    // 🛡️ 6. ADIM: TRANSACTION (Atomik İşlem)
    // Para düşme ve malı verme işlemi AYNI ANDA olmalı. 
    // Biri olur diğeri olmazsa veri bozulur.
    const updatedUser = await prisma.$transaction(async (tx) => {
        // Tekrar bakiye kontrolü (Double-spend koruması)
        const freshUser = await tx.user.findUnique({ where: { id: realUserId } });
        if (!freshUser || freshUser.currentPoints < price) {
            throw new Error("Bakiye yetersiz (İşlem sırasında değişti)");
        }

        return await tx.user.update({
            where: { id: realUserId },
            data: {
                currentPoints: { decrement: price },
                ownedFrames: { push: frameId },
                // İsteğe bağlı: Transaction geçmişine ekle
                transactions: {
                    create: {
                        amount: -price,
                        type: "MARKET_PURCHASE",
                        description: `${frameId} Çerçeve Alımı`
                    }
                }
            }
        });
    });

    console.log(`✅ Güvenli İşlem: ${user.username} -> ${frameId} (${price} SP) aldı.`);

    return NextResponse.json({ 
      success: true, 
      newPoints: updatedUser.currentPoints, 
      ownedFrames: updatedUser.ownedFrames 
    });

  } catch (error: any) {
    console.error("🔥 MARKET GÜVENLİK HATASI:", error);
    return NextResponse.json({ error: error.message || "Sunucu hatası" }, { status: 500 });
  }
}