"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Check, MessageCircle, Plus, Radio, Target, X } from "lucide-react";
import TeamChatModal from "@/components/TeamChatModal";

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPP", "FILL"] as const;
type Role = (typeof ROLES)[number];
type ToastTone = "success" | "error" | "info";

type TeamPost = {
  id: string;
  title: string;
  description: string;
  rolesNeeded: string[];
  rankRange: string;
  server: string;
  maxPlayers: number;
  isActive: boolean;
  userId: string;
  createdAt: string;
  applicationCount: number;
  acceptedCount: number;
  filledSlots: number;
  hasApplied: boolean;
  myApplicationStatus: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED";
  user: {
    id: string;
    username: string | null;
    imageUrl: string | null;
    mainRole: string;
  };
};

type TeamApplication = {
  id: string;
  desiredRole: string;
  playerInfo: string;
  discord: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  applicant: {
    id: string;
    username: string | null;
    imageUrl: string | null;
    mainRole: string;
  };
};

type ToastItem = {
  id: number;
  tone: ToastTone;
  message: string;
};

const emptyPostForm = {
  title: "",
  description: "",
  rankRange: "",
  server: "TR",
  rolesNeeded: ["MID"] as Role[],
};

const emptyApplyForm = {
  desiredRole: "MID" as Role,
  playerInfo: "",
  discord: "",
};

const roleStyle: Record<string, string> = {
  TOP: "bg-rose-500/20 border-rose-400/40 text-rose-200",
  JUNGLE: "bg-emerald-500/20 border-emerald-400/40 text-emerald-200",
  MID: "bg-cyan-500/20 border-cyan-400/40 text-cyan-200",
  ADC: "bg-amber-500/20 border-amber-400/40 text-amber-200",
  SUPP: "bg-violet-500/20 border-violet-400/40 text-violet-200",
  FILL: "bg-slate-500/20 border-slate-300/40 text-slate-200",
};

const toastToneStyle: Record<ToastTone, string> = {
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  error: "border-red-400/40 bg-red-500/15 text-red-100",
  info: "border-cyan-400/40 bg-cyan-500/15 text-cyan-100",
};

function toErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  return payload as { error?: unknown; details?: unknown };
}

function buildErrorMessage(payload: unknown, fallback: string) {
  const parsed = toErrorPayload(payload);
  const base = typeof parsed?.error === "string" ? parsed.error : fallback;
  const details = typeof parsed?.details === "string" ? parsed.details.trim() : "";
  return details ? `${base} (Detay: ${details})` : base;
}

export default function TeamFinderClient() {
  const { isSignedIn, user } = useUser();
  const [posts, setPosts] = useState<TeamPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingPost, setSendingPost] = useState(false);
  const [sendingApply, setSendingApply] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [postForm, setPostForm] = useState(emptyPostForm);
  const [applyForm, setApplyForm] = useState(emptyApplyForm);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [applyPost, setApplyPost] = useState<TeamPost | null>(null);
  const [ownerAppsPost, setOwnerAppsPost] = useState<TeamPost | null>(null);
  const [chatPost, setChatPost] = useState<TeamPost | null>(null);
  const [ownerApps, setOwnerApps] = useState<TeamApplication[]>([]);
  const [ownerAppsLoading, setOwnerAppsLoading] = useState(false);

  const myUserId = user?.id;
  const myActiveCount = useMemo(
    () => posts.filter((p) => p.userId === myUserId && p.isActive).length,
    [posts, myUserId],
  );

  const acceptedOwnerApps = useMemo(() => ownerApps.filter((a) => a.status === "ACCEPTED"), [ownerApps]);
  const pendingOwnerApps = useMemo(() => ownerApps.filter((a) => a.status === "PENDING"), [ownerApps]);
  const rejectedOwnerApps = useMemo(() => ownerApps.filter((a) => a.status === "REJECTED"), [ownerApps]);

  const ownerMaxPlayers = ownerAppsPost?.maxPlayers ?? 5;
  const ownerFilledSlots = Math.min(ownerMaxPlayers, 1 + acceptedOwnerApps.length);
  const ownerFillPercent = Math.min(100, Math.round((ownerFilledSlots / ownerMaxPlayers) * 100));

  const pushToast = (message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  };

  const fetchPosts = async (role = filterRole) => {
    setLoading(true);
    try {
      const query = role !== "ALL" ? `?role=${encodeURIComponent(role)}` : "";
      const res = await fetch(`/api/teamup${query}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(buildErrorMessage(payload, "İlanlar yüklenemedi."));
      setPosts(payload);
    } catch (error: unknown) {
      setPosts([]);
      pushToast(error instanceof Error ? error.message : "İlanlar yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRoleForPost = (role: Role) => {
    const exists = postForm.rolesNeeded.includes(role);
    const next = exists ? postForm.rolesNeeded.filter((r) => r !== role) : [...postForm.rolesNeeded, role];
    setPostForm((prev) => ({ ...prev, rolesNeeded: next.length ? next : [role] }));
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || sendingPost) return;

    setSendingPost(true);
    try {
      const res = await fetch("/api/teamup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postForm),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast(buildErrorMessage(payload, "İlan oluşturulamadı."), "error");
        return;
      }
      setPostForm(emptyPostForm);
      setIsCreateModalOpen(false);
      pushToast("İlan başarıyla yayınlandı.", "success");
      await fetchPosts();
    } finally {
      setSendingPost(false);
    }
  };

  const openApplyModal = (post: TeamPost) => {
    setApplyPost(post);
    setApplyForm((prev) => ({
      ...prev,
      desiredRole: (post.rolesNeeded[0] as Role) || "MID",
      discord: prev.discord || "",
      playerInfo: "",
    }));
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyPost || !isSignedIn || sendingApply) return;

    setSendingApply(true);
    try {
      const res = await fetch("/api/teamup/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: applyPost.id,
          desiredRole: applyForm.desiredRole,
          playerInfo: applyForm.playerInfo,
          discord: applyForm.discord,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast(buildErrorMessage(payload, "Başvuru gönderilemedi."), "error");
        return;
      }
      setApplyPost(null);
      setApplyForm(emptyApplyForm);
      pushToast("Başvurun gönderildi.", "success");
      await fetchPosts();
    } finally {
      setSendingApply(false);
    }
  };

  const closeMyPost = async (id: string) => {
    const res = await fetch(`/api/teamup?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      pushToast(buildErrorMessage(payload, "İlan kapatılamadı."), "error");
      return;
    }
    pushToast("İlan kapatıldı.", "success");
    await fetchPosts();
  };

  const openOwnerApplications = async (post: TeamPost) => {
    setOwnerAppsPost(post);
    setOwnerApps([]);
    setOwnerAppsLoading(true);
    try {
      const res = await fetch(`/api/teamup/apply?postId=${encodeURIComponent(post.id)}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast(buildErrorMessage(payload, "Başvurular yüklenemedi."), "error");
        setOwnerAppsPost(null);
        return;
      }
      setOwnerApps(payload.applications || []);
    } finally {
      setOwnerAppsLoading(false);
    }
  };

  const handleApplicationDecision = async (applicationId: string, action: "ACCEPT" | "REJECT") => {
    setUpdatingAppId(applicationId);
    try {
      const res = await fetch("/api/teamup/apply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast(buildErrorMessage(payload, "Başvuru güncellenemedi."), "error");
        return;
      }

      pushToast(action === "ACCEPT" ? "Oyuncu kabul edildi." : "Başvuru reddedildi.", "success");
      if (ownerAppsPost) await openOwnerApplications(ownerAppsPost);
      await fetchPosts();
    } finally {
      setUpdatingAppId(null);
    }
  };

  return (
    <div className="min-h-screen -mt-32 bg-[#050A14] text-slate-200 px-4 pb-20 relative overflow-x-hidden">
      <div className="absolute -top-40 left-0 right-0 bottom-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(78%_62%_at_10%_10%,rgba(34,211,238,0.22),rgba(59,130,246,0.12)_36%,rgba(5,10,20,0)_74%)]" />
        <div className="absolute top-28 -right-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="fixed top-24 right-4 z-[260] w-[min(360px,calc(100%-2rem))] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur ${toastToneStyle[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto pt-32 relative z-10">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0A1120]/95 via-[#0B1628]/95 to-[#070D19]/95 p-8 md:p-10 mb-8 shadow-[0_0_40px_rgba(0,255,255,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80 font-bold">Takım Radarı</p>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
                Takım
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400"> Bul</span>
              </h1>
              <p className="text-slate-300 max-w-2xl">
                Takıma katılmak için başvuru yap. İlan sahibi kabul ederse takım doluluğu anında güncellenir.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full lg:w-[360px]">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                <p className="text-[10px] uppercase text-slate-400">Aktif</p>
                <p className="text-xl font-black text-white">{posts.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-center">
                <p className="text-[10px] uppercase text-slate-400">Rol</p>
                <p className="text-xl font-black text-white">6</p>
              </div>
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-center">
                <p className="text-[10px] uppercase text-cyan-200/80">İlan Limitin</p>
                <p className="text-xl font-black text-cyan-200">{myActiveCount}/2</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <Radio size={16} className="text-cyan-300" />
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Filtre</span>
              </div>
              {["ALL", ...ROLES].map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setFilterRole(role);
                    fetchPosts(role);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                    filterRole === role
                      ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-[0_0_20px_rgba(0,255,255,0.15)]"
                      : "bg-black/30 text-slate-400 border-white/10 hover:border-white/20"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-black hover:bg-white transition-colors">
                  Başvuru İçin Giriş Yap
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-black hover:bg-white transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                İlan Yayınla
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-black/25 p-8 text-slate-400">İlanlar yükleniyor...</div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-8">
              <p className="text-white font-bold mb-1">Bu filtrede ilan yok.</p>
              <p className="text-sm text-slate-400">İlk ilanı açıp ekibini toplayabilirsin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => {
                const isOwner = p.userId === myUserId;
                const isFull = p.filledSlots >= p.maxPlayers;
                const canOpenChat = isOwner || p.myApplicationStatus === "ACCEPTED";

                return (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0B1322]/90 to-[#070D17]/90 p-5 md:p-6 hover:border-cyan-400/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-white text-lg font-black tracking-wide">{p.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {p.user.username || "Oyuncu"} | {new Date(p.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-cyan-200 font-bold">Doluluk: {p.filledSlots}/{p.maxPlayers}</p>
                        <p className="text-[11px] text-slate-400">Başvuru: {p.applicationCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {p.rolesNeeded.map((r) => (
                        <span
                          key={r}
                          className={`text-[11px] px-2.5 py-1 rounded-md border font-bold ${roleStyle[r] || roleStyle.FILL}`}
                        >
                          {r}
                        </span>
                      ))}
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">
                        {p.rankRange || "Fark etmez"}
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">
                        {p.server}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap mb-4">{p.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                        <MessageCircle size={15} />
                        İletişim: Başvurun kabul edilirse ilan sahibi seninle iletişime geçer
                      </div>

                      <div className="flex items-center gap-2">
                        {canOpenChat ? (
                          <button
                            onClick={() => setChatPost(p)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-bold"
                          >
                            Takım Sohbeti
                          </button>
                        ) : null}

                        {isOwner ? (
                          <>
                            <button
                              onClick={() => openOwnerApplications(p)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-bold"
                            >
                              Başvurular ({p.applicationCount})
                            </button>
                            <button
                              onClick={() => closeMyPost(p.id)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 font-bold"
                            >
                              İlanı Kapat
                            </button>
                          </>
                        ) : !isSignedIn ? (
                          <SignInButton mode="modal">
                            <button className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold">Takıma Katıl</button>
                          </SignInButton>
                        ) : p.myApplicationStatus === "ACCEPTED" ? (
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
                            Kabul Edildi
                          </span>
                        ) : p.hasApplied ? (
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-bold">
                            Başvuru Yapıldı
                          </span>
                        ) : isFull ? (
                          <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-500/15 border border-slate-400/30 text-slate-300 font-bold">
                            Takım Dolu
                          </span>
                        ) : (
                          <button
                            onClick={() => openApplyModal(p)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold"
                          >
                            Takıma Katıl
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {isCreateModalOpen && isSignedIn ? (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <button onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-gradient-to-b from-[#0B1322] to-[#070D17] p-6 md:p-7">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-white font-black text-2xl">İlan Yayınla</h2>
                <p className="text-sm text-slate-400 mt-1">Maksimum 2 aktif ilan açabilirsin.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {myActiveCount >= 2 ? (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200 text-sm">
                Aktif ilan limitine ulaştın. Yeni ilan açmak için önce bir ilanı kapat.
              </div>
            ) : (
              <form onSubmit={createPost} className="space-y-4">
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Başlık (örn: Clash ekibi arıyorum)"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm"
                  maxLength={80}
                  required
                />
                <textarea
                  value={postForm.description}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Saatlerin, beklentin, oyun stilin..."
                  className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm h-28 resize-none"
                  maxLength={800}
                  required
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-bold mb-2">Aranan Roller</p>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => toggleRoleForPost(r)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border font-bold transition-all ${
                          postForm.rolesNeeded.includes(r)
                            ? `${roleStyle[r]} shadow-[0_0_15px_rgba(0,0,0,0.25)]`
                            : "bg-black/30 border-white/10 text-slate-400"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={postForm.rankRange}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, rankRange: e.target.value }))}
                    placeholder="Lig Aralığı (Emerald+)"
                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm"
                    maxLength={40}
                  />
                  <input
                    value={postForm.server}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, server: e.target.value }))}
                    placeholder="Sunucu (TR, EUW...)"
                    className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm"
                    maxLength={20}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingPost}
                  className="px-5 py-2.5 rounded-lg bg-cyan-500 text-black font-black hover:bg-white transition-colors disabled:opacity-60"
                >
                  {sendingPost ? "Gönderiliyor..." : "Yayınla"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {applyPost && isSignedIn ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
          <button onClick={() => setApplyPost(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-gradient-to-b from-[#0B1322] to-[#070D17] p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-white font-black text-2xl">Takıma Katıl</h2>
                <p className="text-sm text-slate-400 mt-1">{applyPost.title}</p>
              </div>
              <button
                onClick={() => setApplyPost(null)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitApplication} className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-bold mb-2">Başvurduğun Rol</p>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setApplyForm((prev) => ({ ...prev, desiredRole: r }))}
                      className={`text-[11px] px-2.5 py-1 rounded-md border font-bold transition-all ${
                        applyForm.desiredRole === r
                          ? `${roleStyle[r]} shadow-[0_0_15px_rgba(0,0,0,0.25)]`
                          : "bg-black/30 border-white/10 text-slate-400"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <input
                value={applyForm.discord}
                onChange={(e) => setApplyForm((prev) => ({ ...prev, discord: e.target.value }))}
                placeholder="Discord kullanıcı adın (örn: snix#1234)"
                className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm"
                maxLength={50}
                required
              />

              <textarea
                value={applyForm.playerInfo}
                onChange={(e) => setApplyForm((prev) => ({ ...prev, playerInfo: e.target.value }))}
                placeholder="Kendini tanıt: lig, oyun saatlerin, shotcall/oyun tarzın..."
                className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm h-28 resize-none"
                maxLength={400}
                required
              />

              <button
                type="submit"
                disabled={sendingApply}
                className="px-5 py-2.5 rounded-lg bg-cyan-500 text-black font-black hover:bg-white transition-colors disabled:opacity-60"
              >
                {sendingApply ? "Gönderiliyor..." : "Başvuru Gönder"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {ownerAppsPost ? (
        <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
          <button onClick={() => setOwnerAppsPost(null)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-gradient-to-b from-[#0B1322] to-[#070D17] p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-full">
                <h2 className="text-white font-black text-2xl">Başvurular</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {ownerAppsPost.title} | Doluluk: {ownerFilledSlots}/{ownerMaxPlayers} ({ownerFillPercent}%)
                </p>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                    style={{ width: `${ownerFillPercent}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => setOwnerAppsPost(null)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {ownerAppsLoading ? (
              <div className="rounded-xl border border-white/10 p-6 text-slate-400">Başvurular yükleniyor...</div>
            ) : ownerApps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 p-6 text-slate-400">Henüz başvuru yok.</div>
            ) : (
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                <section className="rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200 font-bold mb-3">
                    Kabul Edilen Oyuncular ({acceptedOwnerApps.length})
                  </p>
                  {acceptedOwnerApps.length === 0 ? (
                    <p className="text-sm text-emerald-100/80">Henüz kabul edilen oyuncu yok.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {acceptedOwnerApps.map((a) => (
                        <div key={a.id} className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3">
                          <p className="text-sm text-white font-bold">
                            {a.applicant.username || "Oyuncu"} | {a.desiredRole}
                          </p>
                          <p className="text-xs text-emerald-100/90 mt-1">Discord: {a.discord}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-amber-400/20 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-amber-200 font-bold mb-3">
                    Bekleyen Başvurular ({pendingOwnerApps.length})
                  </p>
                  {pendingOwnerApps.length === 0 ? (
                    <p className="text-sm text-slate-300">Bekleyen başvuru yok.</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingOwnerApps.map((a) => (
                        <div key={a.id} className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-white font-bold">
                              {a.applicant.username || "Oyuncu"} | {a.desiredRole}
                            </p>
                            <span className="text-[11px] px-2 py-1 rounded border text-amber-200 border-amber-400/40 bg-amber-500/15">
                              BEKLEMEDE
                            </span>
                          </div>

                          <p className="text-xs text-slate-300">Discord: {a.discord}</p>
                          <p className="text-sm text-slate-200 whitespace-pre-wrap">{a.playerInfo}</p>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={updatingAppId === a.id}
                              onClick={() => handleApplicationDecision(a.id, "ACCEPT")}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold disabled:opacity-50 flex items-center gap-1"
                            >
                              <Check size={13} />
                              Kabul Et
                            </button>
                            <button
                              disabled={updatingAppId === a.id}
                              onClick={() => handleApplicationDecision(a.id, "REJECT")}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-200 font-bold disabled:opacity-50"
                            >
                              Reddet
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {rejectedOwnerApps.length > 0 ? (
                  <section className="rounded-xl border border-red-400/20 bg-red-500/5 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-red-200 font-bold mb-3">
                      Reddedilen Başvurular ({rejectedOwnerApps.length})
                    </p>
                    <div className="space-y-2">
                      {rejectedOwnerApps.map((a) => (
                        <div key={a.id} className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2">
                          <p className="text-sm text-red-100">
                            {a.applicant.username || "Oyuncu"} | {a.desiredRole}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-4">
              <Target size={14} />
              Kabul edilen her oyuncu takım doluluğunu artırır (örn: 2/5).
            </div>
          </div>
        </div>
      ) : null}

      <TeamChatModal
        isOpen={Boolean(chatPost)}
        postId={chatPost?.id ?? null}
        postTitle={chatPost?.title ?? ""}
        onClose={() => setChatPost(null)}
        pushToast={pushToast}
      />
    </div>
  );
}

