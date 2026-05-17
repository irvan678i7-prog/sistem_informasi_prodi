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
import { Alert } from "@/components/ui/alert";
import { RevisiForm } from "./RevisiForm";
import { formatDate } from "@/lib/utils";

export default async function RevisiPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") redirect("/tesis");

  const tesis = await prisma.tesis.findUnique({
    where: { mahasiswaId: user.id },
    include: { revisi: { orderBy: { createdAt: "desc" } } },
  });
  if (!tesis) redirect("/tesis");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revisi Tesis</h1>
        <p className="text-sm text-slate-500">
          Unggah berkas revisi setelah sidang.
        </p>
      </div>

      {tesis.stage === "SELESAI" ? (
        <Alert variant="success">
          Tesis Anda telah selesai. Selamat!
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Unggah Revisi</CardTitle>
          <CardDescription>
            Setiap pengajuan akan diverifikasi pembimbing/Kaprodi.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <RevisiForm tesisId={tesis.id} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Revisi</CardTitle>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {tesis.revisi.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Belum ada unggahan.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Catatan
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tesis.revisi.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-5 py-3">{r.catatan || "-"}</td>
                    <td className="px-5 py-3">
                      {r.approved ? (
                        <span className="badge-green">Diverifikasi</span>
                      ) : (
                        <span className="badge-yellow">Menunggu</span>
                      )}
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
