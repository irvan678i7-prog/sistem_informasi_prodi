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
  "institusi.logo",
  "ttd.kaprodi.name",
  "ttd.kaprodi.nidn",
  "ttd.kaprodi.image",
] as const;

export default async function AdminMasterPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const dosen = await prisma.user.findMany({
    where: { role: { in: ["DOSEN", "KAPRODI"] }, isActive: true },
    select: { id: true, name: true, nimNip: true },
    orderBy: { name: "asc" },
  });
  const dosenKeys = dosen.map((d) => `ttd.dosen.${d.id}.image`);
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: [...KEYS, ...dosenKeys] } },
  });
  const map: Record<string, string> = {};
  for (const k of [...KEYS, ...dosenKeys]) {
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
          <MasterForm
            initial={map}
            dosen={dosen}
            dosenSignatures={Object.fromEntries(
              dosen.map((d) => [d.id, map[`ttd.dosen.${d.id}.image`] || ""]),
            )}
          />
        </CardBody>
      </Card>
    </div>
  );
}
