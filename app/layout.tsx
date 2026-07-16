import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ساحة البلوت",
  description: "حسبة البلوت والمنافسات والإحصائيات",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
