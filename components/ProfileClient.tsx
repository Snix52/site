"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sword, Shield, Target, Zap, Edit2, Save, X, User,
  Trophy, Hash, Gamepad2, Map, Loader2, ShoppingBag, Check
} from 'lucide-react';
import Link from 'next/link';

import AvatarFrame, { FRAMES } from './AvatarFrame'; 

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
  selectedFrame?: string;
  ownedFrames: string[];
  createdAt: Date;
}

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPP"];

export default function ProfileClient({ user }: { user: UserData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [championList, setChampionList] = useState<string[]>([]);
  const [loadingChamps, setLoadingChamps] = useState(true);

  const [formData, setFormData] = useState({
    bio: user.bio || "",
    mainRole: user.mainRole === "UNSELECTED" ? "MID" : user.mainRole,
    favoriteChamp: user.favoriteChamp === "None" ? "Ahri" : user.favoriteChamp,
    rankGoal: user.rankGoal || "Challenger",
    socialDiscord: user.socialDiscord || "",
    selectedFrame: user.selectedFrame || "BASIC",
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

  const GLASS_STYLE = "bg-black/30 border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] rounded-2xl";

  return (
    <div className="min-h-screen bg-[#050A14] text-white pb-20 relative font-sans">
      
      {/* ARKA PLAN */}
      <div className="fixed inset-0 w-full h-full z-0">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-transparent to-transparent z-20"></div>
        <img src={getSplashArt(formData.favoriteChamp)} alt="Background" className="w-full h-full object-cover object-top opacity-80" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-30 pt-40">
        
        {/* ÜST KART */}
        <div className={`${GLASS_STYLE} p-8 mb-8 flex flex-col md:flex-row items-center gap-8`}>
          <div className="relative group shrink-0 mx-auto md:mx-0">
             {/* Buradaki büyük çerçeve (Hero) varsayılan boyutta kalsın (w-44 h-44) */}
             <AvatarFrame src={user.imageUrl || ""} frameType={formData.selectedFrame} />
          </div>

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

          <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shrink-0">
            {isEditing ? <X className="w-4 h-4 text-red-400"/> : <Edit2 className="w-4 h-4 text-emerald-400"/>}
            {isEditing ? "Vazgeç" : "Profili Düzenle"}
          </button>
        </div>

        {/* ALT IZGARA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {isEditing && (
                    <div className={`${GLASS_STYLE} p-6 animate-in slide-in-from-top-4 duration-300`}>
                        <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                            <Target className="w-5 h-5 text-emerald-400" /> Kimlik Güncelleme
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Main Rol</label>
                                <select value={formData.mainRole} onChange={(e) => setFormData({...formData, mainRole: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none">
                                    {ROLES.map(role => <option key={role} value={role} className="bg-black">{role}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Favori Şampiyon</label>
                                <select value={formData.favoriteChamp} onChange={(e) => setFormData({...formData, favoriteChamp: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" disabled={loadingChamps}>
                                    {championList.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                                </select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Hedef Lig</label>
                                <input type="text" value={formData.rankGoal} onChange={(e) => setFormData({...formData, rankGoal: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold pl-1">Discord</label>
                                <input type="text" value={formData.socialDiscord} onChange={(e) => setFormData({...formData, socialDiscord: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" />
                            </div>
                        </div>

                        {/* 🖼️ ÇERÇEVE SEÇİMİ (ENVANTER) */}
                        <div className="space-y-3 border-t border-white/10 pt-6 mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm text-emerald-400 uppercase font-bold flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4"/> Envanterin
                                </label>
                                <Link href="/market" className="text-xs text-yellow-400 hover:text-yellow-300 font-bold underline">
                                    Markete Git →
                                </Link>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {/* 🛠️ SADECE SAHİP OLUNANLARI GÖSTER (user.ownedFrames) */}
                                {Object.keys(FRAMES)
                                    .filter(frame => user.ownedFrames.includes(frame)) // Filtreleme işlemi
                                    .map((frame) => {
                                    const isSelected = formData.selectedFrame === frame;

                                    return (
                                        <div key={frame} className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                            isSelected 
                                            ? "bg-emerald-500/10 border-emerald-500/50" 
                                            : "bg-black/40 border-white/10"
                                        }`}>
                                            {/* Küçük Boyutlandırma: w-20 h-20 */}
                                            <div className="relative flex justify-center">
                                                <AvatarFrame 
                                                    src={user.imageUrl || ""} 
                                                    frameType={frame} 
                                                    className="w-20 h-20" 
                                                />
                                            </div>
                                            
                                            <span className="text-[10px] font-bold text-gray-300 truncate w-full text-center">{frame}</span>

                                            <button
                                                onClick={() => setFormData({...formData, selectedFrame: frame})}
                                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${
                                                    isSelected 
                                                    ? "bg-emerald-500 text-black cursor-default" 
                                                    : "bg-white/10 hover:bg-white/20 text-white"
                                                }`}
                                            >
                                                {isSelected ? <><Check className="w-3 h-3"/> Seçili</> : "Kullan"}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        
                        <div className="col-span-1 md:col-span-2 space-y-2 mt-6">
                            <label className="text-xs text-gray-400 uppercase font-bold pl-1">Biyografi</label>
                            <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-gray-200 h-24 resize-none" />
                        </div>

                        <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                            <button onClick={handleSave} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-8 rounded-xl flex items-center gap-2">
                                {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"} <Save className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                )}

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

            <div className="space-y-6">
                <div className={`${GLASS_STYLE} p-6`}>
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-4 tracking-widest">OYUNCU KARTI</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300"><Sword className="w-4 h-4 text-red-400" /> Favori</div>
                            <span className="font-bold text-white">{formData.favoriteChamp}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300"><Target className="w-4 h-4 text-blue-400" /> Hedef</div>
                            <span className="font-bold text-white">{formData.rankGoal}</span>
                        </div>
                         <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300"><Hash className="w-4 h-4 text-purple-400" /> Discord</div>
                            <span className="font-bold text-xs text-white select-all">{formData.socialDiscord || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3 text-sm text-gray-300"><Map className="w-4 h-4 text-yellow-400" /> Kayıt</div>
                            <span className="font-bold text-xs text-white">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}