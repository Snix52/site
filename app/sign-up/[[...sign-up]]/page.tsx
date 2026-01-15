"use client";

import { SignUp } from "@clerk/nextjs";
import { SnixLogo } from "@/components/Icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#050A14] relative overflow-hidden p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050A14] to-[#050A14] z-0"></div>

      <div className="relative z-10 mb-6 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <SnixLogo className="w-16 h-16 text-[#00FFFF] drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
        {/* ANA SAYFA STİLİ: font-black italic tracking-tighter */}
        <h1 className="mt-4 text-[22px] font-black italic tracking-tighter text-white leading-none">
          SNIX<span className="text-[#00FFFF]">.GG</span>
        </h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Aramıza Katıl</p>
      </div>

      <div className="relative z-15 w-full max-w-[420px] bg-[#0A1120] border border-white/10 shadow-[0_0_50px_rgba(0,255,255,0.05)] rounded-2xl overflow-hidden">
        <div className="p-2">
          <SignUp 
            appearance={{
              variables: {
                colorPrimary: "#00FFFF",
                colorBackground: "transparent",
                colorText: "white",
                colorInputBackground: "#050A14",
                colorInputText: "white",
                colorTextSecondary: "#9CA3AF",
              },
              layout: { socialButtonsPlacement: "bottom", logoPlacement: "none" },
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-[#00FFFF] hover:from-blue-500 hover:to-[#00FFFF] text-black font-bold border-none transition-all duration-300 !shadow-none",
                socialButtonsBlockButton: "bg-[#1F2937] border border-white/10 hover:bg-[#374151] transition-colors",
                socialButtonsBlockButtonText: "text-white font-semibold !text-white",
                socialButtonsBlockButtonArrow: "text-white",
                formFieldLabel: "text-gray-400 font-medium ml-1",
                formFieldInput: "bg-[#050A14] border border-white/10 !text-white placeholder:text-gray-600 focus:border-[#00FFFF] rounded-lg py-3",
                footer: "hidden",
                footerAction: "hidden"
              }
            }} 
          />
        </div>

        <div className="bg-[#050A14]/50 border-t border-white/10 p-6 flex flex-col items-center gap-3">
          <p className="text-gray-400 text-sm font-medium">Zaten bir hesabın var mı?</p>
          <Link href="/sign-in" className="w-full">
            <button className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 font-bold text-sm uppercase tracking-widest rounded-lg hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all duration-300">
              GİRİŞ YAP
            </button>
          </Link>
          
          <button 
            onClick={() => router.back()}
            className="mt-2 text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all"
          >
            ← VAZGEÇ VE GERİ DÖN
          </button>
        </div>
      </div>
    </div>
  );
}