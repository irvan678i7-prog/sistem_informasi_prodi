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
import { AssignPembimbingPanel } from "./AssignPembimbingPanel";
import { AssignPAPanel } from "./AssignPAPanel";

export const dynamic = "force-dynamic";

export default async function ManagePembimbingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "KAPRODI" && user.role !== "ADMIN")
    redirect("/dashboard");

  const where =
    user.role === "KAPRODI" && user.prodiId
      ? { mahasiswa: { prodiId: user.prodiId } }
      : {};

  const tesisList = await prisma.tesis.findMany({
    where,
    include: {
      mahasiswa: {
        include: { prodi: true, mahasiswaProfile: true },
      },
      pa: true,
      pembimbing1: true,
      pembimbing2: true,
      skBimbinganDoc: { select: { code: true, nomor: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const dosenList =
    user.role === "KAPRODI" && user.prodiId
      ? await prisma.user.findMany({
          where: {
            prodiId: user.prodiId,
            role: { in: ["DOSEN", "KAPRODI"] },
            isActive: true,
          },
          orderBy: { name: "asc" },
        })
      : await prisma.user.findMany({
          where: {
            role: { in: ["DOSEN", "KAPRODI"] },
            isActive: true,
          },
          orderBy: { name: "asc" },
        });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Mahasiswa & Pembimbing
        </h1>
        <p className="text-sm text-slate-500">
          Lihat semua mahasiswa di prodi Anda. Tetapkan Pembimbing Akademik
          (PA), serta Pembimbing 1 / 2 untuk tesis. Setiap penetapan
          Pembimbing 1/2 menerbitkan SK + notifikasi otomatis ke dosen.
        </p>
      </div>

      {tesisList.length === 0 ? (
        <Alert variant="info">
          Belum ada mahasiswa terdaftar di prodi Anda. Admin bisa menambah
          lewat menu Kelola User atau bulk upload CSV.
        </Alert>
      ) : (
        <div className="space-y-3">
          {tesisList.map((t) => {
            const hasP1 = !!t.pembimbing1Id;
            const judul =
              t.judulFinal || t.judul1 || t.judul2 || "(belum diisi)";
            return (
              <Card key={t.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle>{t.mahasiswa.name}</CardTitle>
                    <CardDescription>
                      NIM {t.mahasiswa.nimNip}
                      {t.mahasiswa.prodi
                        ? ` · ${t.mahasiswa.prodi.name}`
                        : ""}
                      {t.mahasiswa.mahasiswaProfile?.angkatan
                        ? ` · Angkatan ${t.mahasiswa.mahasiswaProfile.angkatan}`
                        : ""}
                      {t.mahasiswa.mahasiswaProfile?.semester
                        ? ` · Smt ${t.mahasiswa.mahasiswaProfile.semester}`
                        : ""}
                    </CardDescription>
                  </div>
                  <div className="shrink-0 flex flex-wrap gap-1">
                    {hasP1 ? (
                      <span className="badge-green">
                        Pembimbing terdaftar
                      </span>
                    ) : (
                      <span className="badge-yellow">
                        Belum ada pembimbing
                      </span>
                    )}
                    {t.skBimbinganDoc?.nomor && (
                      <span className="badge-gray">
                        SK: {t.skBimbinganDoc.nomor}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Judul</p>
                      <p className="font-medium">{judul}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">PA saat ini</p>
                      <p className="font-medium">
                        {t.pa?.name || (
                          <span className="text-slate-400">— belum —</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Pembimbing 1</p>
                      <p className="font-medium">
                        {t.pembimbing1?.name || (
                          <span className="text-slate-400">— belum —</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Pembimbing 2</p>
                      <p className="font-medium">
                        {t.pembimbing2?.name || (
                          <span className="text-slate-400">— belum —</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-slate-200 p-3 bg-slate-50">
                    <AssignPAPanel
                      tesisId={t.id}
                      dosen={dosenList.map((d) => ({
                        id: d.id,
                        name: d.name,
                      }))}
                      initialPaId={t.paId ?? ""}
                    />
                  </div>

                  <div className="rounded-md border border-slate-200 p-3">
                    <AssignPembimbingPanel
                      tesisId={t.id}
                      dosen={dosenList.map((d) => ({
                        id: d.id,
                        name: d.name,
                      }))}
                      initialP1={t.pembimbing1Id ?? ""}
                      initialP2={t.pembimbing2Id ?? ""}
                      hasExisting={hasP1}
                    />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
