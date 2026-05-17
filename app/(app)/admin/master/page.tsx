import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterForm } from "./MasterForm";

const KEYS = [
  "institusi.namaPascasarjana",
  "institusi.alamat",
  "institusi.telp",
  "institusi.email",
  "institusi.website",
  "ttd.direktur.name",
  "ttd.direktur.nidn",
  "ttd.wadir.name",
  "ttd.wadir.nidn",
] as const;

export default async function AdminMasterPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN_SISTEM") redirect("/dashboard");

  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [...KEYS] } },
  });
  const map: Record<string, string> = {};
  for (const k of KEYS) {
    const r = rows.find((x) => x.key === k);
    map[k] = r ? String(r.value ?? "") : "";
  }
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Master Data</h1>
        <p className="text-sm text-slate-500">
          Identitas institusi dan data tanda tangan pejabat untuk dokumen.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Identitas & Tanda Tangan</CardTitle>
        </CardHeader>
        <CardBody>
          <MasterForm initial={map} />
        </CardBody>
      </Card>
    </div>
  );
}
