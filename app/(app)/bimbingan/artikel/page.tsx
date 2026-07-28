import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StageBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

// Ubah nomor telepon menjadi tautan wa.me (asumsi nomor Indonesia).
function waHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (!d.startsWith("62")) d = "62" + d;
  return `https://wa.me/${d}`;
}

// Pembimbing list of students whose article worksheet they supervise.
export default async function BimbinganArtikelListPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "MAHASISWA") redirect("/tesis/bimbingan-artikel");

  // Scope per role:
  // - ADMIN: semua tesis.
  // - KAPRODI: semua tesis di prodinya (mengawasi, walau bukan pembimbing).
  // - DOSEN: hanya tesis di mana ia Pembimbing 1 atau 2.
  const where =
    user.role === "ADMIN"
      ? {}
      : user.role === "KAPRODI"
        ? user.prodiId
          ? { mahasiswa: { prodiId: user.prodiId } }
          : {}
        : {
            OR: [{ pembimbing1Id: user.id }, { pembimbing2Id: user.id }],
          };

  const list = await prisma.tesis.findMany({
    where,
    select: {
      id: true,
      judul1: true,
      judulFinal: true,
      stage: true,
      updatedAt: true,
      mahasiswa: {
        select: {
          name: true,
          nimNip: true,
          phone: true,
          prodi: { select: { code: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bimbingan Artikel / Tesis
        </h1>
        <p className="text-sm text-slate-500">
          Pilih mahasiswa untuk meninjau berkas dan mengisi evaluasi per bagian.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mahasiswa Bimbingan ({list.length})</CardTitle>
          <CardDescription>
            Sebagai Pembimbing 1 atau Pembimbing 2.
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {list.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Belum ada mahasiswa bimbingan.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Mahasiswa
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">Judul</th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Update
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.map((t) => {
                  const wa = waHref(t.mahasiswa.phone);
                  return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">
                        {t.mahasiswa.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.mahasiswa.nimNip}
                        {t.mahasiswa.prodi
                          ? ` · ${t.mahasiswa.prodi.code}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <p className="text-slate-900 truncate">
                        {t.judulFinal || t.judul1 || "(belum ada)"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <StageBadge stage={t.stage} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(t.updatedAt)}
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
                          <MessageCircle className="w-4 h-4" /> WA
                        </a>
                      )}
                      <Link
                        href={`/bimbingan/artikel/${t.id}`}
                        className="btn-ghost text-sm"
                      >
                        Buka
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
    </div>
  );
}
