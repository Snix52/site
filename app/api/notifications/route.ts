import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

// 1. BİLDİRİMLERİ GETİR
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20 // En son 20 bildirim
    });

    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: 'Hata' }, { status: 500 });
  }
}

// 2. OKUNDU İŞARETLE (Kutuyu açınca çalışır)
export async function PUT() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Hata' }, { status: 500 });
  }
}

