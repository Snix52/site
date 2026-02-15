"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, MessageCircle, Send, Wifi, WifiOff, X } from "lucide-react";

import ChatAvatar from "@/components/ChatAvatar";
import ChatUserActionLayer, { type ChatActionMenuState } from "@/components/chat/ChatUserActionLayer";
import { getPusherClient, isPusherClientConfigured } from "@/lib/pusher-client";
import { getTeamupChatChannelName, TEAMUP_CHAT_EVENT, TEAMUP_CHAT_HISTORY_LIMIT } from "@/lib/teamup-chat";

type ToastTone = "success" | "error" | "info";

type TeamChatMessage = {
  id: string;
  teamPostId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string | null;
    imageUrl: string | null;
    mainRole: string;
    selectedFrame?: string | null;
  };
};

type TeamChatResponse = {
  messages?: TeamChatMessage[];
  realtimeEnabled?: boolean;
  currentUserFrame?: string | null;
  error?: string;
};

type TeamChatModalProps = {
  isOpen: boolean;
  postId: string | null;
  postTitle: string;
  onClose: () => void;
  pushToast?: (message: string, tone?: ToastTone) => void;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const maybeError = (payload as { error?: unknown }).error;
  return typeof maybeError === "string" && maybeError.trim().length > 0 ? maybeError : fallback;
}

function keepLatestTeamMessages(list: TeamChatMessage[]): TeamChatMessage[] {
  if (list.length <= TEAMUP_CHAT_HISTORY_LIMIT) return list;
  return list.slice(-TEAMUP_CHAT_HISTORY_LIMIT);
}

function upsertMessage(list: TeamChatMessage[], incoming: TeamChatMessage): TeamChatMessage[] {
  const exists = list.some((item) => item.id === incoming.id);
  if (exists) return keepLatestTeamMessages(list);
  return keepLatestTeamMessages([...list, incoming]);
}

function createOptimisticId() {
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function TeamChatModal({
  isOpen,
  postId,
  postTitle,
  onClose,
  pushToast,
}: TeamChatModalProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [realtimeEnabledByServer, setRealtimeEnabledByServer] = useState(false);
  const [mode, setMode] = useState<"realtime" | "polling">("polling");
  const [myFrame, setMyFrame] = useState("BASIC");
  const [chatUserMenu, setChatUserMenu] = useState<ChatActionMenuState | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const canUseRealtimeClient = isPusherClientConfigured();

  const fetchMessages = useCallback(async () => {
    if (!postId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/teamup/chat?postId=${encodeURIComponent(postId)}`, {
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as TeamChatResponse;

      if (!res.ok) {
        throw new Error(getErrorMessage(payload, "Sohbet yüklenemedi."));
      }

      setMessages(keepLatestTeamMessages(payload.messages || []));
      if (typeof payload.currentUserFrame === "string" && payload.currentUserFrame.trim().length > 0) {
        setMyFrame(payload.currentUserFrame.trim().toUpperCase());
      }
      setRealtimeEnabledByServer(Boolean(payload.realtimeEnabled));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sohbet yüklenemedi.";
      pushToast?.(message, "error");
    } finally {
      setLoading(false);
    }
  }, [postId, pushToast]);

  const normalizedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  useEffect(() => {
    if (!isOpen || !postId) return;
    fetchMessages();
  }, [isOpen, postId, fetchMessages]);

  useEffect(() => {
    if (!isOpen || !postId) return;

    if (!canUseRealtimeClient || !realtimeEnabledByServer) {
      setMode("polling");
      const timer = window.setInterval(() => {
        fetchMessages();
      }, 4000);
      return () => window.clearInterval(timer);
    }

    const pusher = getPusherClient();
    if (!pusher) {
      setMode("polling");
      const timer = window.setInterval(() => {
        fetchMessages();
      }, 4000);
      return () => window.clearInterval(timer);
    }

    setMode("realtime");
    const channelName = getTeamupChatChannelName(postId);
    const channel = pusher.subscribe(channelName);
    const onMessage = (incoming: TeamChatMessage) => {
      if (incoming.sender.id === user?.id && typeof incoming.sender.selectedFrame === "string") {
        setMyFrame(incoming.sender.selectedFrame || "BASIC");
      }
      setMessages((prev) => upsertMessage(prev, incoming));
    };

    channel.bind(TEAMUP_CHAT_EVENT, onMessage);

    return () => {
      channel.unbind(TEAMUP_CHAT_EVENT, onMessage);
      pusher.unsubscribe(channelName);
    };
  }, [isOpen, postId, canUseRealtimeClient, realtimeEnabledByServer, fetchMessages, user?.id]);

  useEffect(() => {
    if (!isOpen) return;
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [normalizedMessages, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setDraft("");
      setLoading(false);
      setSending(false);
      setRealtimeEnabledByServer(false);
      setMode("polling");
      setMyFrame("BASIC");
      setChatUserMenu(null);
    }
  }, [isOpen]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!postId || sending) return;

    const content = draft.trim();
    if (!content) return;

    const optimisticId = createOptimisticId();
    const optimisticMessage: TeamChatMessage = {
      id: optimisticId,
      teamPostId: postId,
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id ?? "me",
        username: user?.username ?? "Sen",
        imageUrl: user?.imageUrl ?? null,
        mainRole: "UNSELECTED",
        selectedFrame: myFrame,
      },
    };

    setMessages((prev) => upsertMessage(prev, optimisticMessage));
    setDraft("");

    setSending(true);
    try {
      const res = await fetch("/api/teamup/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
        setDraft(content);
        pushToast?.(getErrorMessage(payload, "Mesaj gönderilemedi."), "error");
        return;
      }

      if (payload?.message) {
        const serverMessage = payload.message as TeamChatMessage;
        if (serverMessage.sender.id === user?.id && typeof serverMessage.sender.selectedFrame === "string") {
          setMyFrame(serverMessage.sender.selectedFrame || "BASIC");
        }
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((message) => message.id !== optimisticId);
          return upsertMessage(withoutOptimistic, serverMessage);
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleDraftKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!draft.trim() || sending) return;
    formRef.current?.requestSubmit();
  };

  if (!isOpen || !postId) return null;

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div className="relative flex h-[min(78vh,760px)] w-full max-w-3xl flex-col rounded-2xl border border-white/15 bg-gradient-to-b from-[#0B1322] to-[#070D17] p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-black text-white">
              <MessageCircle size={18} className="text-cyan-300" />
              Takım Sohbeti
            </h3>
            <p className="mt-1 text-sm text-slate-400">{postTitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                mode === "realtime"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                  : "border-amber-400/40 bg-amber-500/15 text-amber-200"
              }`}
            >
              {mode === "realtime" ? <Wifi size={12} /> : <WifiOff size={12} />}
              {mode === "realtime" ? "Canlı" : "Yenilemeli"}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div
          ref={listRef}
          className="mb-4 min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-4"
        >
          {loading ? (
            <div className="flex h-[260px] items-center justify-center text-slate-400">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Mesajlar yükleniyor...
            </div>
          ) : normalizedMessages.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
              Henüz mesaj yok. İlk mesajı gönder.
            </div>
          ) : (
            normalizedMessages.map((message) => {
              const mine = user?.id === message.sender.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className="flex max-w-[92%] items-end gap-2"
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setChatUserMenu({
                        x: event.clientX,
                        y: event.clientY,
                        user: {
                          id: message.sender.id,
                          username: message.sender.username,
                          imageUrl: message.sender.imageUrl,
                          selectedFrame: message.sender.selectedFrame,
                          mainRole: message.sender.mainRole,
                        },
                      });
                    }}
                  >
                    <ChatAvatar
                      imageUrl={message.sender.imageUrl}
                      username={message.sender.username}
                      frameType={message.sender.selectedFrame}
                      size={56}
                    />
                    <div
                      className={`max-w-full rounded-xl border px-3 py-2 ${
                        mine
                          ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-50"
                          : "border-white/10 bg-[#0A1120] text-slate-100"
                      }`}
                    >
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        {mine ? "Sen" : message.sender.username || "Oyuncu"}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form ref={formRef} onSubmit={sendMessage} className="mt-auto flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleDraftKeyDown}
            placeholder="Mesaj yaz..."
            maxLength={500}
            rows={2}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-black text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Gönder
          </button>
        </form>
      </div>
      <ChatUserActionLayer
        menu={chatUserMenu}
        currentUserId={user?.id ?? null}
        onCloseMenu={() => setChatUserMenu(null)}
        pushToast={pushToast}
      />
    </div>
  );
}

