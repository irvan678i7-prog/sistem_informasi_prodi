import "./globals.css";
import type { Metadata } from "next";
import { Caveat } from "next/font/google";

// Font handwriting untuk catatan pembimbing pada Kartu Bimbingan.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
});

export const metadata: Metadata = {
  title: "Sistem Informasi Prodi - PPs UM Metro",
  description:
    "Sistem Informasi Prodi untuk layanan persuratan akademik digital dan manajemen tesis Program Pascasarjana UM Metro.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={caveat.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
