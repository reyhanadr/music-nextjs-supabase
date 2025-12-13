import type { Metadata } from "next";
import { Inter, Lora, Nunito, Outfit } from "next/font/google";
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

const outfit = Outfit({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
});

export const metadata: Metadata = {
  title: "Music Party - Listen Together",
  description: "Share and enjoy music together in real-time party rooms. Create party rooms, sync YouTube music, and enjoy the same beat with friends—no matter where they are.",
  keywords: ["music", "party", "sync", "realtime", "youtube", "playlist", "streaming", "listen together", "music streaming", "party room"],
  authors: [{ name: "Reyhan Adriana Deris", url: "https://reyhanadr.com" }],
  creator: "Reyhan Adriana Deris",
  publisher: "Music Party",
  metadataBase: new URL("https://music-party.reyhanadr.com/"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://music-party.reyhanadr.com/",
    siteName: "Music Party",
    title: "Music Party - Listen Together, Party Together",
    description: "Create party rooms, sync YouTube music in real-time, and enjoy the same beat with friends—no matter where they are.",
    images: [
      {
        url: "/opengraph_poster.png",
        width: 1200,
        height: 630,
        alt: "Music Party - Listen Together, Party Together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Music Party - Listen Together, Party Together",
    description: "Create party rooms, sync YouTube music in real-time, and enjoy the same beat with friends—no matter where they are.",
    images: ["/opengraph_poster.png"],
    creator: "@reyhanadr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

import { PlayerProvider } from "@/contexts/PlayerContext";
import { GlobalMusicPlayer } from "@/components/player/GlobalMusicPlayer";
import { QueryProvider } from "@/providers/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased bg-slate-950 text-white`}>
        <QueryProvider>
          <PlayerProvider>
            {children}
            <GlobalMusicPlayer />
            <Toaster richColors position="top-right" />
          </PlayerProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
