import { prisma } from "@/lib/prisma";

export type ClerkSyncUser = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  emailAddresses: Array<{ emailAddress: string }>;
};

type SyncUserOptions = {
  createBonusPoints?: number;
};

function toEmail(user: ClerkSyncUser) {
  return user.emailAddresses[0]?.emailAddress?.trim() || "";
}

function toUsername(user: ClerkSyncUser) {
  const email = toEmail(user);
  const emailPrefix = email ? email.split("@")[0] : "";
  return user.username || user.firstName || emailPrefix || "Oyuncu";
}

export async function syncUserFromClerk(clerkUser: ClerkSyncUser, options: SyncUserOptions = {}) {
  const createBonusPoints = Math.max(0, options.createBonusPoints ?? 0);

  return prisma.user.upsert({
    where: { id: clerkUser.id },
    update: {
      email: toEmail(clerkUser),
      username: toUsername(clerkUser),
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      lastLoginDate: new Date(),
    },
    create: {
      id: clerkUser.id,
      email: toEmail(clerkUser),
      username: toUsername(clerkUser),
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      currentPoints: createBonusPoints,
      totalEarned: createBonusPoints,
      streak: 0,
      lastLoginDate: new Date(),
    },
  });
}
