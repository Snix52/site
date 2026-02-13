"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SnixLogo } from '@/components/Icons'; 
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { ShieldAlert, User, ShoppingBag } from 'lucide-react'; 
import NotificationBell from './NotificationBell';
import SpBadge from './SpBadge';
import DailyRewardModal from './DailyRewardModal';

export default function Navbar() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [points, setPoints] = useState(0);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  
  // Günlük Ödül State'leri
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [streak, setStreak] = useState(0); 
  const [lastClaim, setLastClaim] = useState<string | null>(null);

  const ADMIN_ID = "user_38IQNX84WzWPGgn1wdzcOWogLaN";
  const isAdmin = user?.id === ADMIN_ID;

  // YARDIMCI: Tarih formatını standartlaştırır
  const normalizeDate = (dateString: string | Date | null) => {
    if (!dateString) return null;
    return new Date(dateString).toDateString();
  };

  const today = new Date().toDateString();
  const isRewardAvailable = lastClaim !== today;

  // 🔄 VERİ GÜNCELLEME FONKSİYONU (Dışarıdan çağrılabilir hale getirdik)
  const syncUser = async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch('/api/user/sync', { method: 'POST' });
      const data = await res.json();
      
      if (data.points !== undefined) setPoints(data.points);
      if (data.rewardGiven) {
        setShowRewardAnimation(true);
        setTimeout(() => setShowRewardAnimation(false), 5000);
      }
      if (data.streak !== undefined) setStreak(data.streak);
      if (data.lastClaimDate) setLastClaim(normalizeDate(data.lastClaimDate));
    } catch (err) {
      console.error("Puan servisi hatası:", err);
    }
  };

  // 1. VERİTABANI SENKRONİZASYONU VE TELSİZ SİSTEMİ 📻
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // İlk açılışta veriyi çek
    syncUser();

    // 👂 Sinyal Dinleyici: "user_updated" olayını bekle
    const handleUpdateSignal = () => {
        console.log("📻 Navbar: Güncelleme sinyali alındı!");
        syncUser();
    };

    window.addEventListener('user_updated', handleUpdateSignal);

    // Temizlik (Component kapanırsa dinlemeyi bırak)
    return () => {
        window.removeEventListener('user_updated', handleUpdateSignal);
    };
  }, [isSignedIn, isLoaded]);

  // 2. ÖDÜL ALMA FONKSİYONU
  const handleDailyClaim = async () => {
    try {
      setLastClaim(today); 
      const res = await fetch('/api/user/claim', { method: 'POST' });
      
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        if (res.status === 400) return;
        if (res.status === 403 && payload?.message) {
          alert(payload.message);
        }
        setLastClaim(null); 
        return;
      }

      const data = await res.json();

      if (data.success) {
        setPoints(data.points);
        setStreak(data.streak);
        setLastClaim(normalizeDate(data.lastClaimDate));
        setShowRewardAnimation(true);
        setTimeout(() => setShowRewardAnimation(false), 5000);
        
        // 📢 Kendimiz de sinyal yayalım (Belki başka componentler dinliyordur)
        window.dispatchEvent(new Event('user_updated'));
      }
    } catch (error) {
      console.error("Bağlantı hatası:", error);
      setLastClaim(null);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 z-[100] flex justify-between items-center px-8 py-3 w-full 
                  bg-black/30 border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] 
                  transition-all duration-300 overflow-visible">
          
          <div className="flex items-center overflow-visible group">
             <Link href="/" className="relative flex items-center gap-2 overflow-visible">
              <div className="relative flex items-center justify-center w-16 h-16 -ml-4 overflow-visible">
                  <div className="absolute inset-0 bg-[#00FFFF]/10 blur-[20px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-150"></div>
                  <SnixLogo className="relative z-10 w-11 h-11 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-transform group-hover:scale-110 will-change-transform" />
              </div>
              <span className="text-xl font-black italic tracking-tighter text-white uppercase leading-none select-none">
                  SNIX<span className="text-[#00FFFF] group-hover:text-white transition-colors duration-300">.GG</span>
              </span>
             </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-[11px] font-black text-slate-400 hover:text-[#00FFFF] transition-all uppercase tracking-[0.2em]">Ana Sayfa</Link>
            <Link href="/hakkimizda" className="text-[11px] font-black text-slate-400 hover:text-[#00FFFF] transition-all uppercase tracking-[0.2em]">Hakkımızda</Link>
            <Link href="/rehberler" className="text-[11px] font-black text-slate-400 hover:text-[#00FFFF] transition-all uppercase tracking-[0.2em]">Rehberler</Link>
            
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black text-red-500 hover:text-white hover:bg-red-600 transition-all uppercase tracking-[0.2em] border border-red-500/30 px-3 py-1.5 rounded bg-red-500/5">
                 <ShieldAlert size={14} /> ADMIN PANELİ
              </Link>
            )}

            <div className="ml-4 border-l border-white/5 pl-8 flex items-center gap-5">
              <SignedOut>
                <div className="flex items-center gap-4">
                  <Link href="/sign-in">
                    <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Giriş</button>
                  </Link>
                  <Link href="/sign-up">
                    <button className="px-5 py-2 bg-[#00FFFF] text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-white transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)]">Kayıt Ol</button>
                  </Link>
                </div>
              </SignedOut>

              <SignedIn>
                <div 
                  className="relative transform hover:scale-105 transition-transform duration-300 cursor-pointer active:scale-95 group"
                  onClick={() => setIsDailyModalOpen(true)}
                >
                   <SpBadge points={points} showAnimation={showRewardAnimation} />
                   
                   {isRewardAvailable && (
                     <div className="absolute -bottom-2 left-1/2 -translate-x-2/3 flex items-center gap-1 animate-bounce">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFFF] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFFF]"></span>
                        </span>
                        <span className="text-[9px] font-black text-[#00FFFF] tracking-widest whitespace-nowrap drop-shadow-[0_0_5px_rgba(0,0,0,1)]">
                            GÜNLÜK ÖDÜL !
                        </span>
                     </div>
                   )}
                </div>

                <Link 
                   href="/market" 
                   className="flex items-center gap-2 px-3 py-1.5 ml-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 transition-all font-bold text-[10px] uppercase tracking-widest group"
                >
                   <ShoppingBag size={14} className="group-hover:animate-bounce" />
                   <span className="hidden lg:inline">Market</span>
                </Link>

                <Link 
                   href="/profil" 
                   className="flex items-center gap-2 px-3 py-1.5 ml-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all font-bold text-[10px] uppercase tracking-widest"
                >
                   <User size={14} />
                   <span className="hidden lg:inline">Profilim</span>
                </Link>
                
                <div className="mx-1"><NotificationBell /></div>
                <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 border border-white/10 hover:border-[#00FFFF] transition-all" } }} />
              </SignedIn>
            </div>
          </div>
        </nav>

        <DailyRewardModal 
          isOpen={isDailyModalOpen}
          onClose={() => setIsDailyModalOpen(false)}
          currentStreak={streak}
          lastClaimDate={lastClaim}
          onClaim={handleDailyClaim}
        />
    </>
  );
}
