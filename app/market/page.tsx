import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import MarketClient from "@/components/MarketClient";
import { syncUserFromClerk } from "@/lib/user-sync";

export default async function MarketPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await syncUserFromClerk(clerkUser);
  return <MarketClient user={user} />;
}
