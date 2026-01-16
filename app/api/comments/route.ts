import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

// YORUMLARI GETİR (GET)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guideId = searchParams.get('guideId');

    if (!guideId) {
      return NextResponse.json({ error: 'Rehber ID eksik' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { guideId },
      orderBy: { createdAt: 'desc' }, // En yeni yorum en üstte
    });

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Yorumlar yüklenirken hata oluştu' }, { status: 500 });
  }
}

// YORUM EKLE (POST)
export async function POST(request: Request) {
  try {
    // 1. Kullanıcı giriş yapmış mı kontrol et
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });
    }

    // 2. Yorum verisini al
    const body = await request.json();
    const { content, guideId } = body;

    if (!content || !guideId) {
      return NextResponse.json({ error: 'İçerik eksik' }, { status: 400 });
    }

    // 3. Veritabanına kaydet
    const newComment = await prisma.comment.create({
      data: {
        content,
        guideId,
        userId: user.id,
        username: user.firstName || user.username || 'İsimsiz Oyuncu', // İsim yoksa 'İsimsiz' yap
        userImage: user.imageUrl,
      },
    });

    return NextResponse.json(newComment);

  } catch (error) {
    console.error("Yorum Hatası:", error);
    return NextResponse.json({ error: 'Yorum kaydedilemedi' }, { status: 500 });
  }
}