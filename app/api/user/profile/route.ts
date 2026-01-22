import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    // 1. Kimlik Kontrolü
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Kullanıcıdan Gelen Veriyi Al
    const body = await req.json();
    const { bio, mainRole, favoriteChamp, rankGoal, socialDiscord } = body;

    // 3. Veritabanından Kullanıcıyı Bul (Banlı mı bakacağız)
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 🚫 GÜVENLİK: Banlıysa işlem yapamasın
    if (existingUser.isBanned) {
      return new NextResponse("Hesabınız yasaklı, profil güncelleyemezsiniz.", { status: 403 });
    }

    // 4. BASİT DOĞRULAMALAR (Validation)
    // Bio çok uzunsa reddet (Spam koruması)
    if (bio && bio.length > 500) {
      return new NextResponse("Biyografi çok uzun! (Max 500 karakter)", { status: 400 });
    }
    
    // Rol kontrolü (Saçma sapan bir rol girmesin)
    const validRoles = ["TOP", "JUNGLE", "MID", "ADC", "SUPP", "UNSELECTED"];
    if (mainRole && !validRoles.includes(mainRole)) {
      return new NextResponse("Geçersiz rol seçimi.", { status: 400 });
    }

    // 5. GÜNCELLEME İŞLEMİ
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bio,
        mainRole,
        favoriteChamp,
        rankGoal,
        socialDiscord,
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.log("[PROFILE_UPDATE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}