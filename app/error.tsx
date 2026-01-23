"use client"; // Hata bileşenleri Client olmak zorunda

import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hatayı loglama servisine gönderebilirsin (Sentry vs.)
    console.error("🔥 KRİTİK HATA:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050A14] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center gap-4 max-w-md">
        <ShieldAlert className="w-16 h-16 text-red-500 animate-pulse" />
        <h2 className="text-2xl font-black text-white italic">SİSTEM HATASI!</h2>
        <p className="text-gray-400 text-sm">
          Beklenmedik bir sorun oluştu. Endişelenme, bu seninle alakalı değil.
        </p>
        
        <button
          onClick={() => reset()}
          className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  );
}