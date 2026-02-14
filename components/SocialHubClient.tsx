"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  Check,
  Loader2,
  Search,
  Send,
  Trash2,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { getPusherClient, isPusherClientConfigured } from "@/lib/pusher-client";
import {
  GLOBAL_CHAT_CHANNEL,
  GLOBAL_CHAT_EVENT,
  GLOBAL_CHAT_MAX_MESSAGE_LENGTH,
} from "@/lib/global-chat";

type ToastTone = "success" | "error" | "info";

type FriendProfile = {
  id: string;
  username: string | null;
  imageUrl: string | null;
  mainRole: string;
};

type FriendItem = {
  id: string;
  createdAt: string;
  user: FriendProfile;
};

type IncomingRequest = {
  id: string;
  createdAt: string;
  sender: FriendProfile;
};

type OutgoingRequest = {
  id: string;
  createdAt: string;
  recipient: FriendProfile;
};

type SearchRelationship = "NONE" | "FRIEND" | "INCOMING_PENDING" | "OUTGOING_PENDING";

type SearchResult = FriendProfile & {
  relationship: SearchRelationship;
};

type FriendsPayload = {
  friends: FriendItem[];
  incomingRequests: IncomingRequest[];
  outgoingRequests: OutgoingRequest[];
  searchResults: SearchResult[];
  error?: string;
};

type GlobalChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: FriendProfile;
};

type GlobalChatPayload = {
  messages?: GlobalChatMessage[];
  realtimeEnabled?: boolean;
  error?: string;
};

type ToastItem = {
  id: number;
  tone: ToastTone;
  message: string;
};

const defaultFriendsPayload: FriendsPayload = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
};

const toastToneStyle: Record<ToastTone, string> = {
  success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  error: "border-red-400/40 bg-red-500/15 text-red-100",
  info: "border-cyan-400/40 bg-cyan-500/15 text-cyan-100",
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const value = (payload as { error?: unknown }).error;
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function usernameOf(profile: FriendProfile) {
  return profile.username?.trim() || "Oyuncu";
}

function upsertChatMessage(list: GlobalChatMessage[], incoming: GlobalChatMessage) {
  if (list.some((item) => item.id === incoming.id)) return list;
  return [...list, incoming];
}

export default function SocialHubClient() {
  const { isSignedIn, user } = useUser();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendActionLoadingKey, setFriendActionLoadingKey] = useState<string | null>(null);
  const [friendsPayload, setFriendsPayload] = useState<FriendsPayload>(defaultFriendsPayload);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<GlobalChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatRealtimeEnabledByServer, setChatRealtimeEnabledByServer] = useState(false);
  const [chatMode, setChatMode] = useState<"realtime" | "polling">("polling");

  const chatListRef = useRef<HTMLDivElement | null>(null);
  const canUseRealtimeClient = isPusherClientConfigured();

  const pushToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3800);
  }, []);

  const fetchFriends = useCallback(
    async (search: string, withLoading = true) => {
      if (!isSignedIn) {
        setFriendsPayload(defaultFriendsPayload);
        setFriendsLoading(false);
        return;
      }

      if (withLoading) setFriendsLoading(true);
      try {
        const trimmed = search.trim();
        const query = trimmed.length >= 2 ? `?search=${encodeURIComponent(trimmed)}` : "";
        const res = await fetch(`/api/friends${query}`, { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as FriendsPayload;

        if (!res.ok) {
          throw new Error(getErrorMessage(payload, "Arkadaş verileri yüklenemedi."));
        }

        setFriendsPayload({
          friends: payload.friends || [],
          incomingRequests: payload.incomingRequests || [],
          outgoingRequests: payload.outgoingRequests || [],
          searchResults: payload.searchResults || [],
        });
      } catch (error) {
        setFriendsPayload(defaultFriendsPayload);
        pushToast(error instanceof Error ? error.message : "Arkadaş verileri yüklenemedi.", "error");
      } finally {
        if (withLoading) setFriendsLoading(false);
      }
    },
    [isSignedIn, pushToast],
  );

  const fetchChat = useCallback(
    async (withLoading = true) => {
      if (!isSignedIn) {
        setChatMessages([]);
        setChatLoading(false);
        return;
      }

      if (withLoading) setChatLoading(true);
      try {
        const res = await fetch("/api/chat/global?take=100", { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as GlobalChatPayload;
        if (!res.ok) {
          throw new Error(getErrorMessage(payload, "Genel sohbet yüklenemedi."));
        }

        setChatMessages(payload.messages || []);
        setChatRealtimeEnabledByServer(Boolean(payload.realtimeEnabled));
      } catch (error) {
        setChatMessages([]);
        pushToast(error instanceof Error ? error.message : "Genel sohbet yüklenemedi.", "error");
      } finally {
        if (withLoading) setChatLoading(false);
      }
    },
    [isSignedIn, pushToast],
  );

  useEffect(() => {
    if (!isSignedIn) {
      setFriendsLoading(false);
      setChatLoading(false);
      return;
    }

    fetchFriends(activeSearch, true);
    fetchChat(true);
  }, [isSignedIn, activeSearch, fetchFriends, fetchChat]);

  useEffect(() => {
    if (!isSignedIn) return;

    if (!canUseRealtimeClient || !chatRealtimeEnabledByServer) {
      setChatMode("polling");
      const timer = window.setInterval(() => {
        fetchChat(false);
      }, 5000);
      return () => window.clearInterval(timer);
    }

    const pusher = getPusherClient();
    if (!pusher) {
      setChatMode("polling");
      const timer = window.setInterval(() => {
        fetchChat(false);
      }, 5000);
      return () => window.clearInterval(timer);
    }

    setChatMode("realtime");
    const channel = pusher.subscribe(GLOBAL_CHAT_CHANNEL);
    const onMessage = (message: GlobalChatMessage) => {
      setChatMessages((prev) => upsertChatMessage(prev, message));
    };

    channel.bind(GLOBAL_CHAT_EVENT, onMessage);

    return () => {
      channel.unbind(GLOBAL_CHAT_EVENT, onMessage);
      pusher.unsubscribe(GLOBAL_CHAT_CHANNEL);
    };
  }, [isSignedIn, canUseRealtimeClient, chatRealtimeEnabledByServer, fetchChat]);

  useEffect(() => {
    if (!chatListRef.current) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [chatMessages]);

  const sortedFriends = useMemo(
    () =>
      [...friendsPayload.friends].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [friendsPayload.friends],
  );

  const onSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setActiveSearch(nextSearch);
    await fetchFriends(nextSearch, true);
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!isSignedIn) return;
    setFriendActionLoadingKey(`send:${targetUserId}`);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        pushToast(getErrorMessage(payload, "Arkadaş isteği gönderilemedi."), "error");
        return;
      }

      pushToast("Arkadaş isteği gönderildi.", "success");
      await fetchFriends(activeSearch, false);
    } finally {
      setFriendActionLoadingKey(null);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    action: "ACCEPT" | "REJECT" | "CANCEL",
  ) => {
    if (!isSignedIn) return;
    setFriendActionLoadingKey(`request:${requestId}:${action}`);
    try {
      const res = await fetch("/api/friends", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        pushToast(getErrorMessage(payload, "Arkadaş isteği güncellenemedi."), "error");
        return;
      }

      if (action === "ACCEPT") pushToast("Arkadaş isteği kabul edildi.", "success");
      if (action === "REJECT") pushToast("Arkadaş isteği reddedildi.", "info");
      if (action === "CANCEL") pushToast("İstek iptal edildi.", "info");

      await fetchFriends(activeSearch, false);
    } finally {
      setFriendActionLoadingKey(null);
    }
  };

  const removeFriend = async (friendUserId: string) => {
    if (!isSignedIn) return;
    setFriendActionLoadingKey(`remove:${friendUserId}`);
    try {
      const res = await fetch(`/api/friends?friendUserId=${encodeURIComponent(friendUserId)}`, {
        method: "DELETE",
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        pushToast(getErrorMessage(payload, "Arkadaş silinemedi."), "error");
        return;
      }

      pushToast("Arkadaş listenden kaldırıldı.", "info");
      await fetchFriends(activeSearch, false);
    } finally {
      setFriendActionLoadingKey(null);
    }
  };

  const sendChatMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!isSignedIn || chatSending) return;

    const content = chatDraft.trim();
    if (!content) return;

    setChatSending(true);
    try {
      const res = await fetch("/api/chat/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        pushToast(getErrorMessage(payload, "Mesaj gönderilemedi."), "error");
        return;
      }

      if (payload?.message) {
        setChatMessages((prev) => upsertChatMessage(prev, payload.message as GlobalChatMessage));
      }
      setChatDraft("");
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050A14] px-4 pb-20 -mt-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-44 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-20 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="fixed right-4 top-24 z-[260] w-[min(360px,calc(100%-2rem))] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur ${toastToneStyle[toast.tone]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-7xl pt-32">
        <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B1322]/95 via-[#0A1528]/95 to-[#070D19]/95 p-8 md:p-10 shadow-[0_0_40px_rgba(0,255,255,0.08)]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300/80">
            Sosyal Merkez
          </p>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
            Arkadaşlar
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              {" "}
              + Genel Chat
            </span>
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Oyuncu ara, arkadaş isteği yönet ve toplulukla aynı odada sohbet et.
          </p>
        </section>

        {!isSignedIn ? (
          <section className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center">
            <h2 className="text-2xl font-black text-white">Sosyal Özellikler için Giriş Yap</h2>
            <p className="mt-2 text-slate-400">
              Arkadaş ekleme ve genel chat sadece giriş yapan kullanıcılar için açık.
            </p>
            <div className="mt-5">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-black text-black transition-colors hover:bg-white">
                  Giriş Yap
                </button>
              </SignInButton>
            </div>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-2">
              <article className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Search size={16} className="text-cyan-300" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">
                    Oyuncu Ara
                  </h2>
                </div>

                <form onSubmit={onSearchSubmit} className="flex gap-2">
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Kullanıcı adı ile ara"
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-black hover:bg-white"
                  >
                    Ara
                  </button>
                </form>

                <div className="mt-4 space-y-2">
                  {activeSearch.trim().length < 2 ? (
                    <p className="text-xs text-slate-400">Arama için en az 2 karakter yaz.</p>
                  ) : friendsPayload.searchResults.length === 0 ? (
                    <p className="text-xs text-slate-400">Sonuç bulunamadı.</p>
                  ) : (
                    friendsPayload.searchResults.map((result) => {
                      const busy = friendActionLoadingKey === `send:${result.id}`;
                      return (
                        <div
                          key={result.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A1120]/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">{usernameOf(result)}</p>
                            <p className="text-[11px] text-slate-400">Rol: {result.mainRole || "UNSELECTED"}</p>
                          </div>

                          {result.relationship === "NONE" ? (
                            <button
                              onClick={() => sendFriendRequest(result.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-1.5 text-xs font-bold text-cyan-100 disabled:opacity-50"
                            >
                              {busy ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                              Ekle
                            </button>
                          ) : result.relationship === "FRIEND" ? (
                            <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-200">
                              Arkadaş
                            </span>
                          ) : result.relationship === "INCOMING_PENDING" ? (
                            <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">
                              Gelen İstek
                            </span>
                          ) : (
                            <span className="rounded-md border border-slate-400/30 bg-slate-500/10 px-2 py-1 text-[11px] font-bold text-slate-200">
                              Gönderildi
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">
                    Gelen İstekler
                  </h2>
                  <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">
                    {friendsPayload.incomingRequests.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {friendsLoading ? (
                    <p className="text-xs text-slate-400">Yükleniyor...</p>
                  ) : friendsPayload.incomingRequests.length === 0 ? (
                    <p className="text-xs text-slate-400">Bekleyen gelen istek yok.</p>
                  ) : (
                    friendsPayload.incomingRequests.map((request) => {
                      const acceptKey = `request:${request.id}:ACCEPT`;
                      const rejectKey = `request:${request.id}:REJECT`;
                      return (
                        <div
                          key={request.id}
                          className="rounded-xl border border-white/10 bg-[#0A1120]/70 px-3 py-2"
                        >
                          <p className="text-sm font-bold text-white">{usernameOf(request.sender)}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleRequestAction(request.id, "ACCEPT")}
                              disabled={friendActionLoadingKey === acceptKey}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-100 disabled:opacity-50"
                            >
                              {friendActionLoadingKey === acceptKey ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                              Kabul
                            </button>
                            <button
                              onClick={() => handleRequestAction(request.id, "REJECT")}
                              disabled={friendActionLoadingKey === rejectKey}
                              className="inline-flex items-center gap-1 rounded-md border border-red-400/30 bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-100 disabled:opacity-50"
                            >
                              {friendActionLoadingKey === rejectKey ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <X size={12} />
                              )}
                              Reddet
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">
                    Gönderilen İstekler
                  </h2>
                  <span className="rounded-md border border-slate-400/30 bg-slate-500/10 px-2 py-1 text-[11px] font-bold text-slate-200">
                    {friendsPayload.outgoingRequests.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {friendsPayload.outgoingRequests.length === 0 ? (
                    <p className="text-xs text-slate-400">Bekleyen gönderilen istek yok.</p>
                  ) : (
                    friendsPayload.outgoingRequests.map((request) => {
                      const cancelKey = `request:${request.id}:CANCEL`;
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A1120]/70 px-3 py-2"
                        >
                          <p className="text-sm font-bold text-white">{usernameOf(request.recipient)}</p>
                          <button
                            onClick={() => handleRequestAction(request.id, "CANCEL")}
                            disabled={friendActionLoadingKey === cancelKey}
                            className="inline-flex items-center gap-1 rounded-md border border-red-400/30 bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-100 disabled:opacity-50"
                          >
                            {friendActionLoadingKey === cancelKey ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <X size={12} />
                            )}
                            İptal
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-white/10 bg-black/25 p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-cyan-300" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">
                      Arkadaş Listem
                    </h2>
                  </div>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-100">
                    {sortedFriends.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {friendsLoading ? (
                    <p className="text-xs text-slate-400">Yükleniyor...</p>
                  ) : sortedFriends.length === 0 ? (
                    <p className="text-xs text-slate-400">Henüz arkadaşın yok.</p>
                  ) : (
                    sortedFriends.map((friend) => {
                      const removeKey = `remove:${friend.user.id}`;
                      return (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A1120]/70 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">{usernameOf(friend.user)}</p>
                            <p className="text-[11px] text-slate-400">Rol: {friend.user.mainRole || "UNSELECTED"}</p>
                          </div>
                          <button
                            onClick={() => removeFriend(friend.user.id)}
                            disabled={friendActionLoadingKey === removeKey}
                            className="inline-flex items-center gap-1 rounded-md border border-red-400/30 bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-100 disabled:opacity-50"
                          >
                            {friendActionLoadingKey === removeKey ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                            Sil
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>
            </div>

            <div className="lg:col-span-3">
              <article className="flex h-full min-h-[680px] flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#0B1322]/95 to-[#070D17]/95 p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-white">Genel Chat</h2>
                    <p className="text-sm text-slate-400">
                      Herkesin olduğu ortak oda. Saygılı kal, spam yapma.
                    </p>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      chatMode === "realtime"
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                        : "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {chatMode === "realtime" ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {chatMode === "realtime" ? "Canlı" : "Yenilemeli"}
                  </div>
                </div>

                <div
                  ref={chatListRef}
                  className="mb-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-4"
                >
                  {chatLoading ? (
                    <div className="flex h-full min-h-[360px] items-center justify-center text-slate-400">
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Mesajlar yükleniyor...
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-slate-400">
                      Henüz mesaj yok. İlk mesajı gönder.
                    </div>
                  ) : (
                    chatMessages.map((message) => {
                      const mine = user?.id === message.sender.id;
                      return (
                        <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[90%] rounded-xl border px-3 py-2 ${
                              mine
                                ? "border-cyan-400/35 bg-cyan-500/15 text-cyan-50"
                                : "border-white/10 bg-[#0A1120] text-slate-100"
                            }`}
                          >
                            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                              {mine ? "Sen" : usernameOf(message.sender)}
                            </p>
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {message.content}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {new Date(message.createdAt).toLocaleString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={sendChatMessage} className="flex items-end gap-2">
                  <textarea
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder="Mesaj yaz..."
                    rows={2}
                    maxLength={GLOBAL_CHAT_MAX_MESSAGE_LENGTH}
                    className="min-h-[44px] flex-1 resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                  <button
                    type="submit"
                    disabled={chatSending || chatDraft.trim().length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {chatSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Gönder
                  </button>
                </form>
              </article>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
