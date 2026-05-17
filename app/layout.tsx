import "./globals.css";
import type { Metadata } from "next";

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
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
