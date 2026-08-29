import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import { GameProvider } from "@/lib/game-context";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const display = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Liga Nova — Futbol Menajerlik",
  description:
    "Telifsiz, istatistik tabanlı, 2D canlı saha simülasyonlu futbol menajerlik ve transfer oyunu.",
  icons: {
    icon: "/liga-nova-logo.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Liga Nova",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#05070a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
