"use client";

import { SignIn } from "@clerk/nextjs";
import { SnixLogo } from "@/components/Icons";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#050A14] relative overflow-hidden p-4">
      
      {/* Arka Plan Efekti */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050A14] to-[#050A14] z-0"></div>

      {/* LOGO ALANI */}
      <div className="relative z-10 mb-6 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <SnixLogo className="w-16 h-16 text-[#00FFFF] drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
        <h1 className="mt-4 text-xl font-black text-white tracking-widest uppercase font-brand">
          Snix<span className="text-[#00FFFF]">.gg</span>
        </h1>
      </div>

      {/* --- ANA KART (TEK PARÇA) --- */}
      <div className="relative z-10 w-full max-w-[410px] bg-[#0A1120] border border-white/10 shadow-[0_0_50px_rgba(0,255,255,0.05)] rounded-2xl overflow-hidden">
        
        <div className="p-2">
          <SignIn 
            appearance={{
              variables: {
                colorPrimary: "#00FFFF", 
                colorBackground: "transparent", // Clerk'i şeffaf yaptık!
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
                card: "shadow-none border-none bg-transparent", // Clerk kartının kenarlarını sildik
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                
                // Form Butonu (İleri / Giriş Yap)
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-[#00FFFF] hover:from-blue-500 hover:to-[#00FFFF] text-black font-bold border-none transition-all duration-300 !shadow-none",
                
                // Google / Social Butonları (ARTIK OKUNACAK)
                socialButtonsBlockButton: "bg-[#1F2937] border border-white/10 hover:bg-[#374151] transition-colors",
                socialButtonsBlockButtonText: "text-white font-semibold !text-white", // Yazıyı zorla beyaz yaptık
                socialButtonsBlockButtonArrow: "text-white",
                
                // Input Alanları
                formFieldLabel: "text-gray-400 font-medium ml-1",
                formFieldInput: "bg-[#050A14] border border-white/10 !text-white placeholder:text-gray-600 focus:border-[#00FFFF] rounded-lg py-3",
                
                footer: "hidden",
                footerAction: "hidden"
              }
            }} 
          />
        </div>

        {/* --- ALT BÖLÜM (AYIRACI KALDIRDIK, BÜTÜNLEŞTİRDİK) --- */}
        <div className="bg-[#050A14]/50 border-t border-white/10 p-6 flex flex-col items-center gap-3">
          <p className="text-gray-400 text-sm font-medium">Hesabın yok mu?</p>
          
          <Link href="/sign-up" className="w-full">
            <button className="w-full py-3 bg-gradient-to-r from-[#00FFFF]/10 to-[#00FFFF]/5 border border-[#00FFFF]/20 text-[#00FFFF] font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-[#00FFFF] hover:text-black transition-all duration-300">
              KAYIT OL
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}