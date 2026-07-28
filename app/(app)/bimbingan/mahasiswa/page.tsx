import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StageBadge, JudulStatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

// Ubah nomor telepon (diisi Admin pada data user) menjadi tautan wa.me.
// Asumsi nomor Indonesia: 08xx → 628xx.
function waHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (!d.startsWith("62")) d = "62" + d;
  if (d.length < 9) return null;
  return `https://wa.me/${d}`;
}

type Row = {
  id: string;
  track: string;
  stage: "JUDUL" | "PROPOSAL" | "SEMINAR_PROPOSAL" | "BIMBINGAN" | "KUT" | "SIDANG" | "REVISI" | "SELESAI";
  judulStatus: "DRAFT" | "SUBMITTED" | "VERIFIED" | "APPROVED" | "REJECTED" | "COMPLETED";
  judul1: string | null;
  judulFinal: string | null;
  updatedAt: Date;
  paId: string | null;
  pembimbing1Id: string | null;
  pembimbing2Id: string | null;
  mahasiswa: {
    name: string;
    nimNip: string;
    phone: string | null;
    prodi: { code: string } | null;
  };
};

const SELECT = {
  id: true,
  track: true,
  stage: true,
  judulStatus: true,
  judul1: true,
  judulFinal: true,
  updatedAt: true,
  paId: true,
  pembimbing1Id: true,
  pembimbing2Id: true,
  mahasiswa: {
    select: {
      name: true,
      nimNip: true,
      phone: true,
      prodi: { select: { code: true } },
    },
  },
} as const;

// Daftar kontak mahasiswa bimbingan untuk dosen & kaprodi.
// Kaprodi memakai halaman yang sama karena ia juga bisa menjadi PA /
// Pembimbing 1 / Pembimbing 2; sebagai tambahan ia melihat seluruh mahasiswa
// prodinya pada tabel kedua.
export default async function MahasiswaBimbinganPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "MAHASISWA") redirect("/tesis");
  if (user.role === "TU") redirect("/dashboard");

  const mine = (await prisma.tesis.findMany({
    where: {
      OR: [
        { paId: user.id },
        { pembimbing1Id: user.id },
        { pembimbing2Id: user.id },
      ],
    },
    select: SELECT,
    orderBy: { updatedAt: "desc" },
    take: 200,
  })) as Row[];

  // Kaprodi (dan Admin) juga melihat mahasiswa lain di prodinya sebagai
  // pengawasan — tanpa duplikasi baris yang sudah muncul di tabel pertama.
  const mineIds = new Set(mine.map((t) => t.id));
  const others =
    user.role === "KAPRODI" || user.role === "ADMIN"
      ? ((await prisma.tesis.findMany({
          where: {
            id: { notIn: mine.map((t) => t.id) },
            ...(user.role === "KAPRODI" && user.prodiId
              ? { mahasiswa: { prodiId: user.prodiId } }
              : {}),
          },
          select: SELECT,
          orderBy: { updatedAt: "desc" },
          take: 200,
        })) as Row[]).filter((t) => !mineIds.has(t.id))
      : [];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Mahasiswa Bimbingan
        </h1>
        <p className="text-sm text-slate-500">
          Data mahasiswa yang Anda bimbing: nama, jalur (Tesis/Artikel), tahap
          saat ini, dan nomor WhatsApp. Nomor diambil dari data user yang diisi
          Admin.
        </p>
      </div>

      <StudentTable
        title={`Bimbingan Saya (${mine.length})`}
        description="Anda tercatat sebagai PA, Pembimbing 1, atau Pembimbing 2."
        rows={mine}
        userId={user.id}
        emptyText="Belum ada mahasiswa bimbingan."
      />

      {others.length > 0 && (
        <StudentTable
          title={`Mahasiswa Prodi Lainnya (${others.length})`}
          description="Bukan bimbingan Anda — ditampilkan untuk pengawasan prodi."
          rows={others}
          userId={user.id}
          emptyText="Tidak ada data."
        />
      )}
    </div>
  );
}

function StudentTable({
  title,
  description,
  rows,
  userId,
  emptyText,
}: {
  title: string;
  description: string;
  rows: Row[];
  userId: string;
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardBody className="p-0 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            {emptyText}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium text-slate-600">
                  Mahasiswa
                </th>
                <th className="px-5 py-3 font-medium text-slate-600">Jalur</th>
                <th className="px-5 py-3 font-medium text-slate-600">Peran</th>
                <th className="px-5 py-3 font-medium text-slate-600">Status</th>
                <th className="px-5 py-3 font-medium text-slate-600">
                  WhatsApp
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((t) => {
                const wa = waHref(t.mahasiswa.phone);
                const peran = [
                  t.paId === userId ? "PA" : null,
                  t.pembimbing1Id === userId ? "P1" : null,
                  t.pembimbing2Id === userId ? "P2" : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <tr key={t.id} className="hover:bg-slate-50 align-top">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">
                        {t.mahasiswa.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        NPM {t.mahasiswa.nimNip}
                        {t.mahasiswa.prodi
                          ? ` · ${t.mahasiswa.prodi.code}`
                          : ""}
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs truncate">
                        {t.judulFinal || t.judul1 || "(judul belum ada)"}
                      </p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {t.track === "ARTIKEL" ? "Artikel" : "Tesis"}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-600">
                      {peran || "—"}
                    </td>
                    <td className="px-5 py-3 space-y-1 whitespace-nowrap">
                      <StageBadge stage={t.stage} />
                      <div>
                        <JudulStatusBadge status={t.judulStatus} />
                      </div>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(t.updatedAt)}
                      </p>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {t.mahasiswa.phone ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {t.mahasiswa.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          belum diisi Admin
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost text-sm text-emerald-700 inline-flex items-center gap-1"
                          title={`WhatsApp ${t.mahasiswa.name}`}
                        >
                          <MessageCircle className="w-4 h-4" /> Chat WA
                        </a>
                      )}
                      <Link
                        href={`/bimbingan/artikel/${t.id}`}
                        className="btn-ghost text-sm"
                      >
                        Kartu
                      </Link>
                      <Link
                        href={`/tesis/${t.id}`}
                        className="btn-ghost text-sm"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
