import type { Metadata } from "next";
import { Inter, Lora, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

const lora = Lora({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-lora',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const nunito = Nunito({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

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
      <body className={`${nunito.className} antialiased bg-slate-950 text-white`}>
        <PlayerProvider>
          {children}
          <GlobalMusicPlayer />
          <Toaster richColors position="top-center" />
        </PlayerProvider>
      </body>
    </html>
  );
}
