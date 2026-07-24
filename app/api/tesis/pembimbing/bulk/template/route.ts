import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Download template CSV bulk upload Pembimbing 1 & 2 (Kaprodi/Admin).
 * Template sudah berisi NIM + nama mahasiswa sesuai database, plus
 * pembimbing saat ini (jika sudah ada) agar tinggal melengkapi.
 */
export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  const where =
    session.role === "KAPRODI" && me?.prodiId
      ? { mahasiswa: { prodiId: me.prodiId } }
      : {};

  const tesisList = await prisma.tesis.findMany({
    where,
    select: {
      mahasiswa: { select: { name: true, nimNip: true } },
      pembimbing1: { select: { name: true } },
      pembimbing2: { select: { name: true } },
    },
    orderBy: { mahasiswa: { name: "asc" } },
  });

  const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"';
  const lines = [
    [
      "NIM",
      "Nama Mahasiswa",
      "Pembimbing 1 (NIP atau Nama)",
      "Pembimbing 2 (NIP atau Nama, opsional)",
    ]
      .map(esc)
      .join(";"),
    ...tesisList.map((t) =>
      [
        t.mahasiswa.nimNip,
        t.mahasiswa.name,
        t.pembimbing1?.name ?? "",
        t.pembimbing2?.name ?? "",
      ]
        .map(esc)
        .join(";"),
    ),
  ];

  // BOM agar Excel membaca karakter Indonesia dengan benar.
  const csv = "\uFEFF" + lines.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="template-pembimbing-1-2.csv"',
    },
  });
}
