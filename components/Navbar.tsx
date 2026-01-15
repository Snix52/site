"use client";

import Link from 'next/link';
import { SnixLogo } from '@/components/Icons'; 
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="relative z-[60] flex justify-between items-center px-8 py-6 max-w-full w-full bg-[#050A14]/90 backdrop-blur-md border-b border-white/5 shadow-2xl">
      <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <SnixLogo className="w-[65px] h-[65px] drop-shadow-[0_0_10px_rgba(0,255,255,0.6)] transition-transform group-hover:scale-110" />
        <span className="text-[18px] font-black italic tracking-tighter text-white leading-none">
          SNIX<span className="text-[#00FFFF]">.GG</span>
        </span>
      </Link>
      
      <div className="hidden md:flex items-center gap-10">
        <Link href="/" className={`text-sm font-bold transition-colors uppercase tracking-[0.2em] ${pathname === '/' ? 'text-[#00FFFF]' : 'text-slate-400 hover:text-[#00FFFF]'}`}>
          Ana Sayfa
        </Link>
        <Link href="/rehberler" className={`text-sm font-bold transition-colors uppercase tracking-[0.2em] ${pathname.startsWith('/rehberler') ? 'text-[#00FFFF]' : 'text-slate-400 hover:text-[#00FFFF]'}`}>
          Rehberler
        </Link>
        <Link href="#" className="text-sm font-bold text-slate-400 hover:text-[#00FFFF] transition-colors uppercase tracking-[0.2em]">
          Videolar
        </Link>

        <div className="ml-4 border-l border-white/10 pl-6">
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
            <UserButton appearance={{ elements: { avatarBox: "w-10 h-10 border-2 border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.5)]" } }} />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}