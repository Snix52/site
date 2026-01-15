"use client";

import React, { useState } from 'react';
// İkonları senin bileşenden çekiyoruz. 
import { 
  Brain, Timer, Shield, XCircle, CheckCircle, Info, 
  ChevronDown, ChevronUp, AlertOctagon, Target, UserMinus, ArrowLeft, SnixLogo,
   Zap 
} from '@/components/Icons';
import Link from 'next/link';

// --- YARDIMCI BİLEŞENLER ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#0A1120]/90 border border-emerald-900/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md animate-fade-in ${className}`}>
        {children}
    </div>
);

const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-3 mb-8 border-b border-emerald-900/30 pb-4">
        <Icon className="w-8 h-8 text-emerald-400" />
        <h2 className="text-3xl font-bold text-white font-brand uppercase">{title}</h2>
    </div>
);

const ComparisonItem = ({ oldMeta, oldReason, newMeta, newReason }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-[#0f192b] border border-white/5 rounded-xl overflow-hidden mb-4 transition-all duration-300 hover:border-emerald-500/30">
            <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 bg-red-950/10 border-r border-white/5">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest font-brand mb-2">
                        <XCircle className="w-4 h-4" /> <span>Eski Kafa (S15)</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">{oldMeta}</p>
                </div>
                <div className="p-5 bg-emerald-950/10">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest font-brand mb-2">
                        <CheckCircle className="w-4 h-4" /> <span>S16 Gerçeği</span>
                    </div>
                    <p className="text-white font-bold text-sm">{newMeta}</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full py-3 bg-[#0A1120] hover:bg-emerald-900/20 text-[10px] font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-widest transition-colors border-t border-white/5 flex items-center justify-center gap-2">
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
                        <strong className="text-emerald-400 block mb-2 uppercase font-brand">✅ Doğrusu:</strong>
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
        <div className={`${isDo ? 'bg-emerald-900/5 border-emerald-500/20 hover:border-emerald-500/50' : 'bg-red-900/5 border-red-500/20 hover:border-red-500/50'} border rounded-xl overflow-hidden mb-4 transition-all`}>
            <div className="p-5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className={`mt-1 p-2 rounded-lg ${isDo ? 'bg-emerald-950/30 text-emerald-400' : 'bg-red-950/30 text-red-500'}`}>
                            {isDo ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                        </div>
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDo ? 'text-emerald-400' : 'text-red-500'} opacity-80`}>
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
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDo ? 'bg-emerald-400' : 'bg-red-500'}`}></div>
                    <strong className={`block mb-2 font-brand uppercase ${isDo ? 'text-emerald-400' : 'text-red-500'}`}>Analiz Detayı:</strong> 
                    {detail}
                </div>
            )}
        </div>
    );
};

const ChampionCard = ({ title, examples, logic, reason, isRecommended }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
       <div className={`bg-[#0f192b] border rounded-xl mb-4 overflow-hidden transition-all duration-300 ${isRecommended ? 'border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-red-500/30 hover:border-red-500'}`}>
           <div className="p-5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
               <div className="flex justify-between items-center">
                   <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-lg ${isRecommended ? 'bg-emerald-950/30 text-emerald-400' : 'bg-red-950/30 text-red-500'}`}>
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
                    <div className={`p-4 rounded-lg text-xs border bg-black/40 ${isRecommended ? 'border-emerald-900/50' : 'border-red-900/50'}`}>
                       <strong className={`block mb-2 uppercase tracking-wide ${isRecommended ? 'text-emerald-400' : 'text-red-500'}`}>
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

export default function JungleGuide() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="min-h-screen text-slate-200 pb-20 pt-10 px-4">
            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                
                {/* Header */}
                <div className="text-center space-y-6">
                    <Link href="/rehberler" className="inline-flex items-center gap-2 text-emerald-400 hover:text-white transition-colors group mb-4">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Kütüphaneye Dön</span>
                    </Link>
                    
                    <div className="flex justify-center">
                        <SnixLogo className="w-24 h-24 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white font-brand uppercase tracking-tighter leading-tight">
                        Sezon 16 Jungle <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600">"Tam Kontrol" Doktrini</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Orman artık bir satranç tahtası. Faelights, Homeguards ve "Tam Kontrol" kavramıyla vadinin hakimi ol.
                    </p>
                </div>

                {/* Sekmeler */}
                <div className="flex justify-center sticky top-4 z-50">
                    <div className="inline-flex flex-wrap gap-1 bg-[#050A14]/90 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-2xl">
                        {[
                            { id: 'overview', label: 'GENEL BAKIŞ', icon: Info },
                            { id: 'mindset', label: 'ZİHNİYET (MENTAL)', icon: Brain },
                            { id: 'gameplay', label: 'OYNANIŞ & TAKTİK', icon: Timer },
                            { id: 'champions', label: 'ŞAMPİYONLAR', icon: Shield },
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all text-xs font-brand tracking-widest ${activeTab === tab.id ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-500 hover:text-white'}`}>
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
                            <SectionTitle icon={Info} title="Hoş Geldin Avcı" />
                            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                                <p>Hoş geldin Avcı. Eğer hala eski sezonlardaki gibi "sadece farm yapıp ejder alarak" kazanacağını sanıyorsan, geçmiş olsun. Sezon 16'da orman, artık bireysel yetenekten çok bir satranç tahtasına dönüştü.</p>
                                <p>Yeni <b className="text-emerald-400">"Faelights"</b> sistemiyle her yer aydınlık, <b className="text-emerald-400">"Homeguards"</b> ile herkes hızlı. Bu kaosun içinde hayatta kalmanın tek yolu var: <b>"Tam Kontrol" (Purity) Doktrini.</b> Artık objektifleri değil, alanları kazanmalısın.</p>
                                
                                <div className="bg-gradient-to-r from-emerald-900/20 to-transparent p-6 rounded-r-xl border-l-4 border-emerald-500 my-8">
                                    <p className="italic text-emerald-100/90 font-medium">"Rakibi öldürmek, tam kontrolü sağlamanın bir yan ürünüdür. Asıl amaç skor almak değil, alan hakimiyetidir."</p>
                                </div>
                                
                                <h3 className="font-bold text-xl text-white mt-8 mb-6 font-brand uppercase tracking-wider">Sezon 16'nın 3 Temel Yasası:</h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="bg-[#0f192b]/60 p-6 rounded-xl border border-white/5 hover:border-emerald-500/50 transition-all group">
                                        <div className="p-3 bg-emerald-900/20 w-fit rounded-lg text-emerald-400 mb-4 group-hover:scale-110 transition-transform"><Target className="w-6 h-6"/></div>
                                        <h4 className="text-white font-bold mb-3 font-brand uppercase tracking-wider">1. "TAM KONTROL" (PURITY)</h4>
                                        <p className="text-sm text-gray-400">Öncelik (Priority) yetmez. O bölgeyi tamamen sterilize etmelisin. Rakip ya ölüdür ya da kulesinin altına hapsedilmiştir.</p>
                                    </div>
                                    <div className="bg-[#0f192b]/60 p-6 rounded-xl border border-white/5 hover:border-yellow-500/50 transition-all group">
                                        <div className="p-3 bg-yellow-900/20 w-fit rounded-lg text-yellow-400 mb-4 group-hover:scale-110 transition-transform"><Zap className="w-6 h-6"/></div>
                                        <h4 className="text-white font-bold mb-3 font-brand uppercase tracking-wider">2. HOMEGUARDS SİLAHI</h4>
                                        <p className="text-sm text-gray-400">Base'den çıkışın artık bir saldırı fırsatıdır. 600 hareket hızıyla donmuş koridorlara şok baskınlar yap.</p>
                                    </div>
                                    <div className="bg-[#0f192b]/60 p-6 rounded-xl border border-white/5 hover:border-purple-500/50 transition-all group">
                                        <div className="p-3 bg-purple-900/20 w-fit rounded-lg text-purple-400 mb-4 group-hover:scale-110 transition-transform"><Brain className="w-6 h-6"/></div>
                                        <h4 className="text-white font-bold mb-3 font-brand uppercase tracking-wider">3. MID-GAME BATTLE ROYALE</h4>
                                        <p className="text-sm text-gray-400">Kaos evresinde takımının beyni ol. Haritada görünmeyen düşman en tehlikelisidir. "Geri Çekil" pini senin en güçlü silahın.</p>
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
                                    oldMeta="Ejderha çıktı, hemen nehre koşup pozisyon almalıyım." 
                                    oldReason="Eskiden ormancılık sadece objektif kontrolü ve 'Smite Fight' (Çarp Savaşı) üzerine kuruluydu. Ejderha bir amaçtı, takım savaşı ejderha etrafında dönerdi." 
                                    newMeta="Önce Mid veya Bot lane'e gidip 'Tam Kontrolü' sağlamalıyım." 
                                    newReason="Eğer Mid laner'ın kulesi altındaysa yardıma gelemez. Bu durumda 4v3 veya 4v2 kalırsınız. Snix Doktrini: Önce koridoru kazan (laner'ı kes veya it), sonra sayısal üstünlükle ejderi al. Riske yer yok." 
                                />
                                <ComparisonItem 
                                    oldMeta="Base attım, hemen orman kamplarımı dönmeye devam edeyim." 
                                    oldReason="Pasif oyun tarzı ve farm odaklı yaklaşım. Base dönüşleri sadece market alışverişi ve can yenileme zamanı olarak görülürdü. Haritaya yürüyerek dönmek standarttı." 
                                    newMeta="Homeguards (Sığınak) hızımı kullanarak donmuş bir koridora baskın atmalıyım." 
                                    newReason="Homeguards sana 600 hareket hızı veriyor. Bu hızı sadece koridora yürümek için harcamak israftır. Rakip senin base'de olduğunu sanıp gevşer, ama sen o hızla 15 saniyede tepelerine binersin. Bu hız bir silahtır." 
                                />
                                <ComparisonItem 
                                    oldMeta="Harita karanlık, çalıdan gizlice geçip ejderi çalabilirim." 
                                    oldReason="Sürpriz faktörüne dayalı oyun. Totemlerin kör noktaları vardı ve duvar arkaları güvenliydi. Görünmeden sızmak mümkündü." 
                                    newMeta="Faelights yüzünden her yer aydınlık. Gizlice geçemem, savaşarak geçmeliyim." 
                                    newReason="Yeni 'Faelights' sistemi duvarların arkasını ve çalı içlerini 'röntgen' gibi gösteriyor. Gizlilik bitti. Artık 'Görüş Reddi' (Vision Denial) ve tarayıcı kullanarak, bile bile lades demeden, alanı temizleyerek ilerlemelisin." 
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-white/10">
                                <div className="bg-blue-900/10 border border-blue-500/20 p-8 rounded-2xl text-center hover:border-blue-500/50 transition-colors">
                                    <Target className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                                    <h3 className="font-bold text-xl text-white mb-2 font-brand uppercase">Kazanma Koşulu</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Senin görevin objektiflere son vuruşu yapmak değil, objektif alınırken takımının güvenliğini (Tam Kontrol) sağlamaktır. Rakip ormancıyı oyundan düşürürsen, Baron zaten senindir.
                                    </p>
                                </div>
                                <div className="bg-orange-900/10 border border-orange-500/20 p-8 rounded-2xl text-center hover:border-orange-500/50 transition-colors">
                                    <UserMinus className="w-10 h-10 text-orange-400 mx-auto mb-4" />
                                    <h3 className="font-bold text-xl text-white mb-2 font-brand uppercase">Ego Yönetimi</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        "Ejderhaya vurmayı bırak! Ejderha sadece rakibi sana çeken bir 'Mıknatıs'tır. Rakip menzile girdiği an ejderi bırak, rakibe dön (Turn). Skor almak için değil, alanı temizlemek için savaş."
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* --- OYNANIŞ --- */}
                    {activeTab === 'gameplay' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-red-950/20 border border-red-600/30 rounded-xl p-8 mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl"></div>
                                <div className="flex items-center gap-4 mb-4 relative z-10">
                                    <AlertOctagon className="w-8 h-8 text-red-500" />
                                    <h3 className="text-2xl font-bold text-white font-brand uppercase">Kritik Soru: Objektifi Aldıktan Sonra?</h3>
                                </div>
                                <div className="space-y-4 text-sm text-gray-300 relative z-10 leading-relaxed">
                                    <p><span className="text-red-500 font-bold bg-red-900/20 px-2 py-0.5 rounded border border-red-500/30">CEVAP: BIRAK VE GİT.</span> En büyük hata "Overstay" (Gereğinden fazla kalmak) yapmaktır.</p>
                                    <div className="bg-black/30 p-5 rounded-lg border-l-4 border-red-500">
                                        <p className="font-bold text-white mb-2 tracking-wide uppercase text-xs">MANTIK:</p>
                                        <ul className="list-disc pl-4 space-y-2 text-gray-400">
                                            <li>Objektifi aldın, kaynakların (HP/Mana) tükendi.</li>
                                            <li>Rakip <b className="text-emerald-400">Homeguards</b> ile tam güç ve hızlıca geliyor.</li>
                                            <li>Orada kalırsan yok olursun. Geri çekil, harca ve yenilen.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Card>
                                <SectionTitle icon={Timer} title="Taktiksel Oynanış Detayları" />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <GameplayItem type="do" title="Faelights Noktalarını Ezberle" summary="Görüş artık bir 'Kale'." detail="Faelight noktasına konan totem 45 saniye boyunca her şeyi (duvar arkasını bile) gösterir. Bu 'Açığa Çıkarma Alanı'ndan kaçınmadan hareket edersen avlanırsın. Tarayıcı (Sweeper) zorunludur." />
                                        <GameplayItem type="do" title="Geri Çekil Pini At (Ambessa Kuralı)" summary="Takımını ipten al." detail="Orta oyun kaosunda (Battle Royale) takımın haritada boş boş geziyorsa ve rakip görünmüyorsa (örn: Ambessa), %100 pusu kuruyorlardır. 'Görmüyorum, o zaman en tehlikeli yerdedir' mantığıyla pini at ve takımı kurtar." />
                                        <GameplayItem type="do" title="Rol Görevlerini Takip Et" summary="Güçlenme eğrini yönet." detail="35 kamp temizledikten sonra gelen özel ödülleri kaçırma. Özellikle 'Swiftmarch' çizmeleri yavaşlatma etkilerini %40 azaltır. 'Crimson Lucidity' ise Sıçra süresini kısaltır; oyun tarzına göre seçim yap." />
                                        <GameplayItem type="do" title="İletişim Protokolü Uygula" summary="Global ultiler için haber ver." detail="Nocturne, Pantheon veya Taliyah oynuyorsan, ulti atmadan önce pini at ve 'Geliyorum' de. O 2 saniyelik fark, takımının seninle birlikte girmesini sağlar." />
                                    </div>
                                    <div>
                                        <GameplayItem type="dont" title="Yazı Tura (Coinflip) Atma" summary="Tam Kontrol olmadan ejdere girme." detail="Mid laner'ın yokken veya görüşün yokken %50 şansla ejder denemek, Sezon 16'da oyunu kaybettirir. Minyonlar hızlı doğduğu için telafisi yoktur." />
                                        <GameplayItem type="dont" title="Kristal Kulelere Açgözlülük Yapma" summary="Dive atmak çok daha riskli." detail="'Kristal Aşırı Büyüme' ile kuleler artık 3 vuruşta bir patlayan bonus hasar veriyor. Ayrıca Tier 2 ve Tier 3 kulelerinde artık 3 adet plaka var; bu yüzden yan koridorları boş bırakma, split push yapan rakip çok güçlenir." />
                                        
                                        {/* YENİ EKLENEN 1. HATA */}
                                        <GameplayItem type="dont" title="Karanlığa Rus Ruleti Oynama" summary="Tarayıcı açmadan girme." detail="Yeni görüş noktaları varken tarayıcı açmadan çalıya veya nehre 'yüz kontrolü' (face-check) yapma; önce tarayıcı ile görüşü temizle, sonra ilerle." />

                                        {/* YENİ EKLENEN 2. HATA */}
                                        <GameplayItem type="dont" title="''Bir Dalga Daha'' Tuzağına Düşme" summary="İşin bitti, hemen yok ol." detail="Kuleyi yıktıktan sonra 'bir dalga minyon daha alayım' diye orada bekleme; işin biter bitmez (özellikle kasmış rakipler hayattaysa) anında güvenli bölgeye kaç." />
                                    </div>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-6">
                                <div className="p-6 bg-[#0f192b] rounded-xl border border-white/5 shadow-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="text-3xl font-bold text-white mb-2 font-brand">1. KONTROLÜ KUR</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Koridoru Kazan</div>
                                </div>
                                <div className="p-6 bg-[#0f192b] rounded-xl border border-white/5 shadow-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="text-3xl font-bold text-emerald-400 mb-2 font-brand">2. GÖRÜŞÜ KIR</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Rakibi Kör Et</div>
                                </div>
                                <div className="p-6 bg-[#0f192b] rounded-xl border border-white/5 shadow-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="text-3xl font-bold text-red-500 mb-2 font-brand">3. TUZAĞI KUR</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Gelen Rakibi Avla</div>
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
                                    title="Gankers (Baskıncılar)" 
                                    examples="Örnek: Lee Sin, Elise, Jarvan IV" 
                                    logic="Homeguards stratejisini en iyi uygulayan şampiyonlardır. Erken oyunda 'Tam Kontrol' sağlamak için koridorlara baskı kurma yetenekleri ve mobiliteleri onları vazgeçilmez kılar." 
                                    reason="Hızlı, Agresif, Alan Kontrolü." 
                                />
                                <ChampionCard 
                                    isRecommended={true} 
                                    title="Power Farmers (Güç Çiftçileri)" 
                                    examples="Örnek: Karthus, Graves, Brand" 
                                    logic="Minyon spawn sürelerinin hızlanması ve kampların öneminin artması (Rol görevleri için) bu şampiyonları öne çıkarabilir. Ancak Faelights yüzünden istilaya (invade) uğramaları daha kolaydır, dikkatli olunmalı." 
                                    reason="Yüksek Kaynak, Geç Oyun Garantisi." 
                                />
                                <ChampionCard 
                                    isRecommended={false} 
                                    title="Stealth (Görünmezler)" 
                                    examples="Örnek: Evelynn, Shaco, Fiddlesticks" 
                                    logic="Faelights mekaniği bu şampiyonlar için ciddi bir tehdittir. Duvar arkasından bile görülebildikleri için 'sürpriz' faktörleri elinden alınır. Oynamak için kusursuz 'Vision Denial' gerekir." 
                                    reason="Görüş Sistemi Tarafından Counterlanır." 
                                />
                                <ChampionCard 
                                    isRecommended={false} 
                                    title="Pasif Tanklar" 
                                    examples="Örnek: Amumu, Rammus (Duruma Göre)" 
                                    logic="Eğer erken oyunda 'Tam Kontrol' sağlayamazlarsa ve karşı ormancı 'Homeguards' ile sürekli baskın atarsa, oyun tempo olarak çok geriye düşer. Agresif doktrine terstir." 
                                    reason="Tempo Kaybı, İnisiyatif Eksikliği." 
                                />
                            </Card>
                        </div>
                    )}
                </div>

                <div className="text-center text-gray-600 text-sm mt-12 pt-8 border-t border-white/5 uppercase tracking-[0.2em]">
                    <p className="font-brand text-lg text-emerald-400 opacity-50 mb-2">SNIX GG</p>
                    <p>Orman tesadüflerin değil, mutlak matematiğin sahasıdır. Şansa güvenmeyi bırak; her kampı bir hamle, her baskını bir şah-mat gibi kurgula.</p>
                </div>
            </div>
        </div>
    );
}