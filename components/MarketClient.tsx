"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Check, Loader2, ShoppingBag } from 'lucide-react';
import AvatarFrame, { FRAMES } from './AvatarFrame'; 

const PRICES: Record<string, number> = {
  BASIC: 0,
  IONIA: 1500,
  HEXTECH: 2000,
  DARKIN: 3500,
  SHADOW: 3500,
  VOID: 4000,
  FRELJORD: 4000,
  CHALLENGER: 10000,
  SHURIMA: 15000
};

interface UserData {
  id: string;
  currentPoints: number;
  ownedFrames: string[];
  imageUrl: string | null;
}

export default function MarketClient({ user }: { user: UserData }) {
  const router = useRouter();
  const [currentPoints, setCurrentPoints] = useState(user.currentPoints);
  const [ownedFrames, setOwnedFrames] = useState<string[]>(user.ownedFrames || ["BASIC"]);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const handleBuy = async (frameId: string) => {
    if (buyingId) return;
    setBuyingId(frameId);

    try {
      const res = await fetch("/api/market/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, frameId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Satın alma başarısız!");
        return;
      }

      setCurrentPoints(data.newPoints);
      setOwnedFrames(data.ownedFrames);
      
      window.dispatchEvent(new Event('user_updated'));

      router.refresh();
    } catch (error) {
      alert("Bir hata oluştu.");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14] text-white pt-32 pb-20 px-4 font-sans relative overflow-hidden">
      
      {/* BAŞLIK */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div>
            {/* 🛠️ ".GG" KALDIRILDI */}
            <h1 className="text-5xl font-black italic tracking-tighter text-white flex items-center gap-3 drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                <ShoppingBag className="w-10 h-10 text-[#00FFFF]" /> 
                MARKET
            </h1>
            <p className="text-cyan-200/60 mt-2 font-bold tracking-widest text-sm uppercase">
                SP'lerini harca, profiline tarz kat.
            </p>
        </div>

        {/* 💎 BAKİYE KUTUSU (Animasyonlu SP Rozeti) */}
        <div className="bg-[#00FFFF]/5 border border-[#00FFFF]/20 px-8 py-4 rounded-2xl flex items-center gap-6 shadow-[0_0_30px_rgba(0,255,255,0.1)] backdrop-blur-md group hover:border-[#00FFFF]/40 transition-all">
            
            {/* ✨ ANIMASYONLU 3D LOGO */}
            <div className="relative w-16 h-16 shrink-0" style={{ perspective: '1200px' }}>
                <div className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite]">
                     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]">
                        <defs>
                           <linearGradient id="market-frame-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#E0FFFF" />
                              <stop offset="50%" stopColor="#00FFFF" />
                              <stop offset="100%" stopColor="#0088FF" />
                           </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#market-frame-gradient)" strokeWidth="4" strokeDasharray="140 20" />
                     </svg>
                </div>

                <div className="absolute inset-0 w-full h-full flex items-center justify-center animate-pulse">
                     <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]">
                        <defs>
                           <linearGradient id="market-crystal-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#FFFFFF" />
                              <stop offset="100%" stopColor="#00FFFF" />
                           </linearGradient>
                           <pattern id="market-hex" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                              <path d="M5 0 L10 2.5 V7.5 L5 10 L0 7.5 V2.5 Z" fill="none" stroke="#00FFFF" strokeWidth="0.5" opacity="0.3"/>
                           </pattern>
                        </defs>
                        <circle cx="50" cy="50" r="38" fill="#050a14" stroke="#00FFFF" strokeWidth="0.5" opacity="0.9" />
                        <circle cx="50" cy="50" r="38" fill="url(#market-hex)" />
                        <g transform="translate(14, 17) scale(0.6)">
                            <path d="M85 20 H45 L35 30 V45 L45 50 H75 L85 60 V80 L75 90 H35" 
                                  stroke="url(#market-crystal-gradient)" 
                                  strokeWidth="8" 
                                  strokeLinecap="square" 
                                  strokeLinejoin="bevel" 
                                  fill="none" 
                                  className="drop-shadow-[0_0_5px_#00FFFF]" />
                        </g>
                     </svg>
                </div>
            </div>
            
            <div>
                <p className="text-[10px] text-[#00FFFF] uppercase font-bold tracking-[0.2em] mb-1 opacity-80">Mevcut Bakiyen</p>
                <p className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] tracking-wide">
                    {currentPoints} <span className="text-lg text-cyan-500/80 font-bold">SP</span>
                </p>
            </div>
        </div>
      </div>

      {/* ÜRÜN LİSTESİ */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
        {Object.keys(FRAMES).map((frame) => {
            const isOwned = ownedFrames.includes(frame);
            const price = PRICES[frame] || 0;
            const canAfford = currentPoints >= price;

            return (
                <div key={frame} className={`relative p-6 pt-8 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-4 group ${
                    isOwned 
                    ? "bg-emerald-900/10 border-emerald-500/20 opacity-60 hover:opacity-100 grayscale hover:grayscale-0" 
                    : "bg-black/40 border-white/5 hover:border-[#00FFFF]/50 hover:bg-[#00FFFF]/5 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)]"
                }`}>
                    
                    <div className="relative w-full flex justify-center mb-2 transition-transform duration-300 group-hover:scale-110">
                        <AvatarFrame 
                            src={user.imageUrl || ""} 
                            frameType={frame} 
                            className="w-28 h-28" 
                        />
                    </div>
                    
                    <div className="text-center w-full z-10">
                        <h3 className="text-lg font-black text-white tracking-widest italic uppercase">{frame}</h3>
                        <div className="w-8 h-1 bg-[#00FFFF]/30 mx-auto rounded-full mt-2 group-hover:bg-[#00FFFF] group-hover:shadow-[0_0_10px_rgba(0,255,255,0.8)] transition-all"></div>
                    </div>

                    <div className="w-full mt-auto pt-4">
                        {isOwned ? (
                            <button disabled className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-default border border-emerald-500/20">
                                <Check className="w-4 h-4"/> Envanterde
                            </button>
                        ) : (
                            <button
                                onClick={() => handleBuy(frame)}
                                disabled={!canAfford || buyingId === frame}
                                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                                    canAfford 
                                    ? "bg-[#00FFFF] hover:bg-white text-black shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.8)]" 
                                    : "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                                }`}
                            >
                                {buyingId === frame ? (
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                ) : (
                                    <><Lock className="w-3 h-3"/> {price === 0 ? "Ücretsiz" : `${price} SP`}</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
}