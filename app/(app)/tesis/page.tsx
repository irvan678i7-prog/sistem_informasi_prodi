import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StageBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

export default async function TesisIndexPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "MAHASISWA") {
    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: user.id },
      include: {
        pa: true,
        pembimbing1: true,
        pembimbing2: true,
        sidang: true,
        kut: true,
        seminars: { orderBy: { createdAt: "desc" }, take: 1 },
        timeline: { orderBy: { createdAt: "desc" }, take: 6 },
      },
    });

    if (!tesis) {
      return (
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Tesis Saya</h1>
          <Card>
            <CardBody className="text-center py-12 space-y-4">
              <p className="text-slate-600">
                Anda belum memulai proses tesis. Mulailah dengan mengajukan
                judul kepada Pembimbing Akademik (PA).
              </p>
              <Link href="/tesis/judul" className="btn-primary">
                Ajukan Judul Tesis
              </Link>
            </CardBody>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tesis Saya</h1>
            <p className="text-sm text-slate-500">
              Alur tesis Anda sesuai POB Tesis PPs UM Metro
            </p>
          </div>
          <StageBadge stage={tesis.stage} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
                <CardDescription>Status dan judul tesis</CardDescription>
              </CardHeader>
              <CardBody className="space-y-2">
                <Row k="Judul 1" v={tesis.judul1 || "-"} />
                <Row k="Judul 2" v={tesis.judul2 || "-"} />
                <Row
                  k="Judul Disetujui"
                  v={tesis.judulFinal || <em>(menunggu)</em>}
                />
                <Row
                  k="Pembimbing Akademik"
                  v={tesis.pa?.name || "(belum ditetapkan)"}
                />
                <Row
                  k="Pembimbing 1"
                  v={tesis.pembimbing1?.name || "(belum ditetapkan)"}
                />
                <Row
                  k="Pembimbing 2"
                  v={tesis.pembimbing2?.name || "(belum ditetapkan)"}
                />
                {tesis.skBimbinganNo && (
                  <Row k="No. SK Pembimbing" v={tesis.skBimbinganNo} />
                )}
              </CardBody>
            </Card>

            <div className="grid sm:grid-cols-2 gap-3">
              <StageLink
                href="/tesis/judul"
                title="Pengajuan Judul"
                desc="Pengajuan 3 judul ke PA"
                active={tesis.stage === "JUDUL"}
                done={
                  tesis.stage !== "JUDUL" && tesis.judulStatus === "APPROVED"
                }
              />
              <StageLink
                href="/tesis/seminar"
                title="Seminar Proposal"
                desc="Pendaftaran & pelaksanaan"
                active={tesis.stage === "SEMINAR_PROPOSAL"}
                done={tesis.seminars[0]?.hasil !== "BELUM" && tesis.seminars.length > 0}
              />
              <StageLink
                href="/tesis/bimbingan"
                title="Bimbingan"
                desc="Catat progres bimbingan"
                active={tesis.stage === "BIMBINGAN"}
              />
              <StageLink
                href="/tesis/kut"
                title="Kelayakan Ujian Tesis (KUT)"
                desc="Persetujuan dosen pembimbing & Kaprodi"
                active={tesis.stage === "KUT"}
                done={tesis.kut?.status === "APPROVED"}
              />
              <StageLink
                href="/tesis/sidang"
                title="Sidang Ujian Tesis"
                desc="Pendaftaran & jadwal"
                active={tesis.stage === "SIDANG"}
                done={tesis.sidang?.hasil !== "BELUM" && tesis.sidang != null}
              />
              <StageLink
                href="/tesis/revisi"
                title="Revisi"
                desc="Unggah berkas revisi"
                active={tesis.stage === "REVISI"}
                done={tesis.stage === "SELESAI"}
              />
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Linimasa</CardTitle>
                <CardDescription>Riwayat tesis Anda</CardDescription>
              </CardHeader>
              <CardBody>
                {tesis.timeline.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada riwayat.</p>
                ) : (
                  <ol className="space-y-3">
                    {tesis.timeline.map((t) => (
                      <li key={t.id} className="flex gap-2 text-sm">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {t.stage}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(t.createdAt)}
                          </p>
                          {t.note && (
                            <p className="text-xs text-slate-600 mt-0.5">
                              {t.note}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Non-mahasiswa: list tesis dalam prodi
  const where =
    user.role === "ADMIN"
      ? {}
      : user.prodiId
        ? { mahasiswa: { prodiId: user.prodiId } }
        : {};
  const list = await prisma.tesis.findMany({
    where,
    include: { mahasiswa: { include: { prodi: true } }, kut: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daftar Tesis</h1>
        <p className="text-sm text-slate-500">
          {list.length} mahasiswa dalam pengelolaan
        </p>
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {list.length === 0 ? (
            <p className="px-5 py-12 text-sm text-slate-500 text-center">
              Belum ada data tesis.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Mahasiswa
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Judul
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Tahap
                  </th>
                  <th className="px-5 py-3 font-medium text-slate-600">
                    Update
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {list.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">
                        {t.mahasiswa.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.mahasiswa.nimNip}
                        {t.mahasiswa.prodi
                          ? ` · ${t.mahasiswa.prodi.code}`
                          : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3 max-w-md">
                      <p className="text-slate-900">
                        {t.judulFinal || t.judul1 || "(belum ada)"}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <StageBadge stage={t.stage} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(t.updatedAt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/tesis/${t.id}`}
                        className="btn-ghost text-sm"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 text-sm">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-slate-900">{v}</dd>
    </div>
  );
}

function StageLink({
  href,
  title,
  desc,
  active,
  done,
}: {
  href: string;
  title: string;
  desc: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "card p-4 hover:shadow-md transition-shadow " +
        (active
          ? "border-brand-600 ring-1 ring-brand-600"
          : done
            ? "border-green-300"
            : "")
      }
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">{title}</p>
        {done && <span className="badge-green">selesai</span>}
        {active && <span className="badge-blue">aktif</span>}
      </div>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </Link>
  );
}
