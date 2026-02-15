"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

import SocialHubClient from "@/components/SocialHubClient";

export default function FloatingSocialChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-[330] inline-flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/35 bg-[#081327]/95 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.25)] transition hover:border-cyan-200 hover:text-white"
        aria-label={isOpen ? "Sohbet panelini kapat" : "Sohbet panelini ac"}
        title={isOpen ? "Sohbet panelini kapat" : "Sohbet panelini ac"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-4 z-[340] h-[min(74vh,720px)] w-[min(460px,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-b from-[#0B1322]/95 to-[#070D17]/95 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur">
          <SocialHubClient embedded />
        </div>
      ) : null}
    </>
  );
}
