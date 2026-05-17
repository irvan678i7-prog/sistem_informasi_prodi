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
import { BimbinganForm } from "./BimbinganForm";
import { formatDate } from "@/lib/utils";

export default async function BimbinganPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") redirect("/bimbingan");

  const tesis = await prisma.tesis.findUnique({
    where: { mahasiswaId: user.id },
    include: {
      pembimbing1: true,
      pembimbing2: true,
      bimbinganLogs: {
        orderBy: { tanggal: "desc" },
        include: { dosen: true },
      },
    },
  });
  if (!tesis) redirect("/tesis");

  const dosenList = user.prodiId
    ? await prisma.user.findMany({
        where: { prodiId: user.prodiId, role: { in: ["DOSEN", "KAPRODI"] } },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bimbingan Tesis</h1>
        <p className="text-sm text-slate-500">
          Catat setiap pertemuan bimbingan. Dosen akan memberi paraf elektronik.
        </p>
      </div>

      {!tesis.pembimbing1Id ? (
        <Alert variant="warning">
          Pembimbing 1 belum ditetapkan. Hubungi Kaprodi untuk penerbitan SK
          Pembimbing.
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>SK Pembimbing</CardTitle>
            <CardDescription>
              No. SK: {tesis.skBimbinganNo || "(menunggu)"}
            </CardDescription>
          </CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-2 text-sm">
            <p>
              <strong>Pembimbing 1:</strong>{" "}
              {tesis.pembimbing1?.name || "-"}
            </p>
            <p>
              <strong>Pembimbing 2:</strong>{" "}
              {tesis.pembimbing2?.name || "-"}
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Catat Bimbingan</CardTitle>
          <CardDescription>
            Tulis topik bimbingan + lampiran. Dosen menerima notifikasi untuk
            paraf.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <BimbinganForm
            tesisId={tesis.id}
            dosenList={dosenList.map((d) => ({ id: d.id, name: d.name }))}
            mahasiswa={{ name: user.name, nimNip: user.nimNip }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Bimbingan</CardTitle>
          <CardDescription>
            {tesis.bimbinganLogs.length} pertemuan tercatat
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {tesis.bimbinganLogs.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Belum ada catatan bimbingan.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Dosen
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Topik
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tesis.bimbinganLogs.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="px-5 py-3 whitespace-nowrap">
                      {formatDate(b.tanggal)}
                    </td>
                    <td className="px-5 py-3">{b.dosen.name}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{b.topik}</p>
                      {b.catatan && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {b.catatan}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {b.approved ? (
                        <span className="badge-green">Diparaf</span>
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
