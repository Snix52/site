import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

// 1. GET: ONAYLI YORUMLARI ÇEK
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');

    if (!guideId) {
      return NextResponse.json({ error: 'Rehber ID eksik' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { 
        guideId,
        isApproved: true 
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            firstName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET Hatası:", error);
    return NextResponse.json({ error: 'Yorumlar yüklenirken hata oluştu' }, { status: 500 });
  }
}

// 2. POST: YORUM AT (BAN KONTROLLÜ)
export async function POST(request: Request) {
  try {
    // A. Clerk'ten kullanıcıyı al
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });
    }

    // B. ÖNCE BAN KONTROLÜ YAP 🛡️
    // Veritabanına bak, bu adam banlı mı?
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (existingUser?.isBanned) {
      // Eğer banlıysa işlemi burada bitir, hata fırlat.
      return NextResponse.json({ error: 'Hesabınız yasaklanmıştır. İşlem yapamazsınız.' }, { status: 403 });
    }

    // C. Verileri al
    const body = await request.json();
    const { content, guideId } = body;

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    const trimmedGuideId = typeof guideId === 'string' ? guideId.trim() : '';

    if (!trimmedContent || !trimmedGuideId) {
      return NextResponse.json({ error: 'İçerik eksik' }, { status: 400 });
    }

    if (trimmedContent.length > 1000) {
      return NextResponse.json({ error: 'Yorum çok uzun (maksimum 1000 karakter).' }, { status: 400 });
    }

    // D. KULLANICIYI GARANTİYE AL (Upsert)
    // Banlı değilse, bilgilerini güncelle veya oluştur
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.emailAddresses[0]?.emailAddress,
        username: user.username || "Oyuncu",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
      create: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        username: user.username || "Oyuncu",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        currentPoints: 0,
        // isBanned varsayılan olarak false gelir
      },
    });

    // E. YORUMU OLUŞTUR
    const isAdmin = user.id === "user_38IQNX84WzWPGgn1wdzcOWogLaN"; // Senin ID'n (İstersen burayı kullan)

    const newComment = await prisma.comment.create({
      data: {
        content: trimmedContent,
        guideId: trimmedGuideId,
        userId: user.id,
        isApproved: isAdmin ? true : false, // Adminse direkt onayla, değilse bekle
      },
    });

    return NextResponse.json(newComment);

  } catch (error) {
    console.error("Yorum Kayıt Hatası:", error);
    return NextResponse.json({ error: 'Sunucu hatası: Yorum kaydedilemedi' }, { status: 500 });
  }
}
