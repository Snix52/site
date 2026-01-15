import Link from 'next/link';
// İkonları senin hazırladığın bileşenden çekiyoruz
import { SnixLogo, Play } from '@/components/Icons'; 
// 1. CLERK KÜTÜPHANESİNDEN GEREKLİ PARÇALARI ÇEKİYORUZ
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050A14] flex flex-col relative overflow-hidden font-sans">
      
      {/* 1. ÜST NAVİGASYON (PANEL MODU) */}
      <nav className="relative z-[60] flex justify-between items-center px-8 py-6 max-w-full w-full bg-[#050A14]/90 backdrop-blur-md border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 group cursor-pointer">
          <SnixLogo className="w-[65px] h-[65px] drop-shadow-[0_0_10px_rgba(0,255,255,0.6)] transition-transform group-hover:scale-110" />
          
          <span className="text-[18px] font-black italic tracking-tighter text-white leading-none">
            SNIX<span className="text-[#00FFFF]">.GG</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <Link href="/" className="text-sm font-bold text-white hover:text-[#00FFFF] transition-colors uppercase tracking-[0.2em]">Ana Sayfa</Link>
          
          <Link href="/rehberler" className="text-sm font-bold text-slate-400 hover:text-[#00FFFF] transition-colors uppercase tracking-[0.2em]">Rehberler</Link>
          
          <Link href="#" className="text-sm font-bold text-slate-400 hover:text-[#00FFFF] transition-colors uppercase tracking-[0.2em]">Videolar</Link>

          {/* 2. GİRİŞ SİSTEMİ ENTEGRASYONU (BURASI YENİ EKLENDİ) */}
          <div className="ml-4 border-l border-white/10 pl-6">
            {/* Eğer kullanıcı Çıkış Yapmışsa (Giriş yapmamışsa) bu butonu göster */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-6 py-2 bg-[#00FFFF]/10 border border-[#00FFFF]/50 text-[#00FFFF] font-bold text-xs uppercase tracking-widest rounded hover:bg-[#00FFFF] hover:text-black transition-all shadow-[0_0_10px_rgba(0,255,255,0.2)]">
                  Giriş Yap
                </button>
              </SignInButton>
            </SignedOut>

            {/* Eğer kullanıcı Giriş Yapmışsa profil resmini göster */}
            <SignedIn>
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

      {/* 2. HERO SECTION */}
      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 relative z-10 pt-32">
        
        {/* Merkezi Logo */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-[#00FFFF]/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <SnixLogo className="w-32 h-32 relative z-10 drop-shadow-[0_0_25px_rgba(0,255,255,0.4)]" /> 
        </div>

        <p className="text-[#00FFFF] font-bold tracking-[0.6em] uppercase text-sm md:text-base mb-6 opacity-90 animate-fade-in">
          PROFESYONEL E-SPOR ANALİZLERİ
        </p>

        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 leading-tight font-brand">
          OYUNU <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#00FFFF] to-[#3B82F6] drop-shadow-[0_0_30px_rgba(0,255,255,0.3)] uppercase">
            DOMİNE ET
          </span>
        </h1>

        <p className="text-slate-400 max-w-3xl mx-auto text-xl md:text-2xl leading-relaxed mb-12 font-medium">
          Sadece oynamak yetmez. Vadinin matematiğini çöz, rakibini zihnen yen. <br />
          <span className="text-white font-bold">Snix GG</span> ile Elo Hell'den çıkış biletin burada.
        </p>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
          <Link href="/rehberler" 
                className="px-10 py-4 bg-[#00FFFF] hover:bg-white text-black font-black text-xs uppercase tracking-[0.25em] rounded-sm transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
            HEMEN BAŞLA (REHBER)
          </Link>
          
          <button className="px-10 py-4 border border-slate-700 hover:border-[#00FFFF] text-white hover:text-[#00FFFF] font-black text-xs uppercase tracking-[0.25em] rounded-sm transition-all flex items-center gap-2 group bg-transparent">
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            VİDEOLARI İZLE
          </button>
        </div>
      </main>

      {/* Grid Overlay */}
      <div className="grid-overlay"></div>
    </div>
  );
}