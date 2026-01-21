import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google"; 
import { ClerkProvider } from '@clerk/nextjs';
import { trTR } from '@clerk/localizations';
import { dark } from '@clerk/themes'; 
import "./globals.css";
import Navbar from "@/components/Navbar"; 
import BanGuard from "@/components/BanGuard"; // <-- YENİ EKLENDİ

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const rajdhani = Rajdhani({ 
  weight: ['400', '600', '700'], 
  subsets: ["latin"], 
  variable: "--font-rajdhani" 
});

export const metadata: Metadata = {
  title: "Snix - Oyunun Matematiği",
  description: "LoL Rehberleri ve İçerik Üssü",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      localization={trTR}
      appearance={{
        baseTheme: dark,
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
        },
        variables: {
          colorPrimary: "#00FFFF",
          colorBackground: "#0A1120",
        }
      }}
    >
      <html lang="tr">
        <body className={`${inter.variable} ${rajdhani.variable} antialiased bg-[#050A14] text-slate-200`}>
          
          <div className="grid-overlay"></div>
          
          {/* GÜVENLİK DUVARI: TÜM İÇERİĞİ SARIYORUZ */}
          <BanGuard>
            <Navbar />
            
            {/* Navbar fixed olduğu için içeriği pt-32 ile aşağı itiyoruz */}
            <main className="relative z-0 min-h-screen pt-32">
                {children}
            </main>
          </BanGuard>

        </body>
      </html>
    </ClerkProvider>
  );
}