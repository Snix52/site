"use client";

import Link from 'next/link';
import { SnixLogo, ArrowLeft, Brain, Shield, Timer } from '@/components/Icons';

export default function GuidesHub() {
  return (
    <div className="min-h-screen bg-[#050A14] font-sans text-slate-200 relative overflow-hidden">
      
      {/* Grid Overlay */}
      <div className="grid-overlay"></div>

      {/* Navigasyon / Header */}
      <div className="relative z-50 p-8 flex justify-between items-center max-w-7xl mx-auto">
         <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold tracking-widest text-sm uppercase">Ana Sayfa</span>
         </Link>
         <SnixLogo className="w-12 h-12" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        
        {/* Başlık Alanı */}
        <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white font-brand uppercase tracking-tight">
                Rehber <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-blue-600">Kütüphanesi</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Tüm yamalar, şampiyonlar ve makro oyun stratejileri tek bir yerde. <br/>
                <span className="text-white font-bold">Snix Laboratuvarı</span>'na hoş geldin.
            </p>
        </div>

        {/* Rehber Kartları Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* 1. KART: MID LANE (Aktif) */}
            <Link href="/rehberler/mid-lane" className="group block h-full">
                <div className="bg-[#0A1120] border border-white/5 rounded-2xl overflow-hidden hover:border-[#00FFFF] transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:-translate-y-2 h-full flex flex-col">
                    
                    {/* Kart Görsel Alanı */}
                    <div className="h-48 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 relative p-6 flex flex-col justify-between border-b border-white/5 group-hover:from-cyan-900/40 transition-colors">
                        <div className="absolute top-4 right-4 bg-[#00FFFF] text-black text-[10px] font-black px-2 py-1 rounded shadow-lg shadow-cyan-500/20 uppercase tracking-wider">
                            Master+
                        </div>
                        <Brain className="w-12 h-12 text-[#00FFFF] opacity-50 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-bold text-[#00FFFF] font-brand tracking-widest opacity-80">S16 META GUIDE</h3>
                    </div>

                    {/* Kart İçerik */}
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Makro & Meta</div>
                        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-[#00FFFF] transition-colors">
                            Sezon 16: Orta Koridor Rehberi
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                            Profesyonel analizlere dayalı stratejik özet. Minyon hızı, XP değişimleri ve kazanma koşulları.
                        </p>
                        <span className="text-[#00FFFF] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            Okumaya Başla <ArrowLeft className="w-3 h-3 rotate-180" />
                        </span>
                    </div>
                </div>
            </Link>

            {/* 2. KART: TOP LANE (Hala Pasif - Sırada Bu Var) */}
            <div className="group block h-full opacity-50 cursor-not-allowed">
                <div className="bg-[#0A1120] border border-white/5 rounded-2xl overflow-hidden h-full flex flex-col grayscale">
                    <div className="h-48 bg-gradient-to-br from-red-900/10 to-orange-900/10 relative p-6 flex flex-col justify-between border-b border-white/5">
                        <div className="absolute top-4 right-4 bg-gray-700 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                            Yakında
                        </div>
                        <Shield className="w-12 h-12 text-red-500 opacity-40" />
                        <h3 className="text-2xl font-bold text-gray-600 font-brand tracking-widest">TOP LANE</h3>
                    </div>
                    <div className="p-6">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Solo Carry</div>
                        <h2 className="text-xl font-bold text-gray-400 mb-3">Sezon 16: Üst Koridor</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Tank metası, split push ve ada psikolojisi. Çok yakında Snix.gg'de.
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. KART: JUNGLE (AKTİF EDİLDİ! 🌲) */}
            <Link href="/rehberler/jungle" className="group block h-full">
                <div className="bg-[#0A1120] border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-2 h-full flex flex-col">
                    
                    {/* Kart Görsel Alanı - Yeşil/Emerald Tema */}
                    <div className="h-48 bg-gradient-to-br from-emerald-900/20 to-green-900/20 relative p-6 flex flex-col justify-between border-b border-white/5 group-hover:from-emerald-900/40 transition-colors">
                        <div className="absolute top-4 right-4 bg-emerald-400 text-black text-[10px] font-black px-2 py-1 rounded shadow-lg shadow-emerald-500/20 uppercase tracking-wider">
                            Master+
                        </div>
                        <Timer className="w-12 h-12 text-emerald-400 opacity-50 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-bold text-emerald-400 font-brand tracking-widest opacity-80">JUNGLE</h3>
                    </div>

                    {/* Kart İçerik */}
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Map Control</div>
                        <h2 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                            Sezon 16: Orman Yolları
                        </h2>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">
                            Yeni orman rotaları, "Faelights" sistemi ve Tam Kontrol doktrini.
                        </p>
                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            Okumaya Başla <ArrowLeft className="w-3 h-3 rotate-180" />
                        </span>
                    </div>
                </div>
            </Link>

        </div>
      </main>
    </div>
  );
}