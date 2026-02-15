import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import ProfileClient from "@/components/ProfileClient";
import { prisma } from "@/lib/prisma";
import { syncUserFromClerk } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

type ProfilPageProps = {
  searchParams: Promise<{
    userId?: string;
  }>;
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
};

function getProfileVoteDelegate(): ProfileVoteDelegate | null {
  const delegate = (prisma as unknown as { profileVote?: ProfileVoteDelegate }).profileVote;
  return delegate ?? null;
}

async function getProfileVotes(targetUserId: string, viewerId: string) {
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

export default async function ProfilPage({ searchParams }: ProfilPageProps) {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    redirect("/sign-in");
  }

  const viewerUser = await syncUserFromClerk(clerkUser);
  const params = await searchParams;
  const targetUserId = (params.userId || "").trim();

  if (!targetUserId || targetUserId === userId) {
    const votes = await getProfileVotes(viewerUser.id, userId);
    return (
      <ProfileClient
        user={viewerUser}
        canEdit
        profileVotes={{
          ...votes,
          canVote: false,
          targetUserId: viewerUser.id,
        }}
      />
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      username: true,
      imageUrl: true,
      currentPoints: true,
      streak: true,
      bio: true,
      mainRole: true,
      favoriteChamp: true,
      rankGoal: true,
      socialDiscord: true,
      selectedFrame: true,
      ownedFrames: true,
      createdAt: true,
      isBanned: true,
    },
  });

  if (!targetUser || targetUser.isBanned) {
    notFound();
  }

  const votes = await getProfileVotes(targetUser.id, userId);
  return (
    <ProfileClient
      user={targetUser}
      canEdit={false}
      profileVotes={{
        ...votes,
        canVote: true,
        targetUserId: targetUser.id,
      }}
    />
  );
}
