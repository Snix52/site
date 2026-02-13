import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilPage() {
  try {
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
  } catch (error) {
    console.error("[PROFIL_PAGE_ERROR]", error);
    return (
      <div className="min-h-screen bg-[#050A14] text-slate-200 flex items-center justify-center px-4">
        <div className="max-w-lg w-full border border-red-500/30 bg-red-500/10 rounded-xl p-6 text-center">
          <h1 className="text-xl font-bold text-red-400 mb-2">Profil yuklenemedi</h1>
          <p className="text-sm text-slate-300">
            Gecici bir hata olustu. Lutfen sayfayi yenile ve tekrar dene.
          </p>
        </div>
      </div>
    );
  }
}
