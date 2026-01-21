"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Ban } from "lucide-react";

export default function BanGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const [isBanned, setIsBanned] = useState(false);
  const [checking, setChecking] = useState(true); // Başlangıçta "Kontrol Ediyorum" modundayız

  useEffect(() => {
    // 1. Clerk yüklenmediyse bekle
    if (!isLoaded) return;

    // 2. Giriş yapmışsa API'ye sor
    if (isSignedIn) {
      fetch('/api/user/sync', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.banned) {
            setIsBanned(true); // Adam banlı!
          }
        })
        .finally(() => setChecking(false)); // Kontrol bitti, karar verelim
    } else {
      setChecking(false); // Giriş yapmamışsa ban kontrolüne gerek yok
    }
  }, [isSignedIn, isLoaded]);

  // AŞAMA 1: YÜKLENİYOR (Siyah Ekran)
  // Kontrol bitmeden siteyi ASLA gösterme.
  if (checking) {
    return (
      <div className="min-h-screen bg-[#050A14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFFF]"></div>
      </div>
    );
  }

  // AŞAMA 2: BANLI (Kırmızı Duvar)
  // Eğer banlıysa sadece bunu göster. {children} yani siteyi HİÇ RENDER ETME.
  if (isBanned) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center p-10 font-sans h-screen w-screen">
        <div className="animate-pulse">
            <Ban className="w-32 h-32 text-red-600 mb-6 mx-auto" />
        </div>
        <h1 className="text-6xl font-black text-red-600 mb-4 uppercase tracking-tighter glitch-effect">
            YASAKLANDINIZ
        </h1>
        <p className="text-gray-400 text-lg max-w-md mb-8">
           Erişim engellendi.
        </p>
        <div className="scale-150 border-2 border-red-600 rounded-full">
            <UserButton afterSignOutUrl="/"/>
        </div>
      </div>
    );
  }

  // AŞAMA 3: TEMİZ (Siteyi Aç)
  // Sadece temizse site içeriğini (children) göster.
  return <>{children}</>;
}