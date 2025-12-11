import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music Party - Listen Together",
  description: "Share and enjoy music together in real-time party rooms",
};

import { PlayerProvider } from "@/contexts/PlayerContext";
import { GlobalMusicPlayer } from "@/components/player/GlobalMusicPlayer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-slate-950 text-white`}>
        <PlayerProvider>
          {children}
          <GlobalMusicPlayer />
          <Toaster richColors position="top-center" />
        </PlayerProvider>
      </body>
    </html>
  );
}
