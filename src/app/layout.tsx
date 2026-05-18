import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VOX, Palestras e Sermões",
    template: "%s · VOX",
  },
  description:
    "Companheiro silencioso do púlpito. Prepare, pregue e arquive sermões, palestras e aulas com frameworks homiléticos.",
  applicationName: "VOX",
  authors: [{ name: "VOX" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo/png/vox-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/png/vox-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo/png/vox-favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/logo/png/vox-favicon-128.png", sizes: "128x128", type: "image/png" },
    ],
    shortcut: "/logo/png/vox-favicon-128.png",
    apple: [
      { url: "/logo/png/vox-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/png/vox-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VOX",
    startupImage: "/logo/png/vox-app-icon-1024.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "VOX",
    title: "VOX, Palestras e Sermões",
    description:
      "Companheiro silencioso do púlpito. Prepare, pregue e arquive sermões, palestras e aulas.",
    images: [
      {
        url: "/logo/png/vox-wordmark-1280.png",
        width: 1280,
        height: 640,
        alt: "VOX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOX, Palestras e Sermões",
    description:
      "Companheiro silencioso do púlpito. Prepare, pregue e arquive sermões, palestras e aulas.",
    images: ["/logo/png/vox-wordmark-1280.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F0D" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors closeButton position="top-right" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
