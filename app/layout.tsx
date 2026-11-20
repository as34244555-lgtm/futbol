import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import { Providers } from "@/components/Providers";
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
  title: "ePITCH — Football",
  description:
    "Unlicensed football game with a live 3D pitch, eFootball-style hub and shared league.",
  icons: {
    icon: "/a-studio-192.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ePITCH",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
