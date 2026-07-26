import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCheckSeminarBerkas } from "@/lib/rbac";
import { CHECKLIST_CONFIG, parseChecklistApproval } from "@/lib/checklist";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Halaman TU: daftar mahasiswa yang mengunggah berkas Ujian Tesis untuk diceklis.
export default async function TuUjianBerkasListPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!canCheckSeminarBerkas(user.role)) redirect("/dashboard");

  const daftar = await prisma.tesis.findMany({
    where: { ujianBerkas: { some: {} } },
    select: {
      id: true,
      ujianChecklist: true,
      checklistApproval: true,
      updatedAt: true,
      mahasiswa: { select: { name: true, nimNip: true } },
      _count: { select: { ujianBerkas: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const total = CHECKLIST_CONFIG.ujian.items.length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Cek Berkas Ujian Tesis
        </h1>
        <p className="text-sm text-slate-500">
          Periksa kelengkapan berkas syarat Ujian Tesis, ceklis ADA / TIDAK ADA,
          lalu Sahkan &amp; Terbitkan agar mahasiswa dapat mengunduh dokumen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mahasiswa</CardTitle>
          <CardDescription>
            {daftar.length} mahasiswa telah mengunggah berkas.
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          {daftar.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Belum ada mahasiswa yang mengunggah berkas Ujian Tesis.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium text-slate-600">
                      Mahasiswa
                    </th>
                    <th className="px-3 py-2 font-medium text-slate-600 w-32">
                      Berkas Diunggah
                    </th>
                    <th className="px-3 py-2 font-medium text-slate-600 w-32">
                      Ceklis TU
                    </th>
                    <th className="px-3 py-2 font-medium text-slate-600 w-24" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {daftar.map((t) => {
                    const checks = Array.isArray(t.ujianChecklist)
                      ? (t.ujianChecklist as boolean[])
                      : [];
                    const checked = checks.filter(Boolean).length;
                    const approved = !!parseChecklistApproval(
                      t.checklistApproval,
                    ).ujian;
                    return (
                      <tr key={t.id}>
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">
                            {t.mahasiswa.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t.mahasiswa.nimNip}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          {t._count.ujianBerkas} / {total}
                        </td>
                        <td className="px-3 py-3">
                          {approved ? (
                            <span className="inline-block rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-1.5 py-0.5">
                              Disahkan
                            </span>
                          ) : checks.length > 0 ? (
                            <span className="inline-block rounded bg-blue-100 text-blue-800 text-[11px] font-semibold px-1.5 py-0.5">
                              {checked} / {total} ADA
                            </span>
                          ) : (
                            <span className="inline-block rounded bg-amber-100 text-amber-800 text-[11px] font-semibold px-1.5 py-0.5">
                              Belum dicek
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={"/tu/ujian-berkas/" + t.id}
                            className="text-brand-700 text-sm font-medium hover:underline"
                          >
                            Periksa
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
