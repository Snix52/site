"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sword, Shield, Target, Zap, Edit2, Save, X, User,
  Trophy, Hash, Gamepad2, Map, Loader2
} from 'lucide-react';

interface UserData {
  id: string;
  username: string | null;
  imageUrl: string | null;
  currentPoints: number;
  streak: number;
  bio: string | null;
  mainRole: string;
  favoriteChamp: string;
  rankGoal: string;
  socialDiscord: string | null;
  createdAt: Date;
}

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPP"];

export default function ProfileClient({ user }: { user: UserData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Şampiyon Listesi
  const [championList, setChampionList] = useState<string[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(true);

  const [formData, setFormData] = useState({
    bio: user.bio || "",
    mainRole: user.mainRole === "UNSELECTED" ? "MID" : user.mainRole,
    favoriteChamp: user.favoriteChamp === "None" ? "Ahri" : user.favoriteChamp,
    rankGoal: user.rankGoal || "Challenger",
    socialDiscord: user.socialDiscord || "",
  });

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const versionRes = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionRes.json();
        const latestVersion = versions[0]; 

        const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/tr_TR/champion.json`);
        const data = await response.json();
        const names = Object.keys(data.data).sort(); 
        setChampionList(names);
      } catch (error) {
        setChampionList(["Ahri", "Yasuo", "Zed"]); 
      } finally {
        setLoadingChamps(false);
      }
    };
    fetchChampions();
  }, []);

  const getSplashArt = (champName: string) => {
    let formatted = champName.replace(/\s+/g, '');
    if (formatted === "Wukong") formatted = "MonkeyKing";
    if (formatted === "RenataGlasc") formatted = "Renata";
    if (formatted === "Nunu&Willump") formatted = "Nunu";
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${formatted}_0.jpg`;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Hata");
      setIsEditing(false);
      router.refresh(); 
    } catch (error) {
      alert("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Navbar Stili (Aynısı)
  const GLASS_STYLE = "bg-black/30 border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] rounded-2xl";

  return (
    <div className="min-h-screen bg-[#050A14] text-white pb-20 relative font-sans">
      
      {/* 🔥 DÜZELTİLEN ARKA PLAN 🔥
          - fixed: Sayfa kaydırılsa bile resim sabit kalır (Parallax etkisi).
          - inset-0: Dört bir yana yapışır.
          - z-0: En arkada durur.
          - object-cover: Resmi bozmadan ekranı doldurur.
      */}
      <div className="fixed inset-0 w-full h-full z-0">
        {/* Karartma Katmanı (Resmin üstüne hafif siyah atıyoruz ki yazılar okunsun) */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        {/* Alt taraftan yumuşak geçiş (Gradient) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-transparent to-transparent z-20"></div>

        <img 
          src={getSplashArt(formData.favoriteChamp)} 
          alt="Background" 
          className="w-full h-full object-cover object-top opacity-80"
        />
      </div>

      {/* İçerik Kutusu (Resmin üzerinde duracak) */}
      <div className="max-w-6xl mx-auto px-4 relative z-30 pt-40">
        
        {/* --- ÜST KART --- */}
        <div className={`${GLASS_STYLE} p-8 mb-8 flex flex-col md:flex-row items-center gap-8`}>
          
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
            <img 
              src={user.imageUrl || "https://github.com/shadcn.png"} 
              alt="Avatar" 
              className="relative w-36 h-36 rounded-full border-4 border-black/50 object-cover"
            />
            <div className="absolute bottom-1 right-1 bg-black/80 p-2 rounded-full border border-white/10 text-emerald-400">
               <Shield className="w-6 h-6" />
            </div>
          </div>

          {/* İsim & Rol */}
          <div className="text-center md:text-left flex-1 w-full">
             <h1 className="text-5xl font-black italic tracking-tighter text-white mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] truncate">
                {user.username || "İsimsiz Avcı"}
             </h1>
             <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4" /> {user.streak} Gün Streak
                </span>
                <span className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" /> {formData.mainRole}
                </span>
                <span className="px-4 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> {user.currentPoints} SP
                </span>
             </div>
          </div>

          {/* Düzenle Butonu */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shrink-0"
          >
            {isEditing ? <X className="w-4 h-4 text-red-400"/> : <Edit2 className="w-4 h-4 text-emerald-400"/>}
            {isEditing ? "Vazgeç" : "Profili Düzenle"}
          </button>
        </div>

        {/* --- ALT IZGARA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SOL: DETAYLAR */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* EDİT MODU */}
                {isEditing && (
                    <div className={`${GLASS_STYLE} p-6 animate-in slide-in-from-top-4 duration-300`}>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                            <Target className="w-5 h-5 text-emerald-400" /> Kimlik Güncelleme
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Main Rol</label>
                                <select 
                                    value={formData.mainRole}
                                    onChange={(e) => setFormData({...formData, mainRole: e.target.value})}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                >
                                    {ROLES.map(role => <option key={role} value={role} className="bg-black">{role}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">
                                    Favori Şampiyon {loadingChamps && <Loader2 className="inline w-3 h-3 animate-spin"/>}
                                </label>
                                <select 
                                    value={formData.favoriteChamp}
                                    onChange={(e) => setFormData({...formData, favoriteChamp: e.target.value})}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                                    disabled={loadingChamps}
                                >
                                    {championList.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Hedef Lig</label>
                                <input 
                                    type="text" 
                                    value={formData.rankGoal}
                                    onChange={(e) => setFormData({...formData, rankGoal: e.target.value})}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none placeholder-white/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Discord</label>
                                <input 
                                    type="text" 
                                    value={formData.socialDiscord}
                                    onChange={(e) => setFormData({...formData, socialDiscord: e.target.value})}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none placeholder-white/20"
                                />
                            </div>
                            
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Biyografi</label>
                                <textarea 
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-gray-200 focus:border-emerald-500 focus:outline-none transition-colors h-24 resize-none placeholder-white/20"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                            >
                                {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"} <Save className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                )}

                {/* BİYOGRAFİ (Normal Mod) */}
                {!isEditing && (
                    <div className={`${GLASS_STYLE} p-6`}>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-4 border-b border-white/5 pb-2">
                            <User className="w-5 h-5 text-emerald-400" /> Biyografi
                        </h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap font-medium drop-shadow-md">
                            {user.bio || "Bu avcı henüz kendini tanıtmadı. Gizemli takılıyor..."}
                        </p>
                    </div>
                )}
            </div>

            {/* SAĞ: İSTATİSTİKLER */}
            <div className="space-y-6">
                <div className={`${GLASS_STYLE} p-6`}>
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 tracking-widest">OYUNCU KARTI</h4>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Sword className="w-4 h-4 text-red-400" /> Favori
                            </div>
                            <span className="font-bold text-white drop-shadow-md">{formData.favoriteChamp}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Target className="w-4 h-4 text-blue-400" /> Hedef
                            </div>
                            <span className="font-bold text-white drop-shadow-md">{formData.rankGoal}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Hash className="w-4 h-4 text-purple-400" /> Discord
                            </div>
                            <span className="font-bold text-xs text-white select-all drop-shadow-md">{formData.socialDiscord || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Map className="w-4 h-4 text-yellow-400" /> Kayıt
                            </div>
                            <span className="font-bold text-xs text-white drop-shadow-md">
                                {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}