import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/user-sync";

const PROFILE_VOTE_VALUES = new Set(["LIKE", "DISLIKE"]);

type ProfileVoteResponse = {
  likes: number;
  dislikes: number;
  myVote: "LIKE" | "DISLIKE" | null;
  likeVoters: VoteUserPreview[];
  dislikeVoters: VoteUserPreview[];
};

type VoteUserPreview = {
  id: string;
  username: string | null;
  imageUrl: string | null;
  selectedFrame: string | null;
};

type ProfileVoteDelegate = {
  count: (args: unknown) => Promise<number>;
  findUnique: (args: unknown) => Promise<{ value: "LIKE" | "DISLIKE" } | null>;
  findMany: (args: unknown) => Promise<Array<{ voter: VoteUserPreview }>>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

function getProfileVoteDelegate(): ProfileVoteDelegate | null {
  const delegate = (prisma as unknown as { profileVote?: ProfileVoteDelegate }).profileVote;
  return delegate ?? null;
}

async function readVoteSummary(targetUserId: string, viewerId: string): Promise<ProfileVoteResponse> {
  const profileVote = getProfileVoteDelegate();
  if (!profileVote) {
    return {
      likes: 0,
      dislikes: 0,
      myVote: null,
      likeVoters: [],
      dislikeVoters: [],
    };
  }

  const [likes, dislikes, vote, likeRows, dislikeRows] = await Promise.all([
    profileVote.count({
      where: { targetUserId, value: "LIKE" },
    }),
    profileVote.count({
      where: { targetUserId, value: "DISLIKE" },
    }),
    profileVote.findUnique({
      where: {
        voterId_targetUserId: {
          voterId: viewerId,
          targetUserId,
        },
      },
      select: { value: true },
    }),
    profileVote.findMany({
      where: { targetUserId, value: "LIKE", voter: { isBanned: false } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        voter: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            selectedFrame: true,
          },
        },
      },
    }),
    profileVote.findMany({
      where: { targetUserId, value: "DISLIKE", voter: { isBanned: false } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        voter: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            selectedFrame: true,
          },
        },
      },
    }),
  ]);

  return {
    likes,
    dislikes,
    myVote: vote?.value ?? null,
    likeVoters: likeRows.map((row) => row.voter),
    dislikeVoters: dislikeRows.map((row) => row.voter),
  };
}

async function ensureTargetUser(targetUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, isBanned: true },
  });
  if (!user || user.isBanned) return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = (searchParams.get("targetUserId") || "").trim();
    if (!targetUserId) {
      return NextResponse.json({ error: "Hedef kullanici gerekli." }, { status: 400 });
    }

    const targetUser = await ensureTargetUser(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Profil bulunamadi." }, { status: 404 });
    }

    const summary = await readVoteSummary(targetUserId, clerkUser.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[PROFILE_VOTE_GET_ERROR]", error);
    return NextResponse.json({ error: "Oy bilgileri yuklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const voter = await syncUserFromClerk(clerkUser);
    if (voter.isBanned) {
      return NextResponse.json({ error: "Banli hesap oy kullanamaz." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId.trim() : "";
    const value = typeof body?.value === "string" ? body.value.trim().toUpperCase() : "";

    if (!targetUserId || !PROFILE_VOTE_VALUES.has(value)) {
      return NextResponse.json({ error: "Gecersiz oy istegi." }, { status: 400 });
    }
    if (targetUserId === voter.id) {
      return NextResponse.json({ error: "Kendi profiline oy veremezsin." }, { status: 400 });
    }

    const targetUser = await ensureTargetUser(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Profil bulunamadi." }, { status: 404 });
    }

    const profileVote = getProfileVoteDelegate();
    if (!profileVote) {
      return NextResponse.json(
        { error: "Oylama sistemi hazir degil. Sunucu guncelleniyor." },
        { status: 503 },
      );
    }

    const voteValue = value as "LIKE" | "DISLIKE";
    const voteKey = {
      voterId_targetUserId: {
        voterId: voter.id,
        targetUserId,
      },
    };

    const existingVote = await profileVote.findUnique({
      where: voteKey,
      select: { value: true },
    });

    try {
      if (!existingVote) {
        await profileVote.create({
          data: {
            voterId: voter.id,
            targetUserId,
            value: voteValue,
          },
        });
      } else if (existingVote.value === voteValue) {
        await profileVote.delete({
          where: voteKey,
        });
      } else {
        await profileVote.update({
          where: voteKey,
          data: { value: voteValue },
        });
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2025")
      ) {
        const summary = await readVoteSummary(targetUserId, voter.id);
        return NextResponse.json({ success: true, ...summary });
      }
      throw error;
    }

    const summary = await readVoteSummary(targetUserId, voter.id);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("[PROFILE_VOTE_POST_ERROR]", error);
    return NextResponse.json({ error: "Oy kaydedilemedi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Giris gerekli." }, { status: 401 });
    }

    const voter = await syncUserFromClerk(clerkUser);
    if (voter.isBanned) {
      return NextResponse.json({ error: "Banli hesap oy islemi yapamaz." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId.trim() : "";
    if (!targetUserId) {
      return NextResponse.json({ error: "Hedef kullanici gerekli." }, { status: 400 });
    }
    if (targetUserId === voter.id) {
      return NextResponse.json({ error: "Kendi profiline oy veremezsin." }, { status: 400 });
    }

    const targetUser = await ensureTargetUser(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: "Profil bulunamadi." }, { status: 404 });
    }

    const profileVote = getProfileVoteDelegate();
    if (!profileVote) {
      return NextResponse.json(
        { error: "Oylama sistemi hazir degil. Sunucu guncelleniyor." },
        { status: 503 },
      );
    }

    try {
      await profileVote.delete({
        where: {
          voterId_targetUserId: {
            voterId: voter.id,
            targetUserId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        const summary = await readVoteSummary(targetUserId, voter.id);
        return NextResponse.json(
          {
            error: "Geri cekilecek aktif bir oyun yok.",
            ...summary,
          },
          { status: 404 },
        );
      }
      throw error;
    }

    const summary = await readVoteSummary(targetUserId, voter.id);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("[PROFILE_VOTE_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Oy geri cekilemedi." }, { status: 500 });
  }
}
