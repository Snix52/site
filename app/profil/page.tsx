import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";
import { syncUserFromClerk } from "@/lib/user-sync";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    redirect("/sign-in");
  }

  const dbUser = await syncUserFromClerk(clerkUser);

  return <ProfileClient user={dbUser} />;
}
