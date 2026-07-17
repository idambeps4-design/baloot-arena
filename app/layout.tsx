import type { Metadata, Viewport } from "next";
import ConnectionStatus from "@/components/ConnectionStatus";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Balot Arena",
    template: "%s | Balot Arena",
  },
  description: "تطبيق إدارة وحساب صكات البلوت والمنافسات والإحصائيات",
  applicationName: "Balot Arena",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Balot Arena",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#021b13",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <PwaRegister />
        <ConnectionStatus />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}
