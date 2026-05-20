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
import { StatusBadge } from "@/components/ui/status-badge";
import { JudulForm } from "./JudulForm";
import { JudulAction } from "./JudulAction";

export default async function PengajuanJudulPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Mahasiswa view
  if (user.role === "MAHASISWA") {
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      include: { pa: true },
    });

    // List of available PA (dosen in same prodi)
    const dosenList = user.prodiId
      ? await prisma.user.findMany({
          where: {
            prodiId: user.prodiId,
            role: { in: ["DOSEN", "KAPRODI"] },
          },
          orderBy: { name: "asc" },
        })
      : [];

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pengajuan Judul Tesis
          </h1>
          <p className="text-sm text-slate-500">
            Ajukan 2 judul kepada Pembimbing Akademik (PA). PA akan menyetujui
            salah satu judul.
          </p>
        </div>

        {tesis && tesis.judulStatus === "APPROVED" ? (
          <Card>
            <CardBody className="space-y-2">
              <Alert variant="success" title="Judul disetujui">
                Judul tesis Anda telah disetujui PA. Lanjutkan ke tahap
                penyusunan proposal.
              </Alert>
              <p className="text-sm">
                <strong>Judul Final:</strong> {tesis.judulFinal}
              </p>
              <p className="text-sm">
                <strong>PA:</strong> {tesis.pa?.name}
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengajuan Judul</CardTitle>
              <CardDescription>
                Isi dua opsi judul. Anda dapat melihat preview sebelum
                mengirim.
              </CardDescription>
            </CardHeader>
            <CardBody>
              {tesis?.judulStatus === "SUBMITTED" && (
                <Alert variant="info" title="Menunggu PA">
                  Pengajuan Anda telah dikirim. PA: {tesis.pa?.name || "-"}.
                  Status:{" "}
                  <span className="font-medium">
                    <StatusBadge status={tesis.judulStatus} />
                  </span>
                </Alert>
              )}
              {tesis?.judulStatus === "REJECTED" && (
                <Alert variant="error" title="Ditolak">
                  Pengajuan Anda ditolak. Silakan ajukan ulang.
                </Alert>
              )}
              <JudulForm
                dosen={dosenList.map((d) => ({ id: d.id, name: d.name }))}
                initial={
                  tesis
                    ? {
                        judul1: tesis.judul1 ?? "",
                        judul2: tesis.judul2 ?? "",
                        paId: tesis.paId ?? "",
                      }
                    : { judul1: "", judul2: "", paId: "" }
                }
                mahasiswa={{
                  name: user.name,
                  nimNip: user.nimNip,
                  prodi: user.prodi?.name ?? null,
                }}
              />
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  // PA / Dosen view: list of pending pengajuan judul to me
  if (
    user.role === "DOSEN" ||
    user.role === "KAPRODI" ||
    user.role === "ADMIN"
  ) {
    const items = await prisma.tesis.findMany({
      where: {
        ...(user.role === "ADMIN" ? {} : { paId: user.id }),
        judulStatus: "SUBMITTED",
      },
      include: { mahasiswa: { include: { prodi: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pengajuan Judul (Antrian PA)
          </h1>
          <p className="text-sm text-slate-500">
            Daftar pengajuan judul yang menunggu persetujuan Anda.
          </p>
        </div>
        {items.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10 text-sm text-slate-500">
              Tidak ada antrian.
            </CardBody>
          </Card>
        ) : (
          items.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>{t.mahasiswa.name}</CardTitle>
                <CardDescription>
                  {t.mahasiswa.nimNip}
                  {t.mahasiswa.prodi ? ` · ${t.mahasiswa.prodi.name}` : ""}
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Judul 1</p>
                  <p className="text-slate-900">{t.judul1 || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Judul 2</p>
                  <p className="text-slate-900">{t.judul2 || "-"}</p>
                </div>
                <JudulAction tesisId={t.id} />
              </CardBody>
            </Card>
          ))
        )}
      </div>
    );
  }

  redirect("/tesis");
}
