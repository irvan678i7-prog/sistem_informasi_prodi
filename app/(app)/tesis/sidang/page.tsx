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
import { SidangForm } from "./SidangForm";
import { SidangResultPanel } from "./SidangResultPanel";
import { SidangBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function SidangPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "MAHASISWA") {
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      include: {
        sidang: { include: { penguji: { include: { dosen: true } } } },
        kut: true,
      },
    });
    if (!tesis) redirect("/tesis");

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Sidang Ujian Tesis
          </h1>
          <p className="text-sm text-slate-500">
            Pendaftaran sidang setelah KUT disetujui.
          </p>
        </div>

        {!tesis.kut || tesis.kut.status !== "APPROVED" ? (
          <Alert variant="warning">
            KUT belum disetujui penuh. Selesaikan tahap KUT terlebih dahulu.
          </Alert>
        ) : null}

        {tesis.sidang ? (
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Sidang</CardTitle>
              <CardDescription>
                <SidangBadge result={tesis.sidang.hasil} />
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p>
                <strong>Tanggal:</strong>{" "}
                {formatDateTime(tesis.sidang.jadwal)}
              </p>
              <p>
                <strong>Ruang:</strong> {tesis.sidang.ruang || "(menunggu)"}
              </p>
              <p>
                <strong>Mode:</strong> {tesis.sidang.mode}
              </p>
              {tesis.sidang.penguji.length > 0 && (
                <div>
                  <p className="font-medium">Penguji:</p>
                  <ul className="list-disc list-inside text-slate-700">
                    {tesis.sidang.penguji.map((p) => (
                      <li key={p.id}>
                        {p.dosen.name} ({p.peran})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pendaftaran Sidang</CardTitle>
              <CardDescription>
                Ajukan jadwal & mode sidang dengan pratinjau.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <SidangForm
                tesisId={tesis.id}
                disabled={!tesis.kut || tesis.kut.status !== "APPROVED"}
                mahasiswa={{
                  name: user.name,
                  nimNip: user.nimNip,
                  prodi: user.prodi?.name ?? null,
                  judul: tesis.judulFinal ?? "",
                }}
              />
            </CardBody>
          </Card>
        )}
      </div>
    );
  }

  // Staff
  const list = await prisma.sidangTesis.findMany({
    include: {
      tesis: { include: { mahasiswa: { include: { prodi: true } } } },
      penguji: { include: { dosen: true } },
    },
    orderBy: { jadwal: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Sidang Tesis</h1>
      {list.length === 0 ? (
        <Card>
          <CardBody className="text-center text-sm text-slate-500 py-10">
            Belum ada sidang.
          </CardBody>
        </Card>
      ) : (
        list.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle>{s.tesis.mahasiswa.name}</CardTitle>
              <CardDescription>
                {s.tesis.mahasiswa.nimNip} ·{" "}
                <SidangBadge result={s.hasil} />
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <p>
                <strong>Tanggal:</strong> {formatDate(s.jadwal)}
              </p>
              <p>
                <strong>Penguji:</strong>{" "}
                {s.penguji.map((p) => p.dosen.name).join(", ") ||
                  "(belum diset)"}
              </p>
              {s.hasil === "BELUM" && (
                <SidangResultPanel id={s.id} role={user.role} />
              )}
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
