"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sword, Target, Zap, Edit2, Save, X, User,
  Trophy, Hash, Gamepad2, Map, ShoppingBag, Check, ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import AvatarFrame, { FRAMES } from './AvatarFrame'; 
import { useSystemToast } from "@/components/SystemToastProvider";

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
const REPORT_REASON_OPTIONS = [
  { value: "TOXIC_BEHAVIOR", label: "Toksik Davranis" },
  { value: "HARASSMENT", label: "Hakaret / Taciz" },
  { value: "CHEATING", label: "Hile / Script" },
  { value: "SPAM", label: "Spam / Flood" },
  { value: "FAKE_PROFILE", label: "Sahte Profil" },
  { value: "OTHER", label: "Diger" },
] as const;

type ProfileVoteValue = "LIKE" | "DISLIKE" | null;

type VoteUserPreview = {
  id: string;
  username: string | null;
  imageUrl: string | null;
  selectedFrame: string | null;
};

type ProfileVotesState = {
  likes: number;
  dislikes: number;
  myVote: ProfileVoteValue;
  canVote: boolean;
  targetUserId: string;
  likeVoters: VoteUserPreview[];
  dislikeVoters: VoteUserPreview[];
};

type ProfileClientProps = {
  user: UserData;
  canEdit?: boolean;
  profileVotes?: ProfileVotesState;
};

export default function ProfileClient({ user, canEdit = true, profileVotes }: ProfileClientProps) {
  const router = useRouter();
  const { pushToast } = useSystemToast();
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
  const [voteState, setVoteState] = useState<ProfileVotesState>({
    likes: profileVotes?.likes ?? 0,
    dislikes: profileVotes?.dislikes ?? 0,
    myVote: profileVotes?.myVote ?? null,
    canVote: profileVotes?.canVote ?? false,
    targetUserId: profileVotes?.targetUserId ?? user.id,
    likeVoters: profileVotes?.likeVoters ?? [],
    dislikeVoters: profileVotes?.dislikeVoters ?? [],
  });
  const [voteLoading, setVoteLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("TOXIC_BEHAVIOR");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      bio: user.bio || "",
      mainRole: user.mainRole === "UNSELECTED" ? "MID" : user.mainRole,
      favoriteChamp: user.favoriteChamp === "None" ? "Ahri" : user.favoriteChamp,
      rankGoal: user.rankGoal || "Challenger",
      socialDiscord: user.socialDiscord || "",
      selectedFrame: user.selectedFrame || "BASIC",
    });
    setIsEditing(false);
  }, [
    user.id,
    user.bio,
    user.mainRole,
    user.favoriteChamp,
    user.rankGoal,
    user.socialDiscord,
    user.selectedFrame,
  ]);

  useEffect(() => {
    if (!canEdit) setIsEditing(false);
  }, [canEdit]);

  useEffect(() => {
    setVoteState({
      likes: profileVotes?.likes ?? 0,
      dislikes: profileVotes?.dislikes ?? 0,
      myVote: profileVotes?.myVote ?? null,
      canVote: profileVotes?.canVote ?? false,
      targetUserId: profileVotes?.targetUserId ?? user.id,
      likeVoters: profileVotes?.likeVoters ?? [],
      dislikeVoters: profileVotes?.dislikeVoters ?? [],
    });
  }, [profileVotes, user.id]);

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
      } catch {
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

  const toVoteUsers = (value: unknown): VoteUserPreview[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const candidate = item as Record<string, unknown>;
        if (typeof candidate.id !== "string") return null;
        return {
          id: candidate.id,
          username: typeof candidate.username === "string" ? candidate.username : null,
          imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : null,
          selectedFrame: typeof candidate.selectedFrame === "string" ? candidate.selectedFrame : null,
        } satisfies VoteUserPreview;
      })
      .filter((user): user is VoteUserPreview => Boolean(user));
  };

  const handleSave = async () => {
    if (!canEdit) return;
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
    } catch {
      pushToast("Hata olustu.", "error");
    } finally {
      setLoading(false);
    }
  };

  const applyVotePayload = (payload: unknown, fallbackMyVote?: ProfileVoteValue) => {
    const safePayload = payload as Record<string, unknown>;
    const hasLikeVoters = Array.isArray(safePayload?.likeVoters);
    const hasDislikeVoters = Array.isArray(safePayload?.dislikeVoters);
    const likeVoters = toVoteUsers(safePayload?.likeVoters);
    const dislikeVoters = toVoteUsers(safePayload?.dislikeVoters);

    setVoteState((prev) => ({
      ...prev,
      likes: typeof safePayload?.likes === "number" ? safePayload.likes : prev.likes,
      dislikes: typeof safePayload?.dislikes === "number" ? safePayload.dislikes : prev.dislikes,
      myVote: (safePayload?.myVote as ProfileVoteValue) ?? fallbackMyVote ?? prev.myVote,
      likeVoters: hasLikeVoters ? likeVoters : prev.likeVoters,
      dislikeVoters: hasDislikeVoters ? dislikeVoters : prev.dislikeVoters,
    }));
  };

  const handleProfileVote = async (value: Exclude<ProfileVoteValue, null>) => {
    if (!voteState.canVote || voteLoading) return;

    setVoteLoading(true);
    try {
      const res = await fetch("/api/profile-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: voteState.targetUserId,
          value,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        applyVotePayload(payload);
        const message = (payload as Record<string, unknown>)?.error;
        pushToast(typeof message === "string" ? message : "Oy gonderilemedi.", "error");
        return;
      }

      applyVotePayload(payload, value);
    } catch {
      pushToast("Oy gonderilirken hata olustu.", "error");
    } finally {
      setVoteLoading(false);
    }
  };

  const handleSubmitProfileReport = async () => {
    if (canEdit || reportSubmitting) return;
    const trimmed = reportDetails.trim();
    if (trimmed.length < 6) {
      pushToast("Aciklama en az 6 karakter olmali.", "info");
      return;
    }

    setReportSubmitting(true);
    try {
      const res = await fetch("/api/profile-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: voteState.targetUserId,
          reason: reportReason,
          details: trimmed,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (payload as Record<string, unknown>)?.error;
        pushToast(typeof message === "string" ? message : "Rapor gonderilemedi.", "error");
        return;
      }

      setIsReportOpen(false);
      setReportDetails("");
      setReportReason("TOXIC_BEHAVIOR");
      pushToast("Rapor admin paneline iletildi.", "success");
    } catch {
      pushToast("Rapor gonderilirken hata olustu.", "error");
    } finally {
      setReportSubmitting(false);
    }
  };

  const GLASS_STYLE = "bg-black/30 border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.2)] rounded-2xl";
  const voteButtonBase =
    "flex items-center gap-1.5 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const likeButtonClass =
    voteState.myVote === "LIKE"
      ? "text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
      : "text-cyan-300/85 hover:text-cyan-100";
  const dislikeButtonClass =
    voteState.myVote === "DISLIKE"
      ? "text-red-300 drop-shadow-[0_0_8px_rgba(248,113,113,0.45)]"
      : "text-red-300/85 hover:text-red-200";

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
        <div className={`${GLASS_STYLE} relative p-8 mb-8 flex flex-col md:flex-row items-center gap-8`}>
          {!canEdit ? (
            <button
              onClick={() => setIsReportOpen(true)}
              className="absolute right-4 top-4 h-10 w-10 rounded-xl text-red-300 hover:text-red-200 transition-colors flex items-center justify-center"
              title="Profili sikayet et"
              aria-label="Profili sikayet et"
            >
              <AlertCircle className="w-5 h-5" />
            </button>
          ) : null}

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

             <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                <div className="relative group">
                  <button
                    onClick={() => handleProfileVote("LIKE")}
                    disabled={!voteState.canVote || voteLoading}
                    className={`${voteButtonBase} ${likeButtonClass}`}
                    aria-label="Like"
                    title="Like"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-xs">{voteState.likes}</span>
                  </button>

                  <div className="absolute left-0 top-full z-40 pt-2 opacity-0 invisible pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto">
                    <div className="w-52 rounded-xl border border-cyan-300/35 bg-[#071322]/95 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
                      {voteState.likeVoters.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-slate-400">Henuz like yok</p>
                      ) : (
                        <div className="max-h-44 overflow-y-auto space-y-1">
                          {voteState.likeVoters.map((voteUser) => (
                            <Link
                              key={`like-hover-${voteUser.id}`}
                              href={`/profil?userId=${encodeURIComponent(voteUser.id)}`}
                              className="block rounded-md px-2 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/12 hover:text-cyan-50 transition-colors truncate"
                            >
                              {voteUser.username || "Isimsiz oyuncu"}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <button
                    onClick={() => handleProfileVote("DISLIKE")}
                    disabled={!voteState.canVote || voteLoading}
                    className={`${voteButtonBase} ${dislikeButtonClass}`}
                    aria-label="Dislike"
                    title="Dislike"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <span className="text-xs">{voteState.dislikes}</span>
                  </button>

                  <div className="absolute left-0 top-full z-40 pt-2 opacity-0 invisible pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto">
                    <div className="w-52 rounded-xl border border-red-300/35 bg-[#071322]/95 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
                      {voteState.dislikeVoters.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-slate-400">Henuz dislike yok</p>
                      ) : (
                        <div className="max-h-44 overflow-y-auto space-y-1">
                          {voteState.dislikeVoters.map((voteUser) => (
                            <Link
                              key={`dislike-hover-${voteUser.id}`}
                              href={`/profil?userId=${encodeURIComponent(voteUser.id)}`}
                              className="block rounded-md px-2 py-1.5 text-xs text-red-100 hover:bg-red-400/12 hover:text-red-50 transition-colors truncate"
                            >
                              {voteUser.username || "Isimsiz oyuncu"}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
             </div>
             {!voteState.canVote && (
               <p className="mt-2 text-xs text-slate-400">Kendi profiline oy veremezsin.</p>
             )}
          </div>

          {canEdit ? (
            <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shrink-0">
              {isEditing ? <X className="w-4 h-4 text-red-400"/> : <Edit2 className="w-4 h-4 text-emerald-400"/>}
              {isEditing ? "Vazgeç" : "Profili Düzenle"}
            </button>
          ) : null}
        </div>

        {/* ALT IZGARA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {isEditing && canEdit && (
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

                        {/* ÇERÇEVE SEÇİMİ (ENVANTER) */}
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
                                {/*  SADECE SAHİP OLUNANLARI GÖSTER (user.ownedFrames) */}
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

      {!canEdit && isReportOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-400/35 bg-[#091120] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-red-300 text-xs uppercase tracking-[0.18em] font-bold">Rapor Gonder</p>
                <h3 className="text-white font-bold text-lg mt-1">Profili Sikayet Et</h3>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="h-8 w-8 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:border-white/30 transition-colors flex items-center justify-center"
                aria-label="Rapor penceresini kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Sebep</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-300/60"
                >
                  {REPORT_REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Aciklama</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Kisaca neden raporladigini yaz..."
                  maxLength={600}
                  className="w-full h-28 resize-none bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-300/60"
                />
                <p className="mt-1 text-[11px] text-slate-400">{reportDetails.length}/600</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="px-3 py-2 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:border-white/30 text-sm"
                  disabled={reportSubmitting}
                >
                  Vazgec
                </button>
                <button
                  onClick={handleSubmitProfileReport}
                  className="px-4 py-2 rounded-lg bg-red-500/80 text-white font-semibold hover:bg-red-500 text-sm disabled:opacity-60"
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? "Gonderiliyor..." : "Raporu Gonder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




