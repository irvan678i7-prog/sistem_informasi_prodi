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
import { SKPembimbingPanel } from "./SKPembimbingPanel";

export default async function SKPembimbingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (
    user.role !== "KAPRODI" &&
    user.role !== "WAKIL_DIREKTUR" &&
    user.role !== "DIREKTUR" &&
    user.role !== "ADMIN_SISTEM"
  )
    redirect("/tesis");

  const where = user.prodiId
    ? { mahasiswa: { prodiId: user.prodiId } }
    : {};
  const tesisList = await prisma.tesis.findMany({
    where: {
      ...where,
      judulStatus: "APPROVED",
      pembimbing1Id: null,
    },
    include: { mahasiswa: { include: { prodi: true } }, pa: true },
    orderBy: { updatedAt: "asc" },
  });

  const dosenList = user.prodiId
    ? await prisma.user.findMany({
        where: {
          prodiId: user.prodiId,
          role: { in: ["DOSEN", "KAPRODI"] },
        },
        orderBy: { name: "asc" },
      })
    : await prisma.user.findMany({
        where: { role: { in: ["DOSEN", "KAPRODI"] } },
        orderBy: { name: "asc" },
      });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Penetapan SK Pembimbing
        </h1>
        <p className="text-sm text-slate-500">
          Setelah judul disetujui PA, Kaprodi menetapkan Pembimbing 1 & 2 dan
          menandatangani SK secara elektronik.
        </p>
      </div>
      {tesisList.length === 0 ? (
        <Alert variant="info">
          Tidak ada antrian penetapan SK Pembimbing.
        </Alert>
      ) : (
        tesisList.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.mahasiswa.name}</CardTitle>
              <CardDescription>
                {t.mahasiswa.nimNip}
                {t.mahasiswa.prodi ? ` · ${t.mahasiswa.prodi.name}` : ""}
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2">
              <p className="text-sm">
                <strong>Judul:</strong> {t.judulFinal || "-"}
              </p>
              <p className="text-sm">
                <strong>PA:</strong> {t.pa?.name || "-"}
              </p>
              <SKPembimbingPanel
                tesisId={t.id}
                dosen={dosenList.map((d) => ({ id: d.id, name: d.name }))}
              />
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
