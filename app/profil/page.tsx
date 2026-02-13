import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  const primaryEmail = user.emailAddresses[0]?.emailAddress ?? null;
  const emailPrefix = primaryEmail ? primaryEmail.split("@")[0] : null;
  const displayName = user.username || user.firstName || emailPrefix || "Oyuncu";

  let dbUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: userId,
        email: primaryEmail,
        username: displayName,
        imageUrl: user.imageUrl,
      },
    });
  } else if (dbUser.username !== displayName) {
    await prisma.user.update({
      where: { id: userId },
      data: { username: displayName },
    });
    dbUser.username = displayName;
  }

  return <ProfileClient user={dbUser} />;
}
