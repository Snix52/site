"use client";

import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Ban, Loader2 } from "lucide-react";

export default function BanGuard({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [isBanned, setIsBanned] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  const userId = isSignedIn ? user?.id ?? null : null;
  const checking = Boolean(userId) && checkedUserId !== userId;

  useEffect(() => {
    if (!isLoaded || !userId) return;

    let cancelled = false;

    fetch("/api/user/sync", { method: "POST" })
      .then((res) => res.json())
      .then((data: { banned?: boolean }) => {
        if (cancelled) return;
        setIsBanned(Boolean(data?.banned));
        setCheckedUserId(userId);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Ban kontrol hatasi:", error);
        setIsBanned(false);
        setCheckedUserId(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen bg-[#050A14] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#00FFFF] animate-spin" />
        <p className="text-[#00FFFF] font-black text-xs uppercase tracking-[0.3em] animate-pulse">
          Sistemler Kontrol Ediliyor...
        </p>
      </div>
    );
  }

  if (userId && isBanned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-10 font-sans h-screen w-screen">
        <div className="animate-bounce">
          <Ban className="w-24 h-24 text-red-600 mb-6 mx-auto drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
        </div>
        <h1 className="text-5xl font-black text-red-600 mb-4 uppercase tracking-tighter">
          ERISIM ENGELLENDI
        </h1>
        <p className="text-gray-500 text-sm max-w-md mb-10 font-bold uppercase tracking-widest">
          Topluluk kurallarini ihlal ettigin icin bu hesaba kilit vurulmustur.
        </p>
        <div className="p-1 bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)]">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
