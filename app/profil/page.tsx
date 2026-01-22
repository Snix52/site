import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Akıllı İsim Seçici: Username yoksa -> İsim -> O da yoksa -> Mailin başı
  const displayName = user.username 
    || user.firstName 
    || user.emailAddresses[0].emailAddress.split('@')[0];

  let dbUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: userId,
        email: user.emailAddresses[0].emailAddress,
        username: displayName, // Düzeltilen kısım burası
        imageUrl: user.imageUrl,
      },
    });
  } else {
    // Kullanıcı zaten varsa ve ismi boşsa güncelle
    if (dbUser.username !== displayName) {
       await prisma.user.update({
         where: { id: userId },
         data: { username: displayName }
       });
       dbUser.username = displayName;
    }
  }

  return (
    <ProfileClient user={dbUser} />
  );
}