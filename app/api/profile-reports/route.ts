import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/user-sync";

const REPORT_REASONS = new Set([
  "TOXIC_BEHAVIOR",
  "HARASSMENT",
  "CHEATING",
  "SPAM",
  "FAKE_PROFILE",
  "OTHER",
]);

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const reporter = await syncUserFromClerk(clerkUser);
    if (reporter.isBanned) {
      return NextResponse.json({ error: "Banli hesap rapor gonderemez." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId =
      typeof body?.targetUserId === "string" ? body.targetUserId.trim() : "";
    const reason =
      typeof body?.reason === "string" ? body.reason.trim().toUpperCase() : "";
    const details = typeof body?.details === "string" ? body.details.trim() : "";

    if (!targetUserId || !REPORT_REASONS.has(reason)) {
      return NextResponse.json({ error: "Gecersiz rapor istegi." }, { status: 400 });
    }
    if (targetUserId === reporter.id) {
      return NextResponse.json({ error: "Kendini raporlayamazsin." }, { status: 400 });
    }
    if (details.length < 6 || details.length > 600) {
      return NextResponse.json(
        { error: "Aciklama 6 ile 600 karakter arasinda olmali." },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isBanned: true },
    });
    if (!targetUser || targetUser.isBanned) {
      return NextResponse.json({ error: "Profil bulunamadi." }, { status: 404 });
    }

    const existingOpenReport = await prisma.profileReport.findFirst({
      where: {
        reporterId: reporter.id,
        targetUserId,
        status: "OPEN",
      },
      select: { id: true },
    });
    if (existingOpenReport) {
      return NextResponse.json(
        { error: "Bu profil icin zaten acik bir raporun var." },
        { status: 409 },
      );
    }

    await prisma.profileReport.create({
      data: {
        reporterId: reporter.id,
        targetUserId,
        reason: reason as
          | "TOXIC_BEHAVIOR"
          | "HARASSMENT"
          | "CHEATING"
          | "SPAM"
          | "FAKE_PROFILE"
          | "OTHER",
        details,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PROFILE_REPORT_POST_ERROR]", error);
    return NextResponse.json({ error: "Rapor gonderilemedi." }, { status: 500 });
  }
}
