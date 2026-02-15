import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { trTR } from "@clerk/localizations";
import { dark } from "@clerk/themes";

import "./globals.css";
import BanGuard from "@/components/BanGuard";
import FloatingSocialChatButton from "@/components/FloatingSocialChatButton";
import Navbar from "@/components/Navbar";
import SystemToastProvider from "@/components/SystemToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const rajdhani = Rajdhani({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
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
        },
      }}
    >
      <html lang="tr">
        <body className={`${inter.variable} ${rajdhani.variable} antialiased bg-[#050A14] text-slate-200`}>
          <div className="grid-overlay" />

          <SystemToastProvider>
            <BanGuard>
              <Navbar />
              <main className="relative z-0 min-h-screen pt-32">{children}</main>
              <FloatingSocialChatButton />
            </BanGuard>
          </SystemToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
