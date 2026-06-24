import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

// Pembimbing list of students whose article worksheet they supervise.
export default async function BimbinganArtikelListPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "MAHASISWA") redirect("/tesis/bimbingan-artikel");

  // Dosen/Kaprodi: theses where they are P1 or P2. Admin: all (scoped by prodi
  // is unnecessary here — admin oversees everything).
  const where =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [{ pembimbing1Id: user.id }, { pembimbing2Id: user.id }],
        };

  const list = await prisma.tesis.findMany({
    where,
    include: {
      mahasiswa: { include: { prodi: true } },
      pembimbing1: { select: { name: true } },
      pembimbing2: { select: { name: true } },
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
                    Update
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.map((t) => (
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
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(t.updatedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/bimbingan/artikel/${t.id}`}
                        className="btn-ghost text-sm"
                      >
                        Buka
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
