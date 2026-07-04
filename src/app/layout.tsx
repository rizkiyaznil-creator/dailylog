import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DailyLog — Catatan Harian jadi Laporan Mingguan",
  description:
    "Catat aktivitas harian (teks, suara, gambar) dan ubah menjadi laporan mingguan yang rapi dengan analisis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
