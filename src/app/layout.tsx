import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SyncProvider } from "@/lib/offline/sync-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "GameHub — Chơi game trí tuệ mỗi ngày",
    template: "%s · GameHub",
  },
  description:
    "GameHub là nền tảng game giải trí trí tuệ: Sudoku và nhiều game nhỏ khác sẽ sớm ra mắt. Chơi mượt, đẹp, hoạt động cả khi mất mạng.",
  applicationName: "GameHub",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GameHub",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d16" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3ea" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RegisterServiceWorker />
        <ThemeProvider>
          <SyncProvider>{children}</SyncProvider>
        </ThemeProvider>

        <Script 
          src="https://js.mbidadm.com/static/scripts.js" 
          data-admpid="448488" 
          strategy="afterInteractive" 
          async
        />
      </body>
    </html>
  );
}
