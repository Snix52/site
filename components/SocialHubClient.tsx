"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  Check,
  Loader2,
  MessageCircle,
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
  GLOBAL_CHAT_HISTORY_LIMIT,
  GLOBAL_CHAT_MAX_MESSAGE_LENGTH,
} from "@/lib/global-chat";
import ChatAvatar from "@/components/ChatAvatar";
import ChatUserActionLayer, { type ChatActionMenuState } from "@/components/chat/ChatUserActionLayer";
import { useSystemToast } from "@/components/SystemToastProvider";

type FriendProfile = {
  id: string;
  username: string | null;
  imageUrl: string | null;
  mainRole: string;
  selectedFrame?: string | null;
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
  currentUserFrame?: string | null;
  error?: string;
};

const defaultFriendsPayload: FriendsPayload = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const value = (payload as { error?: unknown }).error;
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function usernameOf(profile: FriendProfile) {
  return profile.username?.trim() || "Oyuncu";
}

function keepLatestChatMessages(list: GlobalChatMessage[]) {
  if (list.length <= GLOBAL_CHAT_HISTORY_LIMIT) return list;
  return list.slice(-GLOBAL_CHAT_HISTORY_LIMIT);
}

function upsertChatMessage(list: GlobalChatMessage[], incoming: GlobalChatMessage) {
  if (list.some((item) => item.id === incoming.id)) return keepLatestChatMessages(list);
  return keepLatestChatMessages([...list, incoming]);
}

function createOptimisticId() {
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type SocialHubClientProps = {
  embedded?: boolean;
};

export default function SocialHubClient({ embedded = false }: SocialHubClientProps) {
  const { isSignedIn, user } = useUser();
  const { pushToast } = useSystemToast();

  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendActionLoadingKey, setFriendActionLoadingKey] = useState<string | null>(null);
  const [friendsPayload, setFriendsPayload] = useState<FriendsPayload>(defaultFriendsPayload);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [chatLoading, setChatLoading] = useState(true);
  const [chatSending, setChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<GlobalChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMyFrame, setChatMyFrame] = useState("BASIC");
  const [chatUserMenu, setChatUserMenu] = useState<ChatActionMenuState | null>(null);
  const [chatRealtimeEnabledByServer, setChatRealtimeEnabledByServer] = useState(false);
  const [chatMode, setChatMode] = useState<"realtime" | "polling">("polling");
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(embedded);
  const [embeddedTab, setEmbeddedTab] = useState<"chat" | "friends">("chat");

  const chatFormRef = useRef<HTMLFormElement | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const chatMenuHoverCloseTimeoutRef = useRef<number | null>(null);
  const canUseRealtimeClient = isPusherClientConfigured();

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
          throw new Error(getErrorMessage(payload, "Arkadas verileri yuklenemedi."));
        }

        setFriendsPayload({
          friends: payload.friends || [],
          incomingRequests: payload.incomingRequests || [],
          outgoingRequests: payload.outgoingRequests || [],
          searchResults: payload.searchResults || [],
        });
      } catch (error) {
        setFriendsPayload(defaultFriendsPayload);
        pushToast(error instanceof Error ? error.message : "Arkadas verileri yuklenemedi.", "error");
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
        setChatMyFrame("BASIC");
        setChatLoading(false);
        return;
      }

      if (withLoading) setChatLoading(true);
      try {
        const res = await fetch(`/api/chat/global?take=${GLOBAL_CHAT_HISTORY_LIMIT}`, { cache: "no-store" });
        const payload = (await res.json().catch(() => ({}))) as GlobalChatPayload;
        if (!res.ok) {
          throw new Error(getErrorMessage(payload, "Genel sohbet yuklenemedi."));
        }

        setChatMessages(keepLatestChatMessages(payload.messages || []));
        if (typeof payload.currentUserFrame === "string" && payload.currentUserFrame.trim().length > 0) {
          setChatMyFrame(payload.currentUserFrame.trim().toUpperCase());
        }
        setChatRealtimeEnabledByServer(Boolean(payload.realtimeEnabled));
      } catch (error) {
        setChatMessages([]);
        pushToast(error instanceof Error ? error.message : "Genel sohbet yuklenemedi.", "error");
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
      if (message.sender.id === user?.id && typeof message.sender.selectedFrame === "string") {
        setChatMyFrame(message.sender.selectedFrame || "BASIC");
      }
      setChatMessages((prev) => upsertChatMessage(prev, message));
    };

    channel.bind(GLOBAL_CHAT_EVENT, onMessage);

    return () => {
      channel.unbind(GLOBAL_CHAT_EVENT, onMessage);
      pusher.unsubscribe(GLOBAL_CHAT_CHANNEL);
    };
  }, [isSignedIn, canUseRealtimeClient, chatRealtimeEnabledByServer, fetchChat, user?.id]);

  useEffect(() => {
    if (!chatListRef.current) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [chatMessages, isChatWidgetOpen]);

  useEffect(() => {
    if (!isChatWidgetOpen) return;
    if (!chatListRef.current) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [isChatWidgetOpen]);

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
        pushToast(getErrorMessage(payload, "Arkadas istegi gonderilemedi."), "error");
        return;
      }

      pushToast("Arkadas istegi gonderildi.", "success");
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
        pushToast(getErrorMessage(payload, "Arkadas istegi guncellenemedi."), "error");
        return;
      }

      if (action === "ACCEPT") pushToast("Arkadas istegi kabul edildi.", "success");
      if (action === "REJECT") pushToast("Arkadas istegi reddedildi.", "info");
      if (action === "CANCEL") pushToast("Istek iptal edildi.", "info");

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
        pushToast(getErrorMessage(payload, "Arkadas silinemedi."), "error");
        return;
      }

      pushToast("Arkadas listenden kaldirildi.", "info");
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

    const optimisticId = createOptimisticId();
    const optimisticMessage: GlobalChatMessage = {
      id: optimisticId,
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id ?? "me",
        username: user?.username ?? "Sen",
        imageUrl: user?.imageUrl ?? null,
        mainRole: "UNSELECTED",
        selectedFrame: chatMyFrame,
      },
    };

    setChatMessages((prev) => upsertChatMessage(prev, optimisticMessage));
    setChatDraft("");

    setChatSending(true);
    try {
      const res = await fetch("/api/chat/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setChatMessages((prev) => prev.filter((message) => message.id !== optimisticId));
        setChatDraft(content);
        pushToast(getErrorMessage(payload, "Mesaj gonderilemedi."), "error");
        return;
      }

      if (payload?.message) {
        const serverMessage = payload.message as GlobalChatMessage;
        if (serverMessage.sender.id === user?.id && typeof serverMessage.sender.selectedFrame === "string") {
          setChatMyFrame(serverMessage.sender.selectedFrame || "BASIC");
        }
        setChatMessages((prev) => {
          const withoutOptimistic = prev.filter((message) => message.id !== optimisticId);
          return upsertChatMessage(withoutOptimistic, serverMessage);
        });
      }
    } finally {
      setChatSending(false);
    }
  };

  const handleChatDraftKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!chatDraft.trim() || chatSending) return;
    chatFormRef.current?.requestSubmit();
  };

  const clearChatMenuHoverClose = useCallback(() => {
    if (chatMenuHoverCloseTimeoutRef.current === null) return;
    window.clearTimeout(chatMenuHoverCloseTimeoutRef.current);
    chatMenuHoverCloseTimeoutRef.current = null;
  }, []);

  const scheduleChatMenuHoverClose = useCallback(() => {
    clearChatMenuHoverClose();
    chatMenuHoverCloseTimeoutRef.current = window.setTimeout(() => {
      setChatUserMenu(null);
      chatMenuHoverCloseTimeoutRef.current = null;
    }, 700);
  }, [clearChatMenuHoverClose]);

  const openChatUserMenuFromHover = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, sender: GlobalChatMessage["sender"]) => {
      clearChatMenuHoverClose();

      const rect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 220;
      const x = Math.min(
        Math.max(8, rect.left + rect.width / 2 - menuWidth / 2),
        Math.max(8, window.innerWidth - menuWidth - 8),
      );
      const y = Math.min(Math.max(8, rect.bottom + 8), Math.max(8, window.innerHeight - 116));

      setChatUserMenu((prev) => {
        if (
          prev &&
          prev.user.id === sender.id &&
          Math.abs(prev.x - x) < 2 &&
          Math.abs(prev.y - y) < 2
        ) {
          return prev;
        }
        return {
          x,
          y,
          user: {
            id: sender.id,
            username: sender.username,
            imageUrl: sender.imageUrl,
            selectedFrame: sender.selectedFrame || "BASIC",
            mainRole: sender.mainRole,
          },
        };
      });
    },
    [clearChatMenuHoverClose],
  );

  useEffect(() => () => clearChatMenuHoverClose(), [clearChatMenuHoverClose]);

  return (
    <div
      className={
        embedded
          ? "relative flex h-full flex-col overflow-x-hidden bg-[#050A14] px-4 pb-3"
          : "relative min-h-screen overflow-x-hidden bg-[#050A14] px-4 pb-20 -mt-32"
      }
    >
      {!embedded ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-44 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute top-20 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
      ) : null}

      <div
        className={`relative z-10 mx-auto max-w-7xl ${
          embedded ? "flex h-auto w-full flex-col pt-2" : "pt-32"
        }`}
      >
        {!embedded ? (
          <section className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0B1322]/95 via-[#0A1528]/95 to-[#070D19]/95 p-8 md:p-10 shadow-[0_0_40px_rgba(0,255,255,0.08)]">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300/80">
              Sosyal Merkez
            </p>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Arkadaslar
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {" "}
                + Genel Chat
              </span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Oyuncu ara, arkadas isteklerini yonet ve toplulukla sohbet et.
            </p>
          </section>
        ) : (
          <section className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2">
            <button
              type="button"
              onClick={() => setEmbeddedTab("chat")}
              className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                embeddedTab === "chat"
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5 text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-100"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setEmbeddedTab("friends")}
              className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                embeddedTab === "friends"
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5 text-slate-300 hover:bg-cyan-500/15 hover:text-cyan-100"
              }`}
            >
              Arkadaslar
            </button>
          </section>
        )}

        {!isSignedIn ? (
          <section className="rounded-2xl border border-white/10 bg-black/25 p-8 text-center">
            <h2 className="text-2xl font-black text-white">Sosyal ozellikler icin giris yap</h2>
            <p className="mt-2 text-slate-400">
              Arkadas sistemi ve genel chat sadece giris yapan kullanicilar icin acik.
            </p>
            <div className="mt-5">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-black text-black transition-colors hover:bg-white">
                  Giris Yap
                </button>
              </SignInButton>
            </div>
          </section>
        ) : !embedded || embeddedTab === "friends" ? (
          <section className={embedded ? "grid flex-1 gap-4 overflow-y-auto pr-1" : "grid gap-6"}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/80">Arkadas</p>
                <p className="mt-1 text-2xl font-black text-cyan-100">{sortedFriends.length}</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200/80">Gelen</p>
                <p className="mt-1 text-2xl font-black text-amber-100">{friendsPayload.incomingRequests.length}</p>
              </div>
              <div className="rounded-xl border border-slate-300/20 bg-white/5 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300/80">Gonderilen</p>
                <p className="mt-1 text-2xl font-black text-slate-100">{friendsPayload.outgoingRequests.length}</p>
              </div>
            </div>

            <article className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#0A1222]/90 to-[#080F1A]/90 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Search size={16} className="text-cyan-300" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-200">Oyuncu Ara</h2>
              </div>

              <form onSubmit={onSearchSubmit} className="flex gap-2">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Kullanici adi ile ara"
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-black text-black transition hover:bg-white"
                >
                  Ara
                </button>
              </form>

              <div className="mt-3 space-y-2">
                {activeSearch.trim().length < 2 ? (
                  <p className="text-xs text-slate-400">Arama icin en az 2 karakter yaz.</p>
                ) : friendsPayload.searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400">Sonuc bulunamadi.</p>
                ) : (
                  friendsPayload.searchResults.map((result) => {
                    const busy = friendActionLoadingKey === `send:${result.id}`;
                    return (
                      <div
                        key={result.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A1120]/85 px-3 py-2.5"
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
                            Arkadas
                          </span>
                        ) : result.relationship === "INCOMING_PENDING" ? (
                          <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">
                            Gelen istek
                          </span>
                        ) : (
                          <span className="rounded-md border border-slate-400/30 bg-slate-500/10 px-2 py-1 text-[11px] font-bold text-slate-200">
                            Gonderildi
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">Gelen Istekler</h2>
                  <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-200">
                    {friendsPayload.incomingRequests.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {friendsLoading ? (
                    <p className="text-xs text-slate-400">Yukleniyor...</p>
                  ) : friendsPayload.incomingRequests.length === 0 ? (
                    <p className="text-xs text-slate-400">Bekleyen gelen istek yok.</p>
                  ) : (
                    friendsPayload.incomingRequests.map((request) => {
                      const acceptKey = `request:${request.id}:ACCEPT`;
                      const rejectKey = `request:${request.id}:REJECT`;
                      return (
                        <div
                          key={request.id}
                          className="rounded-xl border border-white/10 bg-[#0A1120]/70 px-3 py-2.5"
                        >
                          <p className="truncate text-sm font-bold text-white">{usernameOf(request.sender)}</p>
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

              <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">
                    Gonderilen Istekler
                  </h2>
                  <span className="rounded-md border border-slate-400/30 bg-slate-500/10 px-2 py-1 text-[11px] font-bold text-slate-200">
                    {friendsPayload.outgoingRequests.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {friendsPayload.outgoingRequests.length === 0 ? (
                    <p className="text-xs text-slate-400">Bekleyen gonderilen istek yok.</p>
                  ) : (
                    friendsPayload.outgoingRequests.map((request) => {
                      const cancelKey = `request:${request.id}:CANCEL`;
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A1120]/70 px-3 py-2.5"
                        >
                          <p className="truncate text-sm font-bold text-white">{usernameOf(request.recipient)}</p>
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
                            Iptal
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </article>
            </div>

            <article className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-cyan-300" />
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-200">
                    Arkadas Listem
                  </h2>
                </div>
                <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-100">
                  {sortedFriends.length}
                </span>
              </div>
              <div className="space-y-2">
                {friendsLoading ? (
                  <p className="text-xs text-slate-400">Yukleniyor...</p>
                ) : sortedFriends.length === 0 ? (
                  <p className="text-xs text-slate-400">Henuz arkadasin yok.</p>
                ) : (
                  sortedFriends.map((friend) => {
                    const removeKey = `remove:${friend.user.id}`;
                    return (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0A1120]/75 px-3 py-2.5"
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
          </section>
        ) : null}
      </div>

      {isSignedIn ? (
        <>
          {isChatWidgetOpen && (!embedded || embeddedTab === "chat") ? (
            <div
              className={
                embedded
                  ? "relative z-20 mt-2 min-h-0 flex-1"
                  : "fixed bottom-24 right-4 z-[320] w-[min(420px,calc(100vw-1rem))]"
              }
            >
              <article
                className={`flex flex-col overflow-hidden ${
                  embedded
                    ? "h-full w-full rounded-none border-0 bg-transparent shadow-none backdrop-blur-0"
                    : "h-[min(72vh,620px)] rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-[#0B1322]/95 to-[#070D17]/95 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur"
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Genel Chat</h2>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      chatMode === "realtime"
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                        : "border-amber-400/40 bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {chatMode === "realtime" ? <Wifi size={11} /> : <WifiOff size={11} />}
                    {chatMode === "realtime" ? "Canlı" : "Yenilemeli"}
                  </div>
                </div>

                <div
                  ref={chatListRef}
                  className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-3 py-3"
                >
                  {chatLoading ? (
                    <div className="flex h-full min-h-[220px] items-center justify-center text-slate-400">
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Mesajlar yukleniyor...
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-slate-400">
                      Henuz mesaj yok. Ilk mesaji gonder.
                    </div>
                  ) : (
                    chatMessages.map((message) => {
                      const mine = user?.id === message.sender.id;
                      const frameType = mine ? chatMyFrame : message.sender.selectedFrame || "BASIC";
                      return (
                        <div
                          key={message.id}
                          className={`flex w-full min-w-0 items-start gap-3 ${
                            mine ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!mine ? (
                            <div
                              className="-m-1 rounded-full p-1"
                              onMouseEnter={(event) => openChatUserMenuFromHover(event, message.sender)}
                              onMouseMove={(event) => openChatUserMenuFromHover(event, message.sender)}
                              onMouseLeave={scheduleChatMenuHoverClose}
                              onClick={(event) => openChatUserMenuFromHover(event, message.sender)}
                            >
                              <ChatAvatar
                                imageUrl={message.sender.imageUrl}
                                username={message.sender.username}
                                frameType={frameType}
                                size={50}
                              />
                            </div>
                          ) : null}

                          <div
                            className={`min-w-0 w-fit max-w-[calc(100%-62px)] rounded-2xl border px-3 py-2 ${
                              mine
                                ? "border-cyan-400/35 bg-cyan-500/12 text-cyan-50"
                                : "border-white/10 bg-[#0A1120]/95 text-slate-100"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <p className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-slate-300">
                                {mine ? "Sen" : usernameOf(message.sender)}
                              </p>
                            </div>
                            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">
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

                          {mine ? (
                            <div
                              className="-m-1 rounded-full p-1"
                              onMouseEnter={(event) => openChatUserMenuFromHover(event, message.sender)}
                              onMouseMove={(event) => openChatUserMenuFromHover(event, message.sender)}
                              onMouseLeave={scheduleChatMenuHoverClose}
                              onClick={(event) => openChatUserMenuFromHover(event, message.sender)}
                            >
                              <ChatAvatar
                                imageUrl={message.sender.imageUrl}
                                username={message.sender.username}
                                frameType={frameType}
                                size={50}
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  ref={chatFormRef}
                  onSubmit={sendChatMessage}
                  className="shrink-0 border-t border-white/10 px-3 pb-3 pt-2"
                >
                  <textarea
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={handleChatDraftKeyDown}
                    placeholder="Mesaj yaz..."
                    rows={2}
                    maxLength={GLOBAL_CHAT_MAX_MESSAGE_LENGTH}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] text-slate-400">
                      {chatDraft.length}/{GLOBAL_CHAT_MAX_MESSAGE_LENGTH}
                    </p>
                    <button
                      type="submit"
                      disabled={chatSending || chatDraft.trim().length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {chatSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Gonder
                    </button>
                  </div>
                </form>
              </article>
            </div>
          ) : null}

          {!embedded ? (
            <button
              type="button"
              onClick={() => {
                setIsChatWidgetOpen((prev) => {
                  const next = !prev;
                  if (!next) {
                    clearChatMenuHoverClose();
                    setChatUserMenu(null);
                  }
                  return next;
                });
              }}
              className="fixed bottom-5 right-5 z-[330] inline-flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/35 bg-[#081327]/95 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.25)] transition hover:border-cyan-200 hover:text-white"
              aria-label={isChatWidgetOpen ? "Sohbeti kapat" : "Sohbeti ac"}
              title={isChatWidgetOpen ? "Sohbeti kapat" : "Sohbeti ac"}
            >
              {isChatWidgetOpen ? <X size={22} /> : <MessageCircle size={22} />}
            </button>
          ) : null}
        </>
      ) : null}

      <ChatUserActionLayer
        menu={chatUserMenu}
        currentUserId={user?.id ?? null}
        onCloseMenu={() => {
          clearChatMenuHoverClose();
          setChatUserMenu(null);
        }}
        pushToast={pushToast}
        interactionMode="hover"
        onMenuHoverChange={(isHovering) => {
          if (isHovering) {
            clearChatMenuHoverClose();
            return;
          }
          scheduleChatMenuHoverClose();
        }}
      />
    </div>
  );
}

