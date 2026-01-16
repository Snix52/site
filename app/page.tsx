import Link from 'next/link';
import { SnixLogo, Play, Brain, Target, Zap, CheckCircle, XCircle, ChevronDown } from '@/components/Icons'; 
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050A14] flex flex-col relative overflow-hidden font-sans">
      
      {/* 1. ÜST NAVİGASYON */}
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

          {/* GİRİŞ VE KAYIT BUTONLARI */}
          <div className="ml-4 border-l border-white/10 pl-6">
            <SignedOut>
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <button className="px-5 py-2 border border-slate-600 text-slate-300 font-bold text-xs uppercase tracking-widest rounded hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all">
                    Giriş Yap
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button className="px-5 py-2 bg-[#00FFFF] text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                    Kayıt Ol
                  </button>
                </Link>
              </div>
            </SignedOut>

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
      <main className="min-h-[calc(100vh-100px)] flex flex-col justify-center items-center text-center px-4 relative z-10 pb-20">
        
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

        <div className="flex flex-col sm:flex-row gap-5 items-center justify-center mb-16">
          <Link href="/rehberler" 
                className="px-10 py-4 bg-[#00FFFF] hover:bg-white text-black font-black text-xs uppercase tracking-[0.25em] rounded-sm transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.4)]">
            HEMEN BAŞLA (REHBER)
          </Link>
          
          <button className="px-10 py-4 border border-slate-700 hover:border-[#00FFFF] text-white hover:text-[#00FFFF] font-black text-xs uppercase tracking-[0.25em] rounded-sm transition-all flex items-center gap-2 group bg-transparent">
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            VİDEOLARI İZLE
          </button>
        </div>

        {/* KAYDIRMA İŞARETİ */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-70 cursor-pointer">
            <span className="text-[10px] text-[#00FFFF] font-bold tracking-[0.3em] uppercase">Kaydır</span>
            <ChevronDown className="w-6 h-6 text-white drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
        </div>

      </main>

      {/* 3. GERÇEK VS YALAN (EŞİT BOYUTLANDIRMA GÜNCELLEMESİ) */}
      <section className="py-24 bg-[#03060C] relative border-t border-white/5 z-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8 md:gap-16 items-stretch">
            
            {/* Sol Taraf: Clickbait (Kırmızı Çerçeve - h-full eklendi) */}
            <div className="flex flex-col h-full space-y-8 bg-red-950/10 p-8 rounded-3xl border border-red-900/30">
                <h3 className="text-2xl font-black text-red-500 uppercase tracking-widest flex items-center gap-3">
                    <XCircle className="w-8 h-8" />
                    YouTube Yalanları
                </h3>
                <div className="flex-1 flex flex-col justify-center">
                    <ul className="space-y-6 border-l-2 border-red-900/50 pl-6">
                        <li className="text-slate-300 text-lg line-through decoration-red-500/50 decoration-2">"Bu build ile kaybetmek imkansız!"</li>
                        <li className="text-slate-300 text-lg line-through decoration-red-500/50 decoration-2">"Ormancıyı ağlatan taktik!"</li>
                        <li className="text-slate-300 text-lg line-through decoration-red-500/50 decoration-2">"%100 Win Rate Garanti!"</li>
                        <li className="text-slate-300 text-lg line-through decoration-red-500/50 decoration-2">Bronz eloda smurf atıp video çekmek.</li>
                    </ul>
                </div>
            </div>

            {/* Sağ Taraf: Snix (Cyan Çerçeve - h-full eklendi ve madde sayısı artırıldı) */}
            <div className="flex flex-col h-full space-y-8 bg-[#00FFFF]/5 p-8 rounded-3xl border border-[#00FFFF]/20 relative">
                <div className="absolute inset-0 bg-[#00FFFF]/5 blur-3xl rounded-full pointer-events-none"></div>
                <h3 className="text-2xl font-black text-[#00FFFF] uppercase tracking-widest flex items-center gap-3 relative z-10">
                    <CheckCircle className="w-8 h-8" />
                    Snix Gerçekleri
                </h3>
                <div className="flex-1 flex flex-col justify-center">
                    <ul className="space-y-6 border-l-2 border-[#00FFFF] pl-6 relative z-10">
                        <li className="text-white text-lg font-bold">
                            <span className="text-slate-400 font-normal block text-sm mb-1 uppercase tracking-widest">Makro Kurgu</span>
                            Harita kaynaklarını (Baron/Ejder) şansa bırakmayan rotasyon analizleri.
                        </li>
                        <li className="text-white text-lg font-bold">
                            <span className="text-slate-400 font-normal block text-sm mb-1 uppercase tracking-widest">Dalga Fiziği</span>
                            Minyonları dondurarak (Freeze) rakibi XP ve altından mahrum bırakma teknikleri
                        </li>
                        {/* Yeni Eklenen Maddeler */}
                        <li className="text-white text-lg font-bold">
                            <span className="text-slate-400 font-normal block text-sm mb-1 uppercase tracking-widest">Tempo Kontrolü</span>
                            Base atma zamanlamasını (Recall) markete göre değil, harita temposuna göre belirlemek.
                        </li>
                         <li className="text-white text-lg font-bold">
                            <span className="text-slate-400 font-normal block text-sm mb-1 uppercase tracking-widest">Orman Takibi</span>
                            Rakip ormancının yerini tahmin et, gank yeme, oyunu domine et.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </section>

      {/* 4. ÖZELLİKLER GRID */}
      <section className="py-32 relative z-20 bg-[#050A14]">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                    Oyunu <span className="text-[#00FFFF] underline decoration-4 decoration-blue-600 underline-offset-4">Okumayı</span> Öğren
                </h2>
                <p className="text-slate-400 font-medium">Reflekslerin seni bir yere kadar taşır, zekan ise zirveye.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group bg-[#0A1120] border border-white/5 p-8 rounded-sm hover:border-[#00FFFF] transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                    <Brain className="w-10 h-10 text-[#00FFFF] mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Makro Strateji</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Baron ne zaman zorlanır? Ejder ne zaman verilir? Haritanın neresinde olman gerektiğini saniyesi saniyesine planla.
                    </p>
                </div>

                <div className="group bg-[#0A1120] border border-white/5 p-8 rounded-sm hover:border-[#00FFFF] transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                    <Target className="w-10 h-10 text-[#00FFFF] mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Matchup Analizi</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Karşındaki şampiyonun zayıf anlarını (cooldown pencerelerini) ezberle. Takasa girmek için doğru anı bekleme, o anı yarat.
                    </p>
                </div>

                <div className="group bg-[#0A1120] border border-white/5 p-8 rounded-sm hover:border-[#00FFFF] transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                    <Zap className="w-10 h-10 text-[#00FFFF] mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Tempo Yönetimi</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Base atma zamanlaması (Recall timing) oyunu kazandırır veya kaybettirir. Temponu koru, rakibi haritadan sil.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/5 bg-black text-center relative z-20">
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
            © 2026 SNIX.GG • BY MASTER TIER PLAYER FOR PLAYERS
        </p>
      </footer>

      <div className="grid-overlay"></div>
    </div>
  );
}