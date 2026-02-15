import { Brain, Shield, Globe, XCircle, Code, Coffee } from '@/components/Icons'; 
// Navbar, Link ve Auth importlarını sildik çünkü hepsi Layout'tan geliyor veya burada kullanılmıyor.

export default function About() {
  return (
    <div className="min-h-screen bg-[#050A14] flex flex-col relative overflow-hidden font-sans text-slate-300">
      
      {/* --- NAVİGASYON SİLİNDİ (Otomatik Geliyor) --- */}

      {/* --- İÇERİK --- */}
      <main className="flex-1 relative z-10">
        
        {/* Başlık Alanı */}
        <section className="pt-20 pb-12 text-center px-6">
            <p className="text-[#00FFFF] font-bold tracking-[0.4em] uppercase text-xs md:text-sm mb-4 opacity-80">
                GLOBAL STANDARTLAR, YEREL VİZYON
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-8">
                NEDEN <span className="italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-blue-600 pr-4">SNIX.GG?</span>
            </h1>
            <div className="w-24 h-1 bg-[#00FFFF] mx-auto rounded-full shadow-[0_0_15px_rgba(0,255,255,0.5)]"></div>
        </section>

        {/* Hikaye ve Metodoloji */}
        <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-2 gap-8 items-stretch">
            
            {/* SOL: Sorun */}
            <div className="bg-[#0A1120] border border-white/5 p-10 rounded-3xl relative overflow-hidden group hover:border-red-500/30 transition-colors duration-500 h-full flex flex-col shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-4">
                    <Shield className="w-10 h-10 text-red-500" />
                    Büyük Boşluk
                </h2>
                <div className="space-y-6 text-lg leading-relaxed text-slate-400 flex-1 font-medium">
                    <p>
                        Yabancı içerik üreticileri topluluklarına ansiklopedi niteliğinde bilgiler sunarken, bizim trendlerimiz maalesef <span className="text-white font-bold bg-red-500/10 px-2 py-1 rounded">"TEK ATTIM"</span> videolarından öteye gidemiyor.
                    </p>
                    <p>
                        Türkiye'de kimse derinlemesine, analitik ve gerçekten öğretici bir içerik sunmuyor. Bu vizyonsuzluk kaderimiz değil.
                    </p>
                </div>
            </div>

            {/* SAĞ: Çözüm */}
            <div className="bg-[#0A1120] border border-white/5 p-10 rounded-3xl relative overflow-hidden group hover:border-[#00FFFF]/30 transition-colors duration-500 h-full flex flex-col shadow-2xl">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#00FFFF]/5 blur-[100px] rounded-full -translate-y-1/2 -translate-x-1/2"></div>
                <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-4">
                    <Globe className="w-10 h-10 text-[#00FFFF]" />
                    Nasıl Yapıyoruz?
                </h2>
                <div className="space-y-5 text-lg leading-relaxed text-slate-400 flex-1 font-medium">
                    <ul className="space-y-6 mt-2">
                        <li className="flex gap-4">
                            <span className="text-[#00FFFF] font-black text-xl">•</span>
                            <span><strong className="text-white block mb-1">Pro Analizi:</strong> Global pro maçlarını kare kare izliyor, sebepleri çözümlüyoruz.</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-[#00FFFF] font-black text-xl">•</span>
                            <span><strong className="text-white block mb-1">Forum Filtresi:</strong> Reddit ve global forumlardaki tartışmaları tarayıp hurafeleri eliyoruz.</span>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-[#00FFFF] font-black text-xl">•</span>
                            <span><strong className="text-white block mb-1">Master Süzgeci:</strong> Verileri, Master Tier tecrübemizle harmanlayıp Türkçe'ye uyarlıyoruz.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        {/* İstatistikler */}
        <section className="max-w-5xl mx-auto px-6 pb-32">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-black/40 border border-white/5 p-8 rounded-2xl text-center hover:bg-[#00FFFF]/5 transition-colors group border-b-4 border-b-[#00FFFF]/20 hover:border-b-[#00FFFF]">
                    <div className="text-5xl font-black text-[#00FFFF] mb-3 font-brand group-hover:scale-110 transition-transform">MASTER</div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">LİG SEVİYESİ</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-8 rounded-2xl text-center hover:bg-[#00FFFF]/5 transition-colors group border-b-4 border-b-[#00FFFF]/20 hover:border-b-[#00FFFF]">
                    <div className="text-5xl font-black text-[#00FFFF] mb-3 font-brand group-hover:scale-110 transition-transform">GLOBAL</div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">ANALİZ AĞI</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-8 rounded-2xl text-center hover:bg-[#00FFFF]/5 transition-colors group border-b-4 border-b-[#00FFFF]/20 hover:border-b-[#00FFFF]">
                    <div className="text-5xl font-black text-[#00FFFF] mb-3 font-brand group-hover:scale-110 transition-transform">%100</div>
                    <div className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">DOĞRULANMIŞ BİLGİ</div>
                </div>
            </div>
        </section>

        {/* --- SNIX.GG PRENSİPLERİ --- */}
        <section className="max-w-7xl mx-auto px-6 pb-40">
            <div className="flex items-center justify-center gap-4 mb-16">
                <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#00FFFF]"></div>
                <h3 className="text-center text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                    <span className="italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-blue-600 pr-1">SNIX.GG</span> PRENSİPLERİ
                </h3>
                <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#00FFFF]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                
                {/* 1. TIK TUZAĞI YOK */}
                <div className="bg-[#0A1120] border border-white/5 p-8 rounded-2xl hover:bg-white/5 transition-all group min-h-[320px] flex flex-col hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-wider mb-4">TIK TUZAĞI YOK</h4>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">
                        %100 Win Rate diye bir şey yoktur, sadece doğru koşullar vardır. Biz size hayal satmıyoruz; her stratejinin risklerini, 'counter'larını ve hangi durumlarda çalışmayacağını dürüstçe anlatıyoruz. Başarı garanti değil, bilgi garantidir.
                    </p>
                </div>

                {/* 2. VERİ ODAKLI */}
                <div className="bg-[#0A1120] border border-white/5 p-8 rounded-2xl hover:bg-white/5 transition-all group min-h-[320px] flex flex-col hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                    <div className="w-16 h-16 bg-[#00FFFF]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00FFFF]/20 transition-colors">
                        <Brain className="w-8 h-8 text-[#00FFFF]" />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-wider mb-4">VERİ ODAKLI</h4>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">
                        Sadece kazanma oranlarına bakıp geçmiyoruz. O oranın arkasındaki 'neden'i araştırıyoruz. Binlerce maçlık veri havuzunu tarıyor, şans faktörünü eliyor ve sadece istikrarlı (consistent) sonuç veren formülleri önünüze getiriyoruz. Veri, tecrübenin sağlamasıdır.
                    </p>
                </div>

                {/* 3. AÇIK KAYNAK */}
                <div className="bg-[#0A1120] border border-white/5 p-8 rounded-2xl hover:bg-white/5 transition-all group min-h-[320px] flex flex-col hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                        <Code className="w-8 h-8 text-purple-500" />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-wider mb-4">AÇIK KAYNAK</h4>
                    <p className="text-sm md:text-base text-slate-400 leading-relaxed font-medium">
                        En iyi Master oyuncusu bile her şeyi bilemez. Bu yüzden kapılarımızı kapatmıyoruz; aksine topluluğun sisteme 'patch' atmasına izin veriyoruz. Bir hatamız varsa düzeltin, daha iyisini biliyorsanız ekleyin. Bu site tek bir kişinin değil, gelişime aç tüm oyuncuların ortak malıdır.
                    </p>
                </div>

                {/* 4. HOBİ PROJESİ */}
                <div className="bg-[#0A1120] border border-white/5 p-8 rounded-2xl hover:bg-white/5 transition-all group min-h-[320px] flex flex-col hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)] relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none"></div>
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors relative z-10">
                        <Coffee className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h4 className="text-xl font-black text-white uppercase tracking-wider mb-4 relative z-10">HOBİ PROJESİ</h4>
                    <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium relative z-10">
                        Burası 7/24 destek veren bir şirket değil, uykusuz kalan oyuncuların kurduğu bir atölyedir. Ticari bir taahhüdümüz yok ama kalite takıntımız var. Bazen bir güncelleme gecikebilir, bazen site bakıma girebilir. Bizi 'hizmet sağlayıcı' olarak değil, Vadi'deki 'duo partneriniz' olarak görün.
                    </p>
                </div>

            </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/5 bg-black text-center relative z-20">
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
            Â© 2026 SNIX.GG ⬢ HOBİ PROJESİ ⬢ BEKLENTİ YOK, SADECE TUTKU
        </p>
      </footer>

      <div className="grid-overlay pointer-events-none fixed inset-0 z-0 opacity-20"></div>
    </div>
  );
}
