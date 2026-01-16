import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

// 1. GET: SADECE ONAYLANMIŞ YORUMLARI GETİR
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
        isApproved: true // <-- Sadece onaylılar gözükecek
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Yorumlar yüklenirken hata oluştu' }, { status: 500 });
  }
}

// 2. POST: YORUMU KAYDET (AMA ONAYSIZ OLARAK)
export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Giriş yapmalısın' }, { status: 401 });
    }

    const body = await request.json();
    const { content, guideId } = body;

    if (!content || !guideId) {
      return NextResponse.json({ error: 'İçerik eksik' }, { status: 400 });
    }

    // İstersen buraya kendi Clerk ID'ni yazarak kendini yönetici yapabilirsin.
    // Şimdilik herkes onaya düşecek.
    const isAdmin = false; 

    const newComment = await prisma.comment.create({
      data: {
        content,
        guideId,
        userId: user.id,
        username: user.firstName || user.username || 'İsimsiz Oyuncu',
        userImage: user.imageUrl,
        isApproved: isAdmin ? true : false, // Admin değilse onay bekle
      },
    });

    return NextResponse.json(newComment);

  } catch (error) {
    console.error("Yorum Hatası:", error);
    return NextResponse.json({ error: 'Yorum kaydedilemedi' }, { status: 500 });
  }
}