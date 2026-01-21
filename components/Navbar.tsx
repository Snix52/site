"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SnixLogo } from '@/components/Icons'; 
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { ShieldAlert } from 'lucide-react';
import NotificationBell from './NotificationBell';
import SpBadge from './SpBadge';

export default function Navbar() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [points, setPoints] = useState(0);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  
  const hasSynced = useRef(false);

  const ADMIN_ID = "user_38IQNX84WzWPGgn1wdzcOWogLaN";
  const isAdmin = user?.id === ADMIN_ID;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || hasSynced.current) return;

    const syncUser = async () => {
      try {
        hasSynced.current = true;
        const res = await fetch('/api/user/sync', { method: 'POST' });
        const data = await res.json();
        
        if (data.points !== undefined) setPoints(data.points);
        if (data.rewardGiven) {
          setShowRewardAnimation(true);
          setTimeout(() => setShowRewardAnimation(false), 5000);
        }
      } catch (err) {
        console.error("Puan servisi hatası:", err);
        hasSynced.current = false;
      }
    };

    syncUser();
  }, [isSignedIn, isLoaded]);

  return (
    <nav className="fixed top-0 left-0 z-[100] flex justify-between items-center px-8 py-3 w-full 
                bg-black/30 
                border-b border-white/5 
                shadow-[0_4px_30px_rgba(0,0,0,0.2)] 
                transition-all duration-300 overflow-visible">
        {/* backdrop-blur kaldırıldı, arkaplan tamamen net. bg-black/30 ile koyuluk verildi. */}
        
        {/* --- LOGO ALANI --- */}
        <div className="flex items-center overflow-visible group">
           <Link href="/" className="relative flex items-center gap-2 overflow-visible">
            
            <div className="relative flex items-center justify-center w-16 h-16 -ml-4 overflow-visible">
                {/* Organik Arka Plan Glow */}
                <div className="absolute inset-0 bg-[#00FFFF]/10 blur-[20px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-150"></div>
                
                <SnixLogo className="relative z-10 w-11 h-11 drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-transform group-hover:scale-110 will-change-transform" />
            </div>

            <span className="text-xl font-black italic tracking-tighter text-white uppercase leading-none select-none">
                SNIX<span className="text-[#00FFFF] group-hover:text-white transition-colors duration-300">.GG</span>
            </span>
           </Link>
        </div>
        
        {/* --- MENÜ LİNKLERİ --- */}
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
              <div className="transform hover:scale-105 transition-transform duration-300">
                 <SpBadge points={points} showAnimation={showRewardAnimation} />
              </div>
              
              <div className="mx-1">
                 <NotificationBell />
              </div>

              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 border border-white/10 hover:border-[#00FFFF] transition-all"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>
  );
}