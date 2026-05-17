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
import { SeminarForm } from "./SeminarForm";
import { formatDate, formatDateTime } from "@/lib/utils";
import { SidangBadge } from "@/components/ui/status-badge";
import { SeminarApprove } from "./SeminarApprove";

export default async function SeminarPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "MAHASISWA") {
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      include: {
        pembimbingProposal: true,
        seminars: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!tesis) {
      redirect("/tesis");
    }

    const dosen = user.prodiId
      ? await prisma.user.findMany({
          where: {
            prodiId: user.prodiId,
            role: { in: ["DOSEN", "KAPRODI"] },
          },
          orderBy: { name: "asc" },
        })
      : [];

    const latest = tesis.seminars[0];

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seminar Proposal Tesis
          </h1>
          <p className="text-sm text-slate-500">
            Daftar seminar proposal & unggah Lembar Persetujuan Proposal.
          </p>
        </div>

        {!tesis.judulFinal && (
          <Alert variant="warning">
            Judul tesis Anda belum disetujui. Selesaikan tahap Pengajuan Judul
            terlebih dahulu.
          </Alert>
        )}

        {latest ? (
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Seminar</CardTitle>
              <CardDescription>
                Status:{" "}
                <SidangBadge result={latest.hasil} />
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2">
              <p className="text-sm">
                <strong>Tanggal:</strong> {formatDateTime(latest.jadwal)}
              </p>
              <p className="text-sm">
                <strong>Ruang:</strong> {latest.ruang || "(menunggu)"}
              </p>
              {latest.catatan && (
                <p className="text-sm text-slate-600">
                  <strong>Catatan:</strong> {latest.catatan}
                </p>
              )}
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Pendaftaran Seminar Proposal</CardTitle>
            <CardDescription>
              Lengkapi formulir berikut. Ada pratinjau sebelum kirim ke
              Pembimbing Proposal/Kaprodi.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <SeminarForm
              tesisId={tesis.id}
              dosen={dosen.map((d) => ({ id: d.id, name: d.name }))}
              defaultPembimbing={tesis.pembimbingProposalId ?? ""}
              mahasiswa={{
                name: user.name,
                nimNip: user.nimNip,
                prodi: user.prodi?.name ?? null,
                judul: tesis.judulFinal ?? "",
              }}
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  // Dosen / Kaprodi view
  const pending = await prisma.seminarProposal.findMany({
    where: { hasil: "BELUM" },
    include: {
      tesis: {
        include: { mahasiswa: { include: { prodi: true } } },
      },
    },
    orderBy: { jadwal: "asc" },
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">
        Antrian Seminar Proposal
      </h1>
      {pending.length === 0 ? (
        <Card>
          <CardBody className="text-center text-sm text-slate-500 py-10">
            Tidak ada antrian seminar.
          </CardBody>
        </Card>
      ) : (
        pending.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{s.tesis.mahasiswa.name}</CardTitle>
              <CardDescription>
                {s.tesis.mahasiswa.nimNip}
                {s.tesis.mahasiswa.prodi
                  ? ` · ${s.tesis.mahasiswa.prodi.name}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2">
              <p className="text-sm">
                <strong>Judul:</strong>{" "}
                {s.tesis.judulFinal || s.tesis.judul1 || "-"}
              </p>
              <p className="text-sm">
                <strong>Jadwal Diajukan:</strong> {formatDate(s.jadwal)}
              </p>
              <SeminarApprove id={s.id} />
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
