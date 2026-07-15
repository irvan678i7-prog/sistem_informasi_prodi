import "./globals.css";
import type { Metadata } from "next";
import { Caveat, Poppins } from "next/font/google";

// Font utama mengikuti web resmi UM Metro (Poppins), dibatasi 3 bobot agar ringan.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
});

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
    <html
      lang="id"
      className={`${poppins.variable} ${caveat.variable} bg-background`}
    >
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
