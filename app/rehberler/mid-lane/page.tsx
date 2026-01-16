"use client";

import React, { useState } from 'react';
// İkonları ve Logoyu merkezi dosyamızdan çekiyoruz
import { 
  Brain, Timer, Shield, XCircle, CheckCircle, Info, 
  ChevronDown, ChevronUp, AlertOctagon, Target, UserMinus, ArrowLeft, SnixLogo 
} from '@/components/Icons';
import Link from 'next/link';
// Yorum bileşenini ekledik
import CommentSection from '@/components/CommentSection';

// --- YARDIMCI BİLEŞENLER ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#0A1120]/90 border border-cyan-900/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md animate-fade-in ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-3 mb-8 border-b border-cyan-900/30 pb-4">
        <Icon className="w-8 h-8 text-[#00FFFF]" />
        <h2 className="text-3xl font-bold text-white font-brand uppercase">{title}</h2>
    </div>
);

const ComparisonItem = ({ oldMeta, oldReason, newMeta, newReason }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-[#0f192b] border border-white/5 rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:border-[#00FFFF]/30">
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 bg-red-950/10 border-r border-white/5">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest font-brand mb-2">
                        <XCircle className="w-4 h-4" /> <span>Eski Kafa (S15)</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">{oldMeta}</p>
                </div>
                <div className="p-5 bg-emerald-950/10">
                    <div className="flex items-center gap-2 text-[#00FFFF] font-bold text-xs uppercase tracking-widest font-brand mb-2">
                        <CheckCircle className="w-4 h-4" /> <span>S16 Gerçeği</span>
                    </div>
                    <p className="text-white font-bold text-sm">{newMeta}</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full py-3 bg-[#0A1120] hover:bg-cyan-900/20 text-[10px] font-bold text-gray-500 hover:text-[#00FFFF] uppercase tracking-widest transition-colors border-t border-white/5 flex items-center justify-center gap-2">
                {isOpen ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                {isOpen ? "Açıklamayı Gizle" : "Mantığını Öğren (Detay)"}
            </button>
            {isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 border-t border-white/5 bg-black/40 animate-fade-in text-[13px] leading-relaxed">
                    <div className="p-5 border-r border-white/5 text-gray-400 italic">
                        <strong className="text-red-400 not-italic block mb-2 uppercase font-brand">❌ Hata:</strong>
                        {oldReason}
                    </div>
                    <div className="p-5 text-gray-300">
                        <strong className="text-[#00FFFF] block mb-2 uppercase font-brand">✅ Doğrusu:</strong>
                        {newReason}
                    </div>
                </div>
            )}
        </div>
    );
};

const GameplayItem = ({ type, title, summary, detail }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const isDo = type === 'do';
    return (
        <div className={`${isDo ? 'bg-cyan-900/5 border-cyan-500/20 hover:border-cyan-500/50' : 'bg-red-900/5 border-red-500/20 hover:border-red-500/50'} border rounded-xl overflow-hidden mb-4 transition-all`}>
            <div className="p-5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className={`mt-1 p-2 rounded-lg ${isDo ? 'bg-cyan-950/30 text-[#00FFFF]' : 'bg-red-950/30 text-red-500'}`}>
                            {isDo ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                        </div>
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDo ? 'text-[#00FFFF]' : 'text-red-500'} opacity-80`}>
                                {isDo ? 'YAP (DO)' : "YAPMA (DON'T)"}
                            </span>
                            <h4 className="font-bold text-lg text-white mt-1 font-brand">{title}</h4>
                            <p className="text-gray-400 text-xs mt-1">{summary}</p>
                        </div>
                    </div>
                    <div className="text-gray-600">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>
            </div>
            {isOpen && (
                <div className="p-5 bg-black/20 text-sm text-gray-300 border-t border-white/5 leading-relaxed relative">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDo ? 'bg-[#00FFFF]' : 'bg-red-500'}`}></div>
                    <strong className={`block mb-2 font-brand uppercase ${isDo ? 'text-[#00FFFF]' : 'text-red-500'}`}>Analiz Detayı:</strong> 
                    {detail}
                </div>
            )}
        </div>
    );
};

const ChampionCard = ({ title, examples, logic, reason, isRecommended }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
       <div className={`bg-[#0f192b] border rounded-xl mb-4 overflow-hidden transition-all duration-300 ${isRecommended ? 'border-cyan-500/30 hover:border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.05)]' : 'border-red-500/30 hover:border-red-500'}`}>
           <div className="p-5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
               <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-lg ${isRecommended ? 'bg-cyan-950/30 text-[#00FFFF]' : 'bg-red-950/30 text-red-500'}`}>
                           {isRecommended ? <CheckCircle className="w-6 h-6"/> : <XCircle className="w-6 h-6"/>}
                       </div>
                       <div>
                           <h4 className="font-bold text-lg text-white font-brand">{title}</h4>
                           <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{examples}</p>
                       </div>
                   </div>
                   <div className="text-gray-600">{isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</div>
               </div>
           </div>
           {isOpen && (
               <div className="p-6 border-t border-white/5 bg-black/20 animate-fade-in">
                    <div className="mb-6">
                       <h5 className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-[0.2em]">Mekanik Mantığı</h5>
                       <p className="text-gray-300 text-sm leading-relaxed">{logic}</p>
                    </div>
                    <div className={`p-4 rounded-lg text-xs border bg-black/40 ${isRecommended ? 'border-cyan-900/50' : 'border-red-900/50'}`}>
                       <strong className={`block mb-2 uppercase tracking-wide ${isRecommended ? 'text-[#00FFFF]' : 'text-red-500'}`}>
                           {isRecommended ? "NEDEN OYNANMALI?" : "NEDEN UZAK DURMALI?"}
                       </strong>
                       <span className="text-gray-400">{reason}</span>
                    </div>
               </div>
           )}
       </div>
    );
};

// --- ANA SAYFA BİLEŞENİ ---

export default function MidLaneGuide() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen text-slate-200 pb-20 pt-10 px-4">
            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                
                {/* Header */}
                <div className="text-center space-y-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-white transition-colors group mb-4">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Kütüphaneye Dön</span>
                    </Link>
                    
                    <div className="flex justify-center">
                        <SnixLogo className="w-24 h-24 drop-shadow-[0_0_20px_rgba(0,255,255,0.4)]" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white font-brand uppercase tracking-tighter leading-tight">
                        Sezon 16 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-blue-600">Mid Lane Adaptasyon Rehberi</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Vadinin matematiği değişti. Eski alışkanlıklarınla kaybedersin, <span className="text-white font-bold">doğru strateji</span> ile kazanırsın.
                    </p>
                </div>

                {/* Sekmeler */}
                <div className="flex justify-center sticky top-4 z-50">
                    <div className="inline-flex flex-wrap gap-1 bg-[#050A14]/90 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-2xl">
                        {[
                            { id: 'overview', label: 'GENEL BAKIŞ', icon: Info },
                            { id: 'mindset', label: 'ZİHNİYET (MENTAL)', icon: Brain },
                            { id: 'gameplay', label: 'OYNANIŞ & TEMPO', icon: Timer },
                            { id: 'champions', label: 'ŞAMPİYONLAR', icon: Shield },
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-xs font-brand tracking-widest ${activeTab === tab.id ? 'bg-[#00FFFF] text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'text-gray-500 hover:text-white'}`}>
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-12 min-h-[500px]">
                    {/* --- GENEL BAKIŞ --- */}
                    {activeTab === 'overview' && (
                        <Card>
                            <SectionTitle icon={Info} title="HOŞ GELDİN ŞAMPİYON" />
                            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                                <p>Selam dostum. Eğer buradaysan, muhtemelen eski oyun tarzının artık eskisi kadar işe yaramadığını fark etmişsindir. "Neden 10/0 gidiyorum ama oyunu taşıyamıyorum?" diye soruyorsan, cevap basit: <b className="text-[#00FFFF]">Oyunun Matematiği Değişti.</b></p>
                                <p>Bak, dürüst olalım: Bu sezon başrol oyuncusu sen değilsin. Üst koridordaki o tank var ya? O senden <b>Seviye 19</b> statlarıyla önde olacak. Aşağıdaki ADC? <b>7. eşyasını</b> aldığında hasar takasında seni yok edecek.</p>
                                
                                <div className="bg-gradient-to-r from-yellow-900/20 to-transparent p-6 rounded-r-xl border-l-4 border-yellow-500 my-8">
                                    <p className="italic text-yellow-100/90 font-medium">"Orta koridor geç oyunda diğer rollere göre istatistiksel olarak güçsüzdür. Senin süper gücün 'Tempo' ve 'Recall' avantajındır."</p>
                                </div>
                                
                                <h3 className="font-bold text-xl text-white mt-8 mb-6 font-brand uppercase tracking-wider">Sezon 16'da Değişmen Gereken 3 Temel Şey:</h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-[#0f192b]/60 p-6 rounded-xl border border-white/5 hover:border-cyan-500/50 transition-all group">
                                        <div className="p-3 bg-cyan-900/20 w-fit rounded-lg text-[#00FFFF] mb-4 group-hover:scale-110 transition-transform"><Brain className="w-6 h-6"/></div>
                                        <h4 className="text-white font-bold mb-3 font-brand uppercase tracking-wider">1. KAFANI DEĞİŞTİR</h4>
                                        <p className="text-sm text-gray-400">1v9 yapmaya çalışma. Top ve ADC senden daha güçlü (scale) olacak. Onları öne geçirmelisin.</p>
                                    </div>
                                    <div className="bg-[#0f192b]/60 p-6 rounded-xl border border-white/5 hover:border-emerald-500/50 transition-all group">
                                        <div className="p-3 bg-emerald-900/20 w-fit rounded-lg text-emerald-400 mb-4 group-hover:scale-110 transition-transform"><Timer className="w-6 h-6"/></div>
                                        <h4 className="text-white font-bold mb-3 font-brand uppercase tracking-wider">2. HIZINI DEĞİŞTİR</h4>
                                        <p className="text-sm text-gray-400">Minyonlar çok hızlı. Ancak senin dönüş (recall) ve haritaya dağılma tempon herkesten üstün. Bunu kullan.</p>
                                    </div>
                                    <div className="bg-[#0f192b]/60 p-6 rounded-xl border border-white/5 hover:border-purple-500/50 transition-all group">
                                        <div className="p-3 bg-purple-900/20 w-fit rounded-lg text-purple-400 mb-4 group-hover:scale-110 transition-transform"><Shield className="w-6 h-6"/></div>
                                        <h4 className="text-white font-bold mb-3 font-brand uppercase tracking-wider">3. SİLAHINI DEĞİŞTİR</h4>
                                        <p className="text-sm text-gray-400">Sadece kendine çalışan değil, takımına alan açan ve tempoyu yöneten şampiyonları seç.</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* --- ZİHNİYET --- */}
                    {activeTab === 'mindset' && (
                        <Card>
                            <SectionTitle icon={Brain} title="Psikolojik Adaptasyon" />
                            <div className="space-y-2 mb-10">
                                <ComparisonItem 
                                    oldMeta="Her oyunu 10/0 giderek tek başına taşımaya çalışmak." 
                                    oldReason="Eskiden Mid Lane geç oyunda da en güçlü rollerden biriydi ve 'Hyper-Carry' potansiyeli vardı." 
                                    newMeta="Takım arkadaşların için fırsat yaratan bir 'Oyun Kurucu' olmak." 
                                    newReason="Matematiksel Gerçek: Geç oyunda Üst Koridor (Lvl 19 statları) ve ADC (7 Eşya slotu) senden çok daha güçlüdür. Senin süper gücün 'Recall Avantajı'dır. Bu erken tempo avantajını kullanarak, geç oyunda senden güçlü olacak asıl taşıyıcıları (Top/Bot) beslemelisin." 
                                />
                                <ComparisonItem 
                                    oldMeta="Tüm kaynakları (farm/kill) kendinde toplamak." 
                                    oldReason="Takımdaki en yüksek 'Burst' hasarına sahip olduğun için kaynakları senin alman mantıklıydı." 
                                    newMeta="Kaynak Önceliğini, Statları Tavan Yapacak (Scaling) Rollere Vermek." 
                                    newReason="Yanlış Anlama: Bu 'farm yapma' demek değildir. Kendi gelişimini sürdür, ancak haritada boşta kalan büyük kaynakları (Kırmızı, Mavi, Büyük Dalgalar) oyun sonunda senden matematiksel olarak daha güçlü olacak rollere (Lvl 19 Tank / 7 Eşya ADC) bırakmak, takımın toplam kazanma şansını artırır." 
                                />
                                <ComparisonItem 
                                    oldMeta="Skor tablosuna (KDA) odaklanmak." 
                                    oldReason="Yüksek KDA, psikolojik üstünlük ve doğrudan altın avantajı demekti." 
                                    newMeta="'Emilen Baskı' ve Harita Kontrolüne odaklanmak." 
                                    newReason="Senin görevin haritadaki baskıyı emmek (pressure sponge). Sen hayatta kalıp rakip ormancıyı meşgul ederken, takımın diğer tarafta objektif alabilir. Mid Lane'in harita merkezindeki konumu ve Recall avantajı buna olanak tanır." 
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-white/10">
                                <div className="bg-blue-900/10 border border-blue-500/20 p-8 rounded-2xl text-center hover:border-blue-500/50 transition-colors">
                                    <Target className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                                    <h3 className="font-bold text-xl text-white mb-2 font-brand uppercase">Kazanma Koşulu</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Senin krallığın <b className="text-white">5-20. dakikalar</b> arasıdır. Bu, tempom ve recall gücünün zirve yaptığı andır. 20. dakikadan sonra başrolü Üst Koridora ve ADC'ye devretmezsen, istatistiksel olarak (Stat Check) oyunu kaybetmeye mahkumsun.
                                    </p>
                                </div>
                                <div className="bg-orange-900/10 border border-orange-500/20 p-8 rounded-2xl text-center hover:border-orange-500/50 transition-colors">
                                    <UserMinus className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                                    <h3 className="font-bold text-xl text-white mb-2 font-brand uppercase">Ego Yönetimi</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        "Kill benim hakkım" egosunu çöpe at. Bir kill aldığında kendine şunu sor: <i className="text-white">"Bu altın bende mi daha çok işe yarar, yoksa Lvl 19 olacak Tank'ta mı?"</i> Profesyonel oyuncu, egosuyla değil, matematiğiyle kazanır.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* --- OYNANIŞ --- */}
                    {activeTab === 'gameplay' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-yellow-950/20 border border-yellow-600/30 rounded-xl p-8 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 rounded-full blur-2xl"></div>
                                <div className="flex items-center gap-4 mb-4 relative z-10">
                                    <AlertOctagon className="w-8 h-8 text-yellow-500" />
                                    <h3 className="text-2xl font-bold text-white font-brand uppercase">Kritik Soru: Görev Bitmeden Roam?</h3>
                                </div>
                                <div className="space-y-4 text-sm text-gray-300 relative z-10 leading-relaxed">
                                    <p><span className="text-red-500 font-bold bg-red-900/20 px-2 py-0.5 rounded border border-red-500/30">CEVAP: HAYIR.</span> Profesyonel analizler, görevi tamamlayana kadar koridorda kalmanı şiddetle önerir.</p>
                                    <div className="bg-black/30 p-5 rounded-lg border-l-4 border-yellow-500">
                                        <p className="font-bold text-white mb-2 tracking-wide uppercase text-xs">MANTIK:</p>
                                        <ul className="list-disc pl-4 space-y-2 text-gray-400">
                                            <li>Görev ödülü (T2 Çizme/Homeguard) sana <b className="text-yellow-400">HIZ</b> verir.</li>
                                            <li>Minyonlar çok hızlı olduğu için, bu hız ödülünü almadan roama gidersen, geri döndüğünde kulen gitmiş olur.</li>
                                            <li>Doğru döngü: <b className="text-white">Dürt &rarr; Görevi Bitir &rarr; Empowered Recall &rarr; Homeguard ile Fırla.</b></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Card>
                                <SectionTitle icon={Timer} title="Oynanış & Kritik Detaylar" />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <GameplayItem type="do" title="Dalgayı İt ve Hemen Dön" summary="Shove & Reset kuralına uy." detail="Minyonlar çok hızlı. Dalgayı ittiğin anda üsse dönmezsen (Tempo Reset), rakip eşya alıp geri geldiğinde seni koridorda yakalar. 'The Turn' anını kaçırma." />
                                        <GameplayItem type="do" title="Hayalet (Ghost) Al" summary="TP yerine Ghost tercih et." detail="Yeni 'Homeguards' ve 'Güçlendirilmiş Dönüş' zaten seni koridora hızlı getiriyor. Işınlanma büyüsü (TP) bu yüzden değer kaybetti. Hayalet, geç oyunda hayatta kalmanı ve pozisyon almanı sağlar." />
                                        <GameplayItem type="do" title="Baskı Emici Ol" summary="Pressure Sponge: Rakibi oyala." detail="Haritada görünür ol, rakibi üzerine çek ama ölme. Sen hayatta kalırken rakip kaynak harcarsa, takımın haritanın diğer ucunda kazanır." />
                                        <GameplayItem type="do" title="Tempoyu Görüşe Çevir (Deep Vision)" summary="Hızını kullanarak totem at." detail="Empowered Recall sonrası sahip olduğun aşırı hareket hızını (Homeguard) sadece koridora koşmak için kullanma. Rakip ormana derin bir totem atıp öyle koridora dön. Minyon kaçırmazsın ama rakip ormancıyı açığa çıkarırsın. Bilgi = Güç." />
                                    </div>
                                    <div>
                                        <GameplayItem type="dont" title="Barikat İçin Açgözlülük Yapma" summary="5 saniye gecikmek = Ölüm." detail="'Bir barikat daha vurayım' dersen ölürsün. Rakip homeguard ile çok hızlı döner. O 5 saniyelik gecikme, koca bir dalgayı ve temposunu kaybetmene neden olur." />
                                        <GameplayItem type="dont" title="Rastgele 1v1 Takaslara Girme" summary="Canın (HP) bir tempo kaynağıdır." detail="Gereksiz bir takasta canın azalırsa, üsse dönmek zorunda kalırsın ve hızlı minyonlar yüzünden çok fazla XP kaybedersin. %100 emin değilsen savaşma." />
                                        <GameplayItem type="dont" title="Koridorda Bekleme (Hovering)" summary="Boş zaman = Kayıp zaman." detail="Minyonları ittirdikten sonra koridorda boş boş bekleme. Ya üsse dön, ya görüşe girme (Fog of War) ya da roama çık. Beklemek zaman kaybıdır." />
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-6">
                                <div className="p-6 bg-[#0f192b] rounded-xl border border-white/5 shadow-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="text-3xl font-bold text-white mb-2 font-brand">1. HASAR VER</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Görevini Tamamla</div>
                                </div>
                                <div className="p-6 bg-[#0f192b] rounded-xl border border-white/5 shadow-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="text-3xl font-bold text-[#00FFFF] mb-2 font-brand">2. ÇİZMEYİ AL</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Haritayı Aç</div>
                                </div>
                                <div className="p-6 bg-[#0f192b] rounded-xl border border-white/5 shadow-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="text-3xl font-bold text-emerald-400 mb-2 font-brand">3. HIZLI DÖN</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Tempoyu Yönet</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ŞAMPİYONLAR --- */}
                    {activeTab === 'champions' && (
                        <div className="space-y-6 animate-fade-in">
                            <Card>
                                <SectionTitle icon={Shield} title="Şampiyon Havuzu: Araçlarını Seç" />
                                <ChampionCard 
                                    isRecommended={true} 
                                    title="Kontrol Büyücüleri (Facilitators)" 
                                    examples="Örnek: Orianna, Hwei, Viktor, Syndra" 
                                    logic="Bu şampiyonlar, hızlı minyon dalgalarını uzaktan güvenle temizleyebilir (Wave Clear). Bu sayede minyon cezası yemeden haritada baskı kurabilirler. Takım savaşlarında kitle kontrolü (CC) ve alan (Zone) kontrolü sağlayarak ADC ve Top Laner'ın rahat çalışmasını sağlarlar." 
                                    reason="Güvenli, Dalga Temizleme Gücü Yüksek, Takım Odaklı." 
                                />
                                <ChampionCard 
                                    isRecommended={true} 
                                    title="Global & Harita Baskısı" 
                                    examples="Örnek: Galio, Taliyah, Twisted Fate" 
                                    logic="Senin en büyük gücün 'Tempo'. Bu şampiyonlar, üsse dönüp (Recall) eşya aldıktan sonra ışınlanma veya yüksek hareket hızıyla haritanın diğer ucuna anında etki edebilirler. Kendi koridorunu itip, asıl güçlü olacak yan koridorları (Top/Bot) beslemek için mükemmeldirler." 
                                    reason="Recall Avantajını Maksimuma Çıkarır, Yan Koridorları Besler." 
                                />
                                <ChampionCard 
                                    isRecommended={false} 
                                    title="Tek Boyutlu Suikastçılar" 
                                    examples="Örnek: Zed, Talon, Katarina, Fizz" 
                                    logic="Suikastçılar 'kartopu' (snowball) etkisine muhtaçtır. Ancak S16'da bir tankı (Top) veya kalkanlı bir ADC'yi (Bot) teklemek çok zordur. Eğer 10/0 başlamazsan, oyunun ilerleyen safhalarında bir 'etkisiz eleman'a dönüşürsün. Minyonlar hızlı olduğu için başarısız bir roam denemesi sana kuleye mal olur." 
                                    reason="Yüksek Risk, Düşük Ödül. Tanklara/Zırhlara karşı çaresiz." 
                                />
                                <ChampionCard 
                                    isRecommended={false} 
                                    title="Melee ADC'ler (Dövüşçüler)" 
                                    examples="Örnek: Yasuo, Yone, Irelia" 
                                    logic="Matematiksel dezavantaj: Senin takımındaki ADC, oyun sonunda 7. eşyayı alacak (Bot Lane avantajı). Sen ise 6 eşyada kalacaksın. Ayrıca Üst Koridor oyuncusu senden seviye olarak yüksek ve daha tank olacak. Onların arasına girip yakın dövüş (melee) yapmaya çalışmak intihardır." 
                                    reason="Stat-Check'i Kaybederler. Geç oyunda kırılgan kalırlar." 
                                />
                            </Card>
                        </div>
                    )}
                </div>

                {/* --- YORUM BÖLÜMÜ ENTEGRASYONU --- */}
                <div className="mt-16 border-t border-white/5 pt-10">
                     <CommentSection guideId="mid-lane-rehberi-s16" />
                </div>

                <div className="text-center text-gray-600 text-sm mt-12 pt-8 border-t border-white/5 uppercase tracking-[0.2em]">
                    <p className="font-brand text-lg text-[#00FFFF] opacity-50 mb-2">SNIX GG</p>
                    <p>Egonu kapıda bırak, takımını besle, tempoyu kontrol et.</p>
                </div>
            </div>
        </div>
    );
}