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
import { JudulStatusBadge } from "@/components/ui/status-badge";
import { getJudulComments } from "@/lib/judul";
import { JudulForm } from "./JudulForm";
import { JudulAction } from "./JudulAction";
import { JudulComments } from "./JudulComments";

export default async function PengajuanJudulPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Mahasiswa view
  if (user.role === "MAHASISWA") {
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      include: { pa: true },
    });

    const comments = tesis ? await getJudulComments(tesis.id) : [];

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

    // Nama Kaprodi prodi mahasiswa — untuk blok tanda tangan pada preview formulir.
    const kaprodi = user.prodiId
      ? await prisma.user.findFirst({
          where: { role: "KAPRODI", prodiId: user.prodiId, isActive: true },
          select: { name: true },
        })
      : null;

    // Editing terkunci setelah judul disetujui PA (VERIFIED) atau difinalisasi
    // Kaprodi (APPROVED). Untuk menyunting lagi, reviewer harus meminta revisi
    // sehingga status kembali ke DRAFT.
    const locked =
      tesis?.judulStatus === "VERIFIED" || tesis?.judulStatus === "APPROVED";

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Pengajuan Judul Tesis
            </h1>
            <p className="text-sm text-slate-500">
              Ajukan 3 rencana judul kepada Dosen Pembimbing Akademik (PA). PA
              menyetujui dulu, lalu Kaprodi memfinalisasi.
            </p>
          </div>
          {tesis && <JudulStatusBadge status={tesis.judulStatus} />}
        </div>

        {locked ? (
          <Card>
            <CardBody className="space-y-2">
              {tesis?.judulStatus === "APPROVED" ? (
                <Alert variant="info" title="Judul disetujui">
                  Judul tesis Anda telah disetujui dan difinalisasi. Pengajuan
                  ini terkunci dan tidak dapat diubah.
                </Alert>
              ) : (
                <Alert variant="info" title="Disetujui PA — menunggu Kaprodi">
                  Judul Anda telah disetujui PA (
                  <strong>{tesis?.pa?.name || "-"}</strong>) dan diteruskan ke
                  Kaprodi untuk finalisasi. Pengajuan terkunci selama proses ini.
                </Alert>
              )}
              <p className="text-sm">
                <strong>Judul:</strong> {tesis?.judulFinal}
              </p>
              <p className="text-sm">
                <strong>PA:</strong> {tesis?.pa?.name || "-"}
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengajuan Judul</CardTitle>
              <CardDescription>
                Isi tiga rencana judul beserta jenis penelitiannya. Anda dapat
                melihat preview format resmi sebelum mengirim.
              </CardDescription>
            </CardHeader>
            <CardBody>
              {tesis?.judulStatus === "REJECTED" && (
                <Alert variant="error" title="Ditolak">
                  Pengajuan Anda ditolak. Silakan periksa catatan di bawah dan
                  ajukan ulang.
                </Alert>
              )}
              {tesis?.judulStatus === "DRAFT" && (
                <Alert variant="warning" title="Perlu Revisi">
                  Reviewer meminta revisi. Perbaiki judul sesuai catatan di bawah
                  lalu ajukan ulang.
                </Alert>
              )}
              <JudulForm
                dosen={dosenList.map((d) => ({ id: d.id, name: d.name }))}
                initial={
                  tesis
                    ? {
                        judul1: tesis.judul1 ?? "",
                        judul2: tesis.judul2 ?? "",
                        judul3: tesis.judul3 ?? "",
                        jenis1: tesis.jenis1 ?? "",
                        jenis2: tesis.jenis2 ?? "",
                        jenis3: tesis.jenis3 ?? "",
                        paId: tesis.paId ?? "",
                        track: tesis.track ?? "TESIS",
                      }
                    : {
                        judul1: "",
                        judul2: "",
                        judul3: "",
                        jenis1: "",
                        jenis2: "",
                        jenis3: "",
                        paId: "",
                        track: "TESIS",
                      }
                }
                mahasiswa={{
                  name: user.name,
                  nimNip: user.nimNip,
                  prodi: user.prodi?.name ?? null,
                }}
                kaprodiName={kaprodi?.name ?? null}
              />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Komentar & Catatan</CardTitle>
            <CardDescription>
              Riwayat komentar dan permintaan revisi dari PA / Kaprodi.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <JudulComments comments={comments} />
          </CardBody>
        </Card>
      </div>
    );
  }

  // PA / Dosen / Kaprodi view: queue dipisah berdasarkan role.
  if (
    user.role === "DOSEN" ||
    user.role === "KAPRODI" ||
    user.role === "ADMIN"
  ) {
    // PA queue: tesis yang paId-nya = user (atau semua kalau ADMIN), status SUBMITTED
    const paItems = await prisma.tesis.findMany({
      where: {
        ...(user.role === "ADMIN" ? {} : { paId: user.id }),
        judulStatus: "SUBMITTED",
      },
      include: { mahasiswa: { include: { prodi: true } } },
      orderBy: { updatedAt: "desc" },
    });

    // Kaprodi queue: tesis di prodi user, status VERIFIED (sudah disetujui PA, menunggu finalisasi).
    const kaprodiItems =
      user.role === "KAPRODI" || user.role === "ADMIN"
        ? await prisma.tesis.findMany({
            where: {
              judulStatus: "VERIFIED",
              ...(user.role === "KAPRODI" && user.prodiId
                ? { mahasiswa: { prodiId: user.prodiId } }
                : {}),
            },
            include: {
              mahasiswa: { include: { prodi: true } },
              pa: { select: { name: true } },
            },
            orderBy: { updatedAt: "desc" },
          })
        : [];

    // Comments untuk seluruh item yang ditampilkan, dipetakan per tesis.
    const visibleIds = [
      ...paItems.map((t) => t.id),
      ...kaprodiItems.map((t) => t.id),
    ];
    const commentsByTesis = new Map(
      await Promise.all(
        visibleIds.map(
          async (tid) => [tid, await getJudulComments(tid)] as const,
        ),
      ),
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pengajuan Judul Tesis
          </h1>
          <p className="text-sm text-slate-500">
            Alur: Mahasiswa → PA (rekomendasi) → Kaprodi (finalisasi).
          </p>
        </div>

        {/* PA queue */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-800">Antrian PA</h2>
          <p className="text-xs text-slate-500">
            Pengajuan yang menunggu rekomendasi Anda sebagai PA.
          </p>
          {paItems.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8 text-sm text-slate-500">
                Tidak ada antrian PA.
              </CardBody>
            </Card>
          ) : (
            paItems.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle>{t.mahasiswa.name}</CardTitle>
                  <CardDescription>
                    {t.mahasiswa.nimNip}
                    {t.mahasiswa.prodi ? ` · ${t.mahasiswa.prodi.name}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardBody className="space-y-3">
                  {(
                    [
                      { judul: t.judul1, jenis: t.jenis1 },
                      { judul: t.judul2, jenis: t.jenis2 },
                      { judul: t.judul3, jenis: t.jenis3 },
                    ] as const
                  ).map((row, i) => (
                    <div key={i}>
                      <p className="text-xs text-slate-500">
                        Judul {i + 1}
                        {row.jenis ? ` · ${row.jenis}` : ""}
                      </p>
                      <p className="text-slate-900">{row.judul || "-"}</p>
                    </div>
                  ))}
                  <JudulAction tesisId={t.id} mode="pa" />
                  <CommentsBlock comments={commentsByTesis.get(t.id) ?? []} />
                </CardBody>
              </Card>
            ))
          )}
        </section>

        {/* Kaprodi queue */}
        {(user.role === "KAPRODI" || user.role === "ADMIN") && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800">
              Antrian Finalisasi Kaprodi
            </h2>
            <p className="text-xs text-slate-500">
              Judul yang sudah direkomendasikan PA, menunggu finalisasi Kaprodi.
            </p>
            {kaprodiItems.length === 0 ? (
              <Card>
                <CardBody className="text-center py-8 text-sm text-slate-500">
                  Tidak ada antrian finalisasi.
                </CardBody>
              </Card>
            ) : (
              kaprodiItems.map((t) => (
                <Card key={t.id}>
                  <CardHeader>
                    <CardTitle>{t.mahasiswa.name}</CardTitle>
                    <CardDescription>
                      {t.mahasiswa.nimNip}
                      {t.mahasiswa.prodi ? ` · ${t.mahasiswa.prodi.name}` : ""}
                      {t.pa?.name ? ` · PA: ${t.pa.name}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Judul Final (rekomendasi PA)
                      </p>
                      <p className="text-slate-900 font-medium">
                        {t.judulFinal || "-"}
                      </p>
                    </div>
                    <JudulAction tesisId={t.id} mode="kaprodi" />
                    <CommentsBlock comments={commentsByTesis.get(t.id) ?? []} />
                  </CardBody>
                </Card>
              ))
            )}
          </section>
        )}
      </div>
    );
  }

  redirect("/tesis");
}

function CommentsBlock({
  comments,
}: {
  comments: Awaited<ReturnType<typeof getJudulComments>>;
}) {
  if (comments.length === 0) return null;
  return (
    <div className="pt-3 border-t border-slate-200">
      <p className="text-xs font-medium text-slate-500 mb-2">
        Komentar & Catatan
      </p>
      <JudulComments comments={comments} />
    </div>
  );
}
