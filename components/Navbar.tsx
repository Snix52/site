"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SnixLogo } from '@/components/Icons'; 
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { ShieldAlert } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SpBadge from './SpBadge';

export default function Navbar() {
  const { user, isSignedIn, isLoaded } = useUser(); // isLoaded ekledik
  const [points, setPoints] = useState(0);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  
  // ⚡ REF KONTROLÜ: Sync işleminin bu oturumda sadece 1 kez çalışmasını garanti eder
  const hasSynced = useRef(false);

  const ADMIN_ID = "user_38IQNX84WzWPGgn1wdzcOWogLaN";
  const isAdmin = user?.id === ADMIN_ID;

  useEffect(() => {
    // 1. Clerk henüz yüklenmediyse veya kullanıcı giriş yapmadıysa çık
    // 2. Eğer bu oturumda (sayfa yenilenene kadar) sync yapıldıysa çık
    if (!isLoaded || !isSignedIn || hasSynced.current) return;

    const syncUser = async () => {
      try {
        hasSynced.current = true; // Daha fetch bitmeden kilidi vuruyoruz ki döngüye girmesin
        const res = await fetch('/api/user/sync', { method: 'POST' });
        const data = await res.json();
        
        if (data.points !== undefined) setPoints(data.points);
        if (data.rewardGiven) {
          setShowRewardAnimation(true);
          setTimeout(() => setShowRewardAnimation(false), 5000);
        }
      } catch (err) {
        console.error("Puan servisi hatası:", err);
        hasSynced.current = false; // Hata alırsak kilidi açalım ki tekrar denesin
      }
    };

    syncUser();
  }, [isSignedIn, isLoaded]); // isLoaded bağımlılığını ekledik

  return (
    <nav className="fixed top-0 left-0 z-[100] flex justify-between items-center px-8 py-6 w-full bg-[#050A14]/85 backdrop-blur-md border-b border-white/5 shadow-2xl">
        
        <div className="flex items-center gap-3 group cursor-pointer">
           <Link href="/" className="flex items-center gap-3">
            <SnixLogo className="w-[50px] h-[50px] drop-shadow-[0_0_10px_rgba(0,255,255,0.6)] transition-transform group-hover:scale-110" />
            <span className="text-[18px] font-black italic tracking-tighter text-white leading-none">
                SNIX<span className="text-[#00FFFF]">.GG</span>
            </span>
           </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-[#00FFFF] transition-colors uppercase tracking-[0.2em]">Ana Sayfa</Link>
          <Link href="/hakkimizda" className="text-sm font-bold text-slate-400 hover:text-[#00FFFF] transition-colors uppercase tracking-[0.2em]">Hakkımızda</Link>
          <Link href="/rehberler" className="text-sm font-bold text-slate-400 hover:text-[#00FFFF] transition-colors uppercase tracking-[0.2em]">Rehberler</Link>
          
          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 text-sm font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-[0.2em] border border-red-500/20 px-3 py-1 rounded bg-red-500/10">
               <ShieldAlert size={16} /> ADMIN
            </Link>
          )}

          <div className="ml-4 border-l border-white/10 pl-6 flex items-center gap-4">
            <SignedOut>
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <button className="px-5 py-2 border border-slate-600 text-slate-300 font-bold text-xs uppercase tracking-widest rounded hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all">Giriş Yap</button>
                </Link>
                <Link href="/sign-up">
                  <button className="px-5 py-2 bg-[#00FFFF] text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)]">Kayıt Ol</button>
                </Link>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="mr-4 transform hover:scale-105 transition-transform duration-300">
                 <SpBadge points={points} showAnimation={showRewardAnimation} />
              </div>
              
              <div className="mx-2">
                 {/* ⚠️ NOT: Eğer hala kasıyorsa, NotificationBell'in içine bakmalısın */}
                 <NotificationBell />
              </div>

              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 border-2 border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.5)]"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>
  );
}