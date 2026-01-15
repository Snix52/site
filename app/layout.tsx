import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google"; 
import { ClerkProvider } from '@clerk/nextjs';
import { trTR } from '@clerk/localizations';
import { dark } from '@clerk/themes'; 
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
    <ClerkProvider 
      localization={trTR}
      appearance={{
        baseTheme: dark,
        layout: {
          unsafe_disableDevelopmentModeWarnings: true, // Rozeti kökten uçurur
        },
        variables: {
          colorPrimary: "#00FFFF", // Neon turkuaz ana renk
          colorBackground: "#0A1120", // Kart arka planı
        }
      }}
    >
      <html lang="tr">
        <body className={`${inter.variable} ${rajdhani.variable} antialiased bg-[#050A14] text-slate-200`}>
          <div className="grid-overlay"></div>
          <main className="relative z-0 min-h-screen">
              {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}