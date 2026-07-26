import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LETTER_LABEL } from "@/lib/letterTemplates";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";
import { canHandleLetter } from "@/lib/rbac";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";

export default async function SuratIndexPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const isStaff = canHandleLetter(user.role);
  const isMhs = user.role === "MAHASISWA";

  // Batasi daftar surat per peran:
  //  - MAHASISWA  -> hanya surat miliknya
  //  - ADMIN      -> semua surat
  //  - KAPRODI/DOSEN/TU -> hanya surat mahasiswa di prodinya
  //  - staf tanpa prodi -> tidak melihat apa pun (default aman, bukan semua)
  // Sebelumnya cabang non-mahasiswa jatuh ke `{}` sehingga DOSEN & TU bisa
  // melihat SELURUH surat lintas prodi (IDOR).
  const where: Prisma.LetterRequestWhereInput = isMhs
    ? { mahasiswaId: user.id }
    : user.role === "ADMIN"
      ? {}
      : user.prodiId
        ? { mahasiswa: { prodiId: user.prodiId } }
        : { id: "__none__" };

  const letters = await prisma.letterRequest.findMany({
    where,
    // `select` seperlunya: tanpa ini `include: { mahasiswa: ... }` menarik
    // seluruh kolom User (termasuk hashedPassword) ke dalam payload halaman.
    include: {
      mahasiswa: {
        select: { name: true, nimNip: true, prodi: { select: { code: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Persuratan</h1>
          <p className="text-sm text-slate-500">
            {isMhs
              ? "Riwayat pengajuan surat akademik Anda."
              : "Daftar pengajuan surat yang masuk."}
          </p>
        </div>
        {isMhs && (
          <Link href="/surat/baru" className="btn-primary">
            <Plus className="w-4 h-4 mr-1.5" /> Ajukan Surat
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan</CardTitle>
          <CardDescription>
            {letters.length} pengajuan
            {isStaff ? " untuk diproses" : " milik Anda"}
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {letters.length === 0 ? (
            <p className="px-5 py-12 text-sm text-slate-500 text-center">
              Belum ada pengajuan surat.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Jenis Surat
                  </th>
                  {!isMhs && (
                    <th className="px-5 py-3 font-medium text-slate-600">
                      Mahasiswa
                    </th>
                  )}
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Nomor
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {letters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(l.createdAt)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {LETTER_LABEL[l.type]}
                    </td>
                    {!isMhs && (
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">
                          {l.mahasiswa.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {l.mahasiswa.nimNip}
                          {l.mahasiswa.prodi
                            ? ` · ${l.mahasiswa.prodi.code}`
                            : ""}
                        </p>
                      </td>
                    )}
                    <td className="px-5 py-3 text-slate-600">
                      {l.nomor || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/surat/${l.id}`}
                        className="btn-ghost text-sm"
                      >
                        Lihat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
