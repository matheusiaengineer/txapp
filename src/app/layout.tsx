import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ClientLayout } from "./client-layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TXAP — Mobilidade Inteligente",
  description: "Solicite corridas, entregas e fretes em uma única plataforma. Rápido, seguro e sem burocracia.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml", sizes: "192x192" },
    { rel: "apple-touch-icon", url: "/icon.svg", sizes: "192x192" },
  ],
  appleWebApp: {
    capable: true,
    title: "TXAP",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#3ECB8E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TXAP" />
      </head>
      <body className="min-h-[100dvh] flex flex-col bg-background text-foreground"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
