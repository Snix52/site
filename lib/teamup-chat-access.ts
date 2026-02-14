import { prisma } from "@/lib/prisma";

type AccessDeniedReason = "NOT_FOUND" | "BANNED" | "NOT_ALLOWED";

export type TeamupChatAccessResult =
  | {
      allowed: true;
      isOwner: boolean;
      postId: string;
      postOwnerId: string;
    }
  | {
      allowed: false;
      reason: AccessDeniedReason;
    };

export async function resolveTeamupChatAccess(
  userId: string,
  postId: string,
): Promise<TeamupChatAccessResult> {
  const [user, post] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    }),
    prisma.teamPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    }),
  ]);

  if (!post) {
    return { allowed: false, reason: "NOT_FOUND" };
  }

  if (!user || user.isBanned) {
    return { allowed: false, reason: "BANNED" };
  }

  if (post.userId === userId) {
    return {
      allowed: true,
      isOwner: true,
      postId: post.id,
      postOwnerId: post.userId,
    };
  }

  const acceptedApplication = await prisma.teamApplication.findFirst({
    where: {
      teamPostId: post.id,
      applicantId: userId,
      status: "ACCEPTED",
    },
    select: { id: true },
  });

  if (!acceptedApplication) {
    return { allowed: false, reason: "NOT_ALLOWED" };
  }

  return {
    allowed: true,
    isOwner: false,
    postId: post.id,
    postOwnerId: post.userId,
  };
}
