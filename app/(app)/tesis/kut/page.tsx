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
import { KutForm } from "./KutForm";
import { KutApprove } from "./KutApprove";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function KutPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "MAHASISWA") {
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      include: { kut: true, pembimbing1: true, pembimbing2: true },
    });
    if (!tesis) redirect("/tesis");

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kelayakan Ujian Tesis (KUT)
          </h1>
          <p className="text-sm text-slate-500">
            Pengajuan kelayakan ujian setelah seluruh proses bimbingan selesai.
          </p>
        </div>

        {tesis.kut ? (
          <Card>
            <CardHeader>
              <CardTitle>Status KUT</CardTitle>
              <CardDescription>
                <StatusBadge status={tesis.kut.status} />
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p>
                <strong>Persetujuan Pembimbing 1:</strong>{" "}
                {tesis.kut.p1Approved ? "✓" : "—"}
              </p>
              <p>
                <strong>Persetujuan Pembimbing 2:</strong>{" "}
                {tesis.kut.p2Approved ? "✓" : "—"}
              </p>
              <p>
                <strong>Persetujuan Kaprodi:</strong>{" "}
                {tesis.kut.kaprodiApproved ? "✓" : "—"}
              </p>
              {tesis.kut.notes && (
                <p className="text-slate-600">
                  <strong>Catatan:</strong> {tesis.kut.notes}
                </p>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Form KUT</CardTitle>
              <CardDescription>
                Lengkapi data berikut + pratinjau sebelum submit.
              </CardDescription>
            </CardHeader>
            <CardBody>
              {!tesis.pembimbing1Id && (
                <Alert variant="warning">
                  Pembimbing belum ditetapkan. Hubungi Kaprodi untuk SK
                  Pembimbing.
                </Alert>
              )}
              <KutForm
                tesisId={tesis.id}
                mahasiswa={{
                  name: user.name,
                  nimNip: user.nimNip,
                  prodi: user.prodi?.name ?? null,
                  judul: tesis.judulFinal ?? "",
                  pembimbing1: tesis.pembimbing1?.name ?? "-",
                  pembimbing2: tesis.pembimbing2?.name ?? "-",
                }}
              />
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  // Dosen / Kaprodi view
  const pending = await prisma.kUT.findMany({
    where: {
      status: { in: ["DRAFT", "SUBMITTED", "VERIFIED"] },
    },
    include: {
      tesis: {
        include: {
          mahasiswa: { include: { prodi: true } },
          pembimbing1: true,
          pembimbing2: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Antrian KUT</h1>
      {pending.length === 0 ? (
        <Card>
          <CardBody className="text-center text-sm text-slate-500 py-10">
            Tidak ada antrian KUT.
          </CardBody>
        </Card>
      ) : (
        pending.map((k) => (
          <Card key={k.id}>
            <CardHeader>
              <CardTitle>{k.tesis.mahasiswa.name}</CardTitle>
              <CardDescription>
                {k.tesis.mahasiswa.nimNip} ·{" "}
                <StatusBadge status={k.status} />
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p>
                <strong>Judul:</strong> {k.tesis.judulFinal || "-"}
              </p>
              {k.notes && (
                <p className="text-slate-600">
                  <strong>Catatan:</strong> {k.notes}
                </p>
              )}
              <p>
                <strong>P1:</strong> {k.tesis.pembimbing1?.name || "-"} (
                {k.p1Approved ? "✓" : "—"})
                {"  ·  "}
                <strong>P2:</strong> {k.tesis.pembimbing2?.name || "-"} (
                {k.p2Approved ? "✓" : "—"})
                {"  ·  "}
                <strong>Kaprodi:</strong>{" "}
                {k.kaprodiApproved ? "✓" : "—"}
              </p>
              <KutApprove
                id={k.id}
                role={user.role}
                isP1={user.id === k.tesis.pembimbing1Id}
                isP2={user.id === k.tesis.pembimbing2Id}
              />
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
