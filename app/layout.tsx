import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google"; 
// 1. Clerk kütüphanesini ekliyoruz
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

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
    // 2. Tüm siteyi ClerkProvider ile sarmalıyoruz ki üyelik çalışsın
    <ClerkProvider>
      <html lang="tr">
        <body className={`${inter.variable} ${rajdhani.variable} antialiased bg-[#050A14] text-slate-200`}>
          
          {/* Izgara katmanı */}
          <div className="grid-overlay"></div>
          
          <main className="relative z-0 min-h-screen">
              {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}