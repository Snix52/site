import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    // 1. KİMLİK KONTROLÜ (Oturum açmış mı?)
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. VERİYİ AL
    const body = await req.json();
    const { bio, mainRole, favoriteChamp, rankGoal, socialDiscord, selectedFrame } = body;

    // 3. KULLANICIYI BUL (Veritabanı kontrolü)
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // GÜVENLİK 1: BAN KONTROLÜ
    if (existingUser.isBanned) {
      return new NextResponse("Hesabınız yasaklı, işlem yapamazsınız.", { status: 403 });
    }

    // ---------------------------------------------------------
    // 4. SIKI DOĞRULAMALAR (VALIDATION - GİRİŞ KAPISI)
    // ---------------------------------------------------------

    // A. Bio Kontrolü (Max 300 karakter)
    if (bio && bio.length > 300) {
      return new NextResponse("Biyografi çok uzun! (Max 300 karakter)", { status: 400 });
    }

    // B. Rol Kontrolü (Sadece izin verilenler)
    const validRoles = ["TOP", "JUNGLE", "MID", "ADC", "SUPP", "UNSELECTED"];
    if (mainRole && !validRoles.includes(mainRole)) {
      return new NextResponse("Geçersiz rol seçimi.", { status: 400 });
    }

    // C. Hedef Lig Kontrolü (Max 20 karakter)
    if (rankGoal && rankGoal.length > 20) {
        return new NextResponse("Hedef lig ismi çok uzun.", { status: 400 });
    }

    // D. Discord/Sosyal Kontrolü (Max 35 karakter)
    if (socialDiscord && socialDiscord.length > 35) {
        return new NextResponse("Discord kullanıcı adı çok uzun.", { status: 400 });
    }

    // E. Şampiyon İsmi Kontrolü (Max 30 karakter)
    if (favoriteChamp && favoriteChamp.length > 30) {
        return new NextResponse("Şampiyon ismi geçersiz.", { status: 400 });
    }

    // GÜVENLİK 2: ENVANTER KONTROLÜ (HACK KORUMASI)
    // Kullanıcı bir çerçeve seçtiyse, buna gerçekten sahip mi?
    if (selectedFrame) {
        const ownedFrames = existingUser.ownedFrames || ["BASIC"];
        
        if (!ownedFrames.includes(selectedFrame)) {
            // HACK GİRİŞİMİ: Sahip olmadığı şeyi takmaya çalışıyor.
            console.warn(`HACK DENEMESİ: ${userId} ID'li kullanıcı sahip olmadığı çerçeveyi (${selectedFrame}) takmaya çalıştı!`);
            return new NextResponse("Bu çerçeveye sahip değilsin, önce satın al!", { status: 400 });
        }
    }

    // 5. GÜNCELLEME İŞLEMİ (Verileri temizleyerek kaydet - trim)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: bio ? bio.trim() : undefined,
        mainRole,
        favoriteChamp,
        rankGoal: rankGoal ? rankGoal.trim() : undefined,
        socialDiscord: socialDiscord ? socialDiscord.trim() : undefined,
        selectedFrame, // Güvenlikten geçti, güncelleyebiliriz
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.log("[PROFILE_UPDATE_ERROR]", error);
    return new NextResponse("Sunucu hatası", { status: 500 });
  }
}
