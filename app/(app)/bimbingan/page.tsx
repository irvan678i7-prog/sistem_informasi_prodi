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
import { formatDate } from "@/lib/utils";
import { ApproveBimbinganButton } from "./ApproveBimbinganButton";

export default async function BimbinganDosenPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "MAHASISWA") redirect("/tesis/bimbingan");

  const items = await prisma.bimbinganLog.findMany({
    where: { dosenId: user.id, approved: false },
    include: {
      tesis: { include: { mahasiswa: true } },
    },
    orderBy: { tanggal: "desc" },
  });

  const recent = await prisma.bimbinganLog.findMany({
    where: { dosenId: user.id, approved: true },
    include: { tesis: { include: { mahasiswa: true } } },
    orderBy: { tanggal: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Bimbingan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Menunggu Paraf ({items.length})</CardTitle>
          <CardDescription>
            Catatan bimbingan mahasiswa yang perlu Anda paraf
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Tidak ada antrian.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Mahasiswa
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Topik
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((b) => (
                  <tr key={b.id} className="align-top">
                    <td className="px-5 py-3 whitespace-nowrap">
                      {formatDate(b.tanggal)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{b.tesis.mahasiswa.name}</p>
                      <p className="text-xs text-slate-500">
                        {b.tesis.mahasiswa.nimNip}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{b.topik}</p>
                      {b.catatan && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {b.catatan}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ApproveBimbinganButton id={b.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Paraf Terakhir</CardTitle>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Belum ada riwayat.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Tanggal
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Mahasiswa
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Topik
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recent.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {formatDate(b.tanggal)}
                    </td>
                    <td className="px-5 py-3">{b.tesis.mahasiswa.name}</td>
                    <td className="px-5 py-3">{b.topik}</td>
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
