import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/user-sync";

const TEAM_SIZE = 5;
const APPLY_RATE_WINDOW_MS = 10 * 60 * 1000;
const APPLY_RATE_MAX = 8;
const VALID_ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPP", "FILL"] as const;
type Role = (typeof VALID_ROLES)[number];

function normalizeRole(input: unknown): Role | null {
  if (typeof input !== "string") return null;
  const role = input.toUpperCase().trim();
  return VALID_ROLES.includes(role as Role) ? (role as Role) : null;
}

async function runSerializableWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isSerializationConflict =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!isSerializationConflict) throw error;
      attempt += 1;
    }
  }

  throw lastError ?? new Error("SERIALIZATION_RETRY_FAILED");
}

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = (searchParams.get("postId") || "").trim();
    if (!postId) {
      return NextResponse.json({ error: "Ilan ID gerekli." }, { status: 400 });
    }

    const post = await prisma.teamPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Ilan bulunamadi." }, { status: 404 });
    }
    if (post.userId !== user.id) {
      return NextResponse.json({ error: "Bu ilana yetkin yok." }, { status: 403 });
    }

    const applications = await prisma.teamApplication.findMany({
      where: { teamPostId: postId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        desiredRole: true,
        playerInfo: true,
        discord: true,
        status: true,
        createdAt: true,
        applicant: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            mainRole: true,
          },
        },
      },
    });

    const acceptedCount = applications.filter((a) => a.status === "ACCEPTED").length;
    const filledSlots = Math.min(TEAM_SIZE, 1 + acceptedCount);

    return NextResponse.json({
      applications,
      acceptedCount,
      filledSlots,
      maxPlayers: TEAM_SIZE,
    });
  } catch (error) {
    console.error("[TEAMUP_APPLY_GET_ERROR]", error);
    return NextResponse.json({ error: "Basvurular yuklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const dbUser = await syncUserFromClerk(user);
    if (dbUser.isBanned) {
      return NextResponse.json({ error: "Banli hesap basvuru yapamaz." }, { status: 403 });
    }

    const body = await request.json();
    const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
    const desiredRole = normalizeRole(body?.desiredRole);
    const playerInfo = typeof body?.playerInfo === "string" ? body.playerInfo.trim() : "";
    const discord = typeof body?.discord === "string" ? body.discord.trim() : "";

    if (!postId) {
      return NextResponse.json({ error: "Ilan ID gerekli." }, { status: 400 });
    }
    if (!desiredRole) {
      return NextResponse.json({ error: "Gecerli bir rol sec." }, { status: 400 });
    }
    if (!playerInfo || playerInfo.length > 400) {
      return NextResponse.json({ error: "Oyuncu bilgisi 1-400 karakter olmali." }, { status: 400 });
    }
    if (!discord || discord.length > 50) {
      return NextResponse.json({ error: "Discord bilgisi 1-50 karakter olmali." }, { status: 400 });
    }

    const post = await prisma.teamPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, isActive: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Ilan bulunamadi." }, { status: 404 });
    }
    if (!post.isActive) {
      return NextResponse.json({ error: "Bu ilan artik aktif degil." }, { status: 400 });
    }
    if (post.userId === user.id) {
      return NextResponse.json({ error: "Kendi ilanina basvuramazsin." }, { status: 400 });
    }

    const recentApplyCount = await prisma.teamApplication.count({
      where: {
        applicantId: user.id,
        createdAt: { gte: new Date(Date.now() - APPLY_RATE_WINDOW_MS) },
      },
    });

    if (recentApplyCount >= APPLY_RATE_MAX) {
      return NextResponse.json(
        { error: "Cok hizli basvuru yapiyorsun. Biraz bekleyip tekrar dene." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.floor(APPLY_RATE_WINDOW_MS / 1000)) },
        },
      );
    }

    const acceptedCount = await prisma.teamApplication.count({
      where: { teamPostId: post.id, status: "ACCEPTED" },
    });
    if (acceptedCount >= TEAM_SIZE - 1) {
      return NextResponse.json({ error: "Takim dolu." }, { status: 400 });
    }

    const existing = await prisma.teamApplication.findUnique({
      where: { teamPostId_applicantId: { teamPostId: post.id, applicantId: user.id } },
      select: { id: true, status: true },
    });

    if (existing && (existing.status === "PENDING" || existing.status === "ACCEPTED")) {
      return NextResponse.json({ error: "Bu ilana zaten basvurdun." }, { status: 400 });
    }

    const application = existing
      ? await prisma.teamApplication.update({
          where: { id: existing.id },
          data: {
            desiredRole,
            playerInfo,
            discord,
            status: "PENDING",
          },
        })
      : await prisma.teamApplication.create({
          data: {
            teamPostId: post.id,
            applicantId: user.id,
            desiredRole,
            playerInfo,
            discord,
          },
        });

    return NextResponse.json(application);
  } catch (error) {
    console.error("[TEAMUP_APPLY_POST_ERROR]", error);
    return NextResponse.json({ error: "Basvuru gonderilemedi. Lutfen tekrar dene." }, { status: 500 });
  }
}

type DecisionResult =
  | { status: "SUCCESS" }
  | { status: "NOT_FOUND" }
  | { status: "FORBIDDEN" }
  | { status: "INACTIVE_POST" }
  | { status: "TEAM_FULL" };

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const body = await request.json();
    const applicationId = typeof body?.applicationId === "string" ? body.applicationId.trim() : "";
    const action = typeof body?.action === "string" ? body.action.trim().toUpperCase() : "";
    if (!applicationId || (action !== "ACCEPT" && action !== "REJECT")) {
      return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
    }

    const result = await runSerializableWithRetry<DecisionResult>(() =>
      prisma.$transaction(
        async (tx) => {
          const application = await tx.teamApplication.findUnique({
            where: { id: applicationId },
            select: {
              id: true,
              teamPostId: true,
              status: true,
              teamPost: {
                select: {
                  userId: true,
                  isActive: true,
                },
              },
            },
          });

          if (!application) return { status: "NOT_FOUND" };
          if (application.teamPost.userId !== user.id) return { status: "FORBIDDEN" };
          if (!application.teamPost.isActive) return { status: "INACTIVE_POST" };

          if (action === "ACCEPT") {
            if (application.status !== "ACCEPTED") {
              const acceptedCount = await tx.teamApplication.count({
                where: { teamPostId: application.teamPostId, status: "ACCEPTED" },
              });

              if (acceptedCount >= TEAM_SIZE - 1) return { status: "TEAM_FULL" };

              await tx.teamApplication.update({
                where: { id: application.id },
                data: { status: "ACCEPTED" },
              });
            }

            return { status: "SUCCESS" };
          }

          await tx.teamApplication.update({
            where: { id: application.id },
            data: { status: "REJECTED" },
          });

          return { status: "SUCCESS" };
        },
        { isolationLevel: "Serializable" },
      ),
    );

    if (result.status === "NOT_FOUND") {
      return NextResponse.json({ error: "Basvuru bulunamadi." }, { status: 404 });
    }
    if (result.status === "FORBIDDEN") {
      return NextResponse.json({ error: "Bu islem icin yetkin yok." }, { status: 403 });
    }
    if (result.status === "INACTIVE_POST") {
      return NextResponse.json({ error: "Ilan aktif degil." }, { status: 400 });
    }
    if (result.status === "TEAM_FULL") {
      return NextResponse.json({ error: "Takim dolu. Yeni kabul yapilamaz." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEAMUP_APPLY_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Basvuru guncellenemedi." }, { status: 500 });
  }
}
