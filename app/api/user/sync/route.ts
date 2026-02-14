import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { resolveStaffRole } from "@/lib/admin-auth-server";
import { syncUserFromClerk } from "@/lib/user-sync";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Giris yapilmamis" }, { status: 401 });

    const userId = user.id;
    const staffRole = await resolveStaffRole(userId);
    const dbUser = await syncUserFromClerk(user, { createBonusPoints: 10 });

    if (dbUser.isBanned) {
      return NextResponse.json({ banned: true, points: 0, staffRole });
    }

    return NextResponse.json({
      success: true,
      points: dbUser.currentPoints,
      streak: dbUser.streak,
      lastClaimDate: dbUser.lastClaimDate,
      isBanned: dbUser.isBanned,
      staffRole,
    });
  } catch (error) {
    console.error("[USER_SYNC_ERROR]", error);
    return NextResponse.json({ error: "Sunucu hatasi" }, { status: 500 });
  }
}
