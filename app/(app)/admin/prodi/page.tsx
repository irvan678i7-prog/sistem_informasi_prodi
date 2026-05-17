import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProdiForm } from "./ProdiForm";
import { ProdiActions } from "./ProdiActions";

export default async function AdminProdiPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN_SISTEM") redirect("/dashboard");

  const prodi = await prisma.prodi.findMany({
    include: { kaprodi: true, _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  });
  const kandidatKaprodi = await prisma.user.findMany({
    where: { role: { in: ["KAPRODI", "DOSEN"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kelola Prodi</h1>
        <p className="text-sm text-slate-500">
          Daftar program studi yang dikelola sistem.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Prodi</CardTitle>
        </CardHeader>
        <CardBody>
          <ProdiForm
            mode="create"
            initial={{ id: "", code: "", name: "", jenjang: "S2", kaprodiId: "" }}
            dosen={kandidatKaprodi}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Prodi</CardTitle>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2">Kode</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Jenjang</th>
                <th className="px-4 py-2">Kaprodi</th>
                <th className="px-4 py-2">Total User</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prodi.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada Prodi.
                  </td>
                </tr>
              ) : (
                prodi.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">{p.jenjang}</td>
                    <td className="px-4 py-2">{p.kaprodi?.name ?? "-"}</td>
                    <td className="px-4 py-2">{p._count.users}</td>
                    <td className="px-4 py-2 text-right">
                      <ProdiActions
                        prodi={{
                          id: p.id,
                          code: p.code,
                          name: p.name,
                          jenjang: p.jenjang,
                          kaprodiId: p.kaprodiId ?? "",
                        }}
                        dosen={kandidatKaprodi}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
