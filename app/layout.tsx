import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google"; 
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
    <html lang="tr">
      {/* bg-deep-navy yerine globals.css'deki rengi kullanalım ki çakışmasın */}
      <body className={`${inter.variable} ${rajdhani.variable} antialiased bg-[#050A14] text-slate-200`}>
        
        {/* Izgara katmanı (z-index globals.css'de 50 yaptık, burada en üstte görünecek) */}
        <div className="grid-overlay"></div>
        
        {/* Main etiketinin z-index değerini 0'a çektik ki ızgara üstte kalsın */}
        <main className="relative z-0 min-h-screen">
            {children}
        </main>
      </body>
    </html>
  );
}