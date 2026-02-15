import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/user-sync";

const TEAM_SIZE = 5;
const POST_RATE_WINDOW_MS = 15 * 60 * 1000;
const POST_RATE_MAX = 4;
const VALID_ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPP", "FILL"] as const;
type Role = (typeof VALID_ROLES)[number];

function sanitizeRoles(input: unknown): Role[] {
  if (!Array.isArray(input)) return [];
  const picked = input
    .map((r) => (typeof r === "string" ? r.toUpperCase().trim() : ""))
    .filter((r): r is Role => VALID_ROLES.includes(r as Role));
  return [...new Set(picked)];
}

export async function GET(request: Request) {
  try {
    const signedUser = await currentUser();
    const signedUserId = signedUser?.id ?? null;

    const { searchParams } = new URL(request.url);
    const roleParam = (searchParams.get("role") || "").toUpperCase().trim();
    const role = VALID_ROLES.includes(roleParam as Role) ? (roleParam as Role) : null;

    const where = role ? { isActive: true, rolesNeeded: { has: role } } : { isActive: true };

    const posts = await prisma.teamPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            mainRole: true,
            isBanned: true,
          },
        },
      },
    });

    const filteredPosts = posts.filter((p) => !p.user.isBanned);
    const postIds = filteredPosts.map((p) => p.id);

    const appByPost = new Map<
      string,
      {
        applicationCount: number;
        acceptedCount: number;
        hasApplied: boolean;
        myApplicationStatus: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
      }
    >();

    if (postIds.length > 0) {
      const apps = await prisma.teamApplication.findMany({
        where: { teamPostId: { in: postIds } },
        select: { teamPostId: true, applicantId: true, status: true },
      });

      for (const app of apps) {
        const prev = appByPost.get(app.teamPostId) || {
          applicationCount: 0,
          acceptedCount: 0,
          hasApplied: false,
          myApplicationStatus: "NONE" as const,
        };

        prev.applicationCount += 1;
        if (app.status === "ACCEPTED") prev.acceptedCount += 1;

        if (
          signedUserId &&
          app.applicantId === signedUserId &&
          (app.status === "PENDING" || app.status === "ACCEPTED")
        ) {
          prev.hasApplied = true;
        }

        if (
          signedUserId &&
          app.applicantId === signedUserId &&
          (app.status === "PENDING" || app.status === "ACCEPTED" || app.status === "REJECTED")
        ) {
          prev.myApplicationStatus = app.status;
        }

        appByPost.set(app.teamPostId, prev);
      }
    }

    const safePosts = filteredPosts.map((post) => {
      const counts = appByPost.get(post.id) || {
        applicationCount: 0,
        acceptedCount: 0,
        hasApplied: false,
        myApplicationStatus: "NONE" as const,
      };

      const filledSlots = Math.min(TEAM_SIZE, 1 + counts.acceptedCount);

      return {
        id: post.id,
        title: post.title,
        description: post.description,
        rolesNeeded: post.rolesNeeded,
        rankRange: post.rankRange,
        server: post.server,
        maxPlayers: TEAM_SIZE,
        isActive: post.isActive,
        userId: post.userId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        applicationCount: counts.applicationCount,
        acceptedCount: counts.acceptedCount,
        filledSlots,
        hasApplied: counts.hasApplied,
        myApplicationStatus: counts.myApplicationStatus,
        user: {
          id: post.user.id,
          username: post.user.username,
          imageUrl: post.user.imageUrl,
          mainRole: post.user.mainRole,
        },
      };
    });

    return NextResponse.json(safePosts);
  } catch (error) {
    console.error("[TEAMUP_GET_ERROR]", error);
    return NextResponse.json({ error: "İlanlar yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const dbUser = await syncUserFromClerk(clerkUser);
    if (dbUser.isBanned) {
      return NextResponse.json({ error: "Banlı hesap ilan açamaz." }, { status: 403 });
    }

    const activeCount = await prisma.teamPost.count({
      where: { userId: clerkUser.id, isActive: true },
    });

    if (activeCount >= 2) {
      return NextResponse.json({ error: "En fazla 2 aktif ilanın olabilir." }, { status: 429 });
    }

    const recentPostCreates = await prisma.teamPost.count({
      where: {
        userId: clerkUser.id,
        createdAt: { gte: new Date(Date.now() - POST_RATE_WINDOW_MS) },
      },
    });

    if (recentPostCreates >= POST_RATE_MAX) {
      return NextResponse.json(
        { error: "Çok hızlı ilan açıyorsun. Biraz bekleyip tekrar dene." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.floor(POST_RATE_WINDOW_MS / 1000)) },
        },
      );
    }

    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const rankRange = typeof body?.rankRange === "string" ? body.rankRange.trim() : "Fark etmez";
    const server = typeof body?.server === "string" ? body.server.trim() : "TR";
    const rolesNeeded = sanitizeRoles(body?.rolesNeeded);

    if (!title || title.length > 80) {
      return NextResponse.json({ error: "Başlık 1-80 karakter olmalı." }, { status: 400 });
    }
    if (!description || description.length > 800) {
      return NextResponse.json({ error: "Açıklama 1-800 karakter olmalı." }, { status: 400 });
    }
    if (rolesNeeded.length === 0) {
      return NextResponse.json({ error: "En az bir rol seç." }, { status: 400 });
    }

    const created = await prisma.teamPost.create({
      data: {
        userId: clerkUser.id,
        title,
        description,
        rolesNeeded,
        rankRange: rankRange || "Fark etmez",
        server: server || "TR",
        maxPlayers: TEAM_SIZE,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("[TEAMUP_POST_ERROR]", error);
    return NextResponse.json({ error: "İlan oluşturulamadı. Lütfen tekrar dene." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = (searchParams.get("id") || "").trim();
    if (!postId) {
      return NextResponse.json({ error: "İlan ID gerekli." }, { status: 400 });
    }

    const post = await prisma.teamPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, isActive: true },
    });

    if (!post) {
      return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
    }
    if (post.userId !== user.id) {
      return NextResponse.json({ error: "Bu ilana yetkin yok." }, { status: 403 });
    }
    if (!post.isActive) {
      return NextResponse.json({ success: true });
    }

    await prisma.teamPost.update({
      where: { id: postId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEAMUP_DELETE_ERROR]", error);
    return NextResponse.json({ error: "İlan kapatılamadı." }, { status: 500 });
  }
}


