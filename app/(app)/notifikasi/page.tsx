import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { MarkAllReadButton } from "./MarkAllReadButton";

export default async function NotifikasiPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const list = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Auto mark visible as read
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
          <p className="text-sm text-slate-500">
            {list.length} notifikasi terbaru
          </p>
        </div>
        <MarkAllReadButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Notifikasi</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {list.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">
              Belum ada notifikasi.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {list.map((n) => {
                const inner = (
                  <div className="px-5 py-3 hover:bg-slate-50">
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {n.body && (
                      <p className="text-sm text-slate-600 mt-0.5">
                        {n.body}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} className="block">
                        {inner}
                      </Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
