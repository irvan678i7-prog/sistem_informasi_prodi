import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN_SISTEM" && user.role !== "ADMIN_PRODI")
    redirect("/dashboard");

  const items = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500">
          200 entri terbaru aktivitas sistem.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat</CardTitle>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2">Waktu</th>
                <th className="px-4 py-2">Aktor</th>
                <th className="px-4 py-2">Aksi</th>
                <th className="px-4 py-2">Entitas</th>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada aktivitas.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDateTime(it.createdAt)}
                    </td>
                    <td className="px-4 py-2">{it.actor?.name ?? "-"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{it.action}</td>
                    <td className="px-4 py-2">{it.entity ?? "-"}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {it.entityId ?? "-"}
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate">
                      <code className="text-xs">
                        {it.metadata ? JSON.stringify(it.metadata) : "-"}
                      </code>
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
