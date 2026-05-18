import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { IncomingShareHandler } from "@/components/incoming-share-handler";
import { HydrationGate } from "@/components/hydration-gate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

const title = "Álbum Mundial 2026";
const description =
  "Tu álbum Panini del Mundial 2026: cromos, repes e intercambios con amigos.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Álbum Mundial 2026",
  },
  description,
  applicationName: "Álbum 2026",
  generator: undefined,
  keywords: [
    "álbum",
    "Panini",
    "Mundial 2026",
    "FIFA World Cup 26",
    "cromos",
    "stickers",
    "intercambios",
  ],
  authors: [{ name: "Daniel Seijo" }],
  creator: "Daniel Seijo",
  publisher: "Daniel Seijo",
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Álbum 2026",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "Álbum Mundial 2026",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  // El header de la app es carbón cálido siempre (token --primary)
  // en ambos modos para mantener la identidad FIFA, así que la barra
  // de estado lo refleja sin saltos visuales.
  themeColor: "#2a2520",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground flex flex-col">
        <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <HydrationGate>{children}</HydrationGate>
        </main>
        <BottomNav />
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
        <IncomingShareHandler />
      </body>
    </html>
  );
}
