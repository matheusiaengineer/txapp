import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TXDAPP — Mobilidade Inteligente",
  description: "Solicite corridas, entregas e fretes em uma única plataforma. Rápido, seguro e sem burocracia.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml", sizes: "192x192" },
    { rel: "apple-touch-icon", url: "/icon.svg", sizes: "192x192" },
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml", sizes: "512x512" },
    { rel: "apple-touch-icon", url: "/icon.svg", sizes: "512x512" },
  ],
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "TXDAPP",
  },
  keywords: "aplicativo de corrida, corrida de moto, entrega, frete, mudança, mototáxi, motorista particular, transporte, logística",
  openGraph: {
    title: "TXDAPP — Mobilidade Inteligente",
    description: "Solicite corridas, entregas e fretes em uma única plataforma.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3ECB8E",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon.svg" sizes="192x192" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icon.svg" sizes="512x512" />
      </head>
      <body className="min-h-full flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
