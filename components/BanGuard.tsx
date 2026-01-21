"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { Ban, Loader2 } from "lucide-react";

export default function BanGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [isBanned, setIsBanned] = useState(false);
  const [checking, setChecking] = useState(true);
  
  // 🛡️ KRİTİK KİLİT: Sayfa açık kaldığı sürece bu kontrolü SADECE 1 KERE yapar.
  const hasVerified = useRef(false);

  useEffect(() => {
    // Clerk yüklenmediyse veya zaten kontrol edildiyse dur.
    if (!isLoaded || hasVerified.current) return;

    if (isSignedIn) {
      hasVerified.current = true; // İsteği atmadan kilidi vuruyoruz.

      fetch('/api/user/sync', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.banned) {
            setIsBanned(true);
          }
        })
        .catch(err => {
          console.error("Ban kontrol hatası:", err);
          hasVerified.current = false; // Hata olursa tekrar denesin diye kilidi açarız.
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isSignedIn, isLoaded]);

  // AŞAMA 1: YÜKLENİYOR (Şık bir neon loader)
  if (checking) {
    return (
      <div className="min-h-screen bg-[#050A14] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#00FFFF] animate-spin" />
        <p className="text-[#00FFFF] font-black text-xs uppercase tracking-[0.3em] animate-pulse">
          Sistemler Kontrol Ediliyor...
        </p>
      </div>
    );
  }

  // AŞAMA 2: BANLI (Kırmızı Duvar)
  if (isBanned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-10 font-sans h-screen w-screen">
        <div className="animate-bounce">
            <Ban className="w-24 h-24 text-red-600 mb-6 mx-auto drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
        </div>
        <h1 className="text-5xl font-black text-red-600 mb-4 uppercase tracking-tighter">
            ERİŞİM ENGELLENDİ
        </h1>
        <p className="text-gray-500 text-sm max-w-md mb-10 font-bold uppercase tracking-widest">
           Topluluk kurallarını ihlal ettiğin için bu hesaba kilit vurulmuştur.
        </p>
        <div className="p-1 bg-red-600 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)]">
            <UserButton afterSignOutUrl="/"/>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}