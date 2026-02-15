"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Flag, Loader2, MessageSquare, UserRound, X } from "lucide-react";

import ChatAvatar from "@/components/ChatAvatar";

export type ChatActionTone = "success" | "error" | "info";

export type ChatActionUser = {
  id: string;
  username: string | null;
  imageUrl: string | null;
  selectedFrame?: string | null;
  mainRole?: string | null;
};

export type ChatActionMenuState = {
  x: number;
  y: number;
  user: ChatActionUser;
};

type ChatUserActionLayerProps = {
  menu: ChatActionMenuState | null;
  currentUserId?: string | null;
  onCloseMenu: () => void;
  pushToast?: (message: string, tone?: ChatActionTone) => void;
  interactionMode?: "contextmenu" | "hover";
  onMenuHoverChange?: (isHovering: boolean) => void;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const value = (payload as { error?: unknown }).error;
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function usernameOf(user: { username: string | null }) {
  return user.username?.trim() || "Oyuncu";
}

const REPORT_REASON_OPTIONS = [
  { value: "TOXIC_BEHAVIOR", label: "Toksik Davranış" },
  { value: "HARASSMENT", label: "Taciz" },
  { value: "CHEATING", label: "Hile" },
  { value: "SPAM", label: "Spam" },
  { value: "FAKE_PROFILE", label: "Sahte Profil" },
  { value: "OTHER", label: "Diğer" },
] as const;

export default function ChatUserActionLayer({
  menu,
  currentUserId,
  onCloseMenu,
  pushToast,
  interactionMode = "contextmenu",
  onMenuHoverChange,
}: ChatUserActionLayerProps) {
  const router = useRouter();

  const [pmTarget, setPmTarget] = useState<ChatActionUser | null>(null);
  const [pmDraft, setPmDraft] = useState("");
  const [pmError, setPmError] = useState<string | null>(null);
  const [pmSending, setPmSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<ChatActionUser | null>(null);
  const [reportReason, setReportReason] = useState<string>("TOXIC_BEHAVIOR");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (!menu) return;

    const close = () => onCloseMenu();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    if (interactionMode === "contextmenu") {
      window.addEventListener("mousedown", close);
    }
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      if (interactionMode === "contextmenu") {
        window.removeEventListener("mousedown", close);
      }
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, onCloseMenu, interactionMode]);

  const position = useMemo(() => {
    if (!menu) return { left: 12, top: 12 };
    if (typeof window === "undefined") return { left: menu.x, top: menu.y };

    const menuWidth = 220;
    const menuHeight = 148;
    return {
      left: Math.min(Math.max(8, menu.x), Math.max(8, window.innerWidth - menuWidth - 8)),
      top: Math.min(Math.max(8, menu.y), Math.max(8, window.innerHeight - menuHeight - 8)),
    };
  }, [menu]);

  const openPublicProfile = (target: ChatActionUser) => {
    onCloseMenu();
    if (currentUserId && target.id === currentUserId) {
      router.push("/profil");
      return;
    }
    router.push(`/profil?userId=${encodeURIComponent(target.id)}`);
  };

  const openPrivateMessage = (target: ChatActionUser) => {
    onCloseMenu();
    setPmTarget(target);
    setPmDraft("");
    setPmError(null);
  };

  const openReportModal = (target: ChatActionUser) => {
    onCloseMenu();
    setReportTarget(target);
    setReportReason("TOXIC_BEHAVIOR");
    setReportDetails("");
    setReportError(null);
  };

  const sendPrivateMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!pmTarget || pmSending) return;

    const content = pmDraft.trim();
    if (!content) return;

    setPmSending(true);
    setPmError(null);
    try {
      const res = await fetch("/api/messages/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: pmTarget.id, content }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPmError(getErrorMessage(payload, "Özel mesaj gönderilemedi."));
        return;
      }

      pushToast?.(`${usernameOf(pmTarget)} kullanıcısına özel mesaj gönderildi.`, "success");
      setPmTarget(null);
      setPmDraft("");
    } finally {
      setPmSending(false);
    }
  };

  const submitProfileReport = async (event: FormEvent) => {
    event.preventDefault();
    if (!reportTarget || reportSubmitting) return;

    const details = reportDetails.trim();
    if (details.length < 6 || details.length > 600) {
      setReportError("Açıklama 6 ile 600 karakter arasında olmalı.");
      return;
    }

    setReportSubmitting(true);
    setReportError(null);
    try {
      const res = await fetch("/api/profile-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: reportTarget.id,
          reason: reportReason,
          details,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReportError(getErrorMessage(payload, "Şikayet gönderilemedi."));
        return;
      }

      pushToast?.(`${usernameOf(reportTarget)} için şikayet gönderildi.`, "success");
      setReportTarget(null);
      setReportDetails("");
      setReportError(null);
    } finally {
      setReportSubmitting(false);
    }
  };

  const canSendToSelectedUser = Boolean(pmTarget && currentUserId && pmTarget.id !== currentUserId);
  const canReportSelectedUser = Boolean(reportTarget && currentUserId && reportTarget.id !== currentUserId);
  const isSelfInMenu = Boolean(menu && currentUserId && menu.user.id === currentUserId);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  if (!portalTarget) return null;

  return createPortal(
    <>
      {menu &&
        (interactionMode === "contextmenu" ? (
          <div className="fixed inset-0 z-[360]">
            <div
              className="absolute w-[220px] overflow-hidden rounded-xl border border-cyan-400/30 bg-[#081327]/95 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur"
              style={{ left: position.left, top: position.top }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => openPublicProfile(menu.user)}
                className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 text-left text-sm font-bold text-cyan-100 hover:bg-cyan-500/15"
              >
                <UserRound size={14} />
                Profili gör
              </button>
              <button
                type="button"
                onClick={() => openPrivateMessage(menu.user)}
                disabled={isSelfInMenu}
                className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 text-left text-sm font-bold text-cyan-100 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <MessageSquare size={14} />
                Özel mesaj gönder
              </button>
              <button
                type="button"
                onClick={() => openReportModal(menu.user)}
                disabled={isSelfInMenu}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-bold text-red-200 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Flag size={14} />
                Şikayet et
              </button>
            </div>
          </div>
        ) : (
          <div
            className="fixed z-[360] w-[220px] overflow-hidden rounded-xl border border-cyan-400/30 bg-[#081327]/95 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur"
            style={{ left: position.left, top: position.top }}
            onMouseEnter={() => onMenuHoverChange?.(true)}
            onMouseLeave={() => onMenuHoverChange?.(false)}
          >
            <button
              type="button"
              onClick={() => openPublicProfile(menu.user)}
              className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 text-left text-sm font-bold text-cyan-100 hover:bg-cyan-500/15"
            >
              <UserRound size={14} />
              Profili gör
            </button>
            <button
              type="button"
              onClick={() => openPrivateMessage(menu.user)}
              disabled={isSelfInMenu}
              className="flex w-full items-center gap-2 border-b border-white/10 px-3 py-2.5 text-left text-sm font-bold text-cyan-100 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <MessageSquare size={14} />
              Özel mesaj gönder
            </button>
            <button
              type="button"
              onClick={() => openReportModal(menu.user)}
              disabled={isSelfInMenu}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-bold text-red-200 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Flag size={14} />
              Şikayet et
            </button>
          </div>
        ))}

      {pmTarget && (
        <div className="fixed inset-0 z-[370] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setPmTarget(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-[#071225]/96 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={() => setPmTarget(null)}
              className="absolute right-3 top-3 rounded-md border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            >
              <X size={14} />
            </button>

            <div className="mb-3 flex items-center gap-3">
              <ChatAvatar
                imageUrl={pmTarget.imageUrl}
                username={pmTarget.username}
                frameType={pmTarget.selectedFrame}
                size={56}
              />
              <div>
                <p className="text-base font-black text-white">Özel Mesaj</p>
                <p className="text-sm text-slate-300">{usernameOf(pmTarget)}</p>
              </div>
            </div>

            <form onSubmit={sendPrivateMessage}>
              <textarea
                value={pmDraft}
                onChange={(event) => setPmDraft(event.target.value)}
                placeholder="Mesajını yaz..."
                maxLength={300}
                rows={4}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              />
              {pmError && <p className="mt-2 text-xs font-bold text-red-300">{pmError}</p>}
              {!canSendToSelectedUser && (
                <p className="mt-2 text-xs font-bold text-amber-300">
                  Kendine özel mesaj gönderemezsin.
                </p>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPmTarget(null)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={!canSendToSelectedUser || pmSending || pmDraft.trim().length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {pmSending ? <Loader2 size={13} className="animate-spin" /> : null}
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportTarget && (
        <div className="fixed inset-0 z-[375] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setReportTarget(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-400/35 bg-[#091120]/96 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.6)]">
            <button
              type="button"
              onClick={() => setReportTarget(null)}
              className="absolute right-3 top-3 rounded-md border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
            >
              <X size={14} />
            </button>

            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Şikayet Gönder</p>
              <h3 className="mt-1 text-lg font-black text-white">{usernameOf(reportTarget)}</h3>
            </div>

            <form onSubmit={submitProfileReport}>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Sebep</label>
                  <select
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-300/60"
                  >
                    {REPORT_REASON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-300">Açıklama</label>
                  <textarea
                    value={reportDetails}
                    onChange={(event) => setReportDetails(event.target.value)}
                    placeholder="Kısaca neden şikayet ettiğini yaz..."
                    maxLength={600}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-300/60"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">{reportDetails.length}/600</p>
                </div>
              </div>

              {reportError && <p className="mt-2 text-xs font-bold text-red-300">{reportError}</p>}
              {!canReportSelectedUser && (
                <p className="mt-2 text-xs font-bold text-amber-300">Kendi profilini şikayet edemezsin.</p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportTarget(null)}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200"
                  disabled={reportSubmitting}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={!canReportSelectedUser || reportSubmitting || reportDetails.trim().length < 6}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {reportSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                  Şikayet et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>,
    portalTarget,
  );
}
