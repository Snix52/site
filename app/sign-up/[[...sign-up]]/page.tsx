"use client";

import { SignUp } from "@clerk/nextjs";
import { SnixLogo } from "@/components/Icons";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#050A14] relative overflow-hidden p-4">
      
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050A14] to-[#050A14] z-0"></div>

      <div className="relative z-10 mb-6 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <SnixLogo className="w-16 h-16 text-[#00FFFF] drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
        <h1 className="mt-4 text-xl font-black text-white tracking-widest uppercase font-brand">
          Aramıza <span className="text-[#00FFFF]">Katıl</span>
        </h1>
      </div>

      {/* --- ANA KART (TEK PARÇA) --- */}
      <div className="relative z-15 w-full max-w-[400px] bg-[#0A1120] border border-white/10 shadow-[0_0_50px_rgba(0,255,255,0.05)] rounded-2xl overflow-hidden">
        
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
              layout: {
                socialButtonsPlacement: "bottom",
                logoPlacement: "none",
              },
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

        {/* --- ALT BÖLÜM --- */}
        <div className="bg-[#050A14]/50 border-t border-white/10 p-6 flex flex-col items-center gap-3">
          <p className="text-gray-400 text-sm font-medium">Zaten bir hesabın var mı?</p>
          
          <Link href="/sign-in" className="w-full">
            <button className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 font-bold text-sm uppercase tracking-widest rounded-lg hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all duration-300">
              GİRİŞ YAP
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}