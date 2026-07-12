import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  StageBadge,
  JudulStatusBadge,
  StatusBadge,
} from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

// Halaman detail tesis untuk Kaprodi, Dosen (PA/Pembimbing), dan mahasiswa
// pemilik tesis. Dituju dari tombol "Detail" pada dashboard dan daftar tesis.
export default async function TesisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const tesis = await prisma.tesis.findUnique({
    where: { id },
    include: {
      mahasiswa: { include: { prodi: true } },
      pa: { select: { name: true } },
      pembimbing1: { select: { name: true } },
      pembimbing2: { select: { name: true } },
      kut: true,
      sidang: true,
      seminars: { orderBy: { createdAt: "desc" }, take: 3 },
      timeline: {
        orderBy: { createdAt: "desc" },
        take: 15,
      },
    },
  });

  if (!tesis) notFound();

  // RequestTimeline hanya menyimpan actorId (tanpa relasi), jadi nama aktor
  // diambil lewat query terpisah.
  const actorIds = Array.from(
    new Set(
      tesis.timeline
        .map((t) => t.actorId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true },
      })
    : [];
  const actorName = new Map(actors.map((a) => [a.id, a.name]));

  // Kontrol akses: mahasiswa pemilik, dosen terkait (PA/P1/P2),
  // kaprodi/admin prodi yang sama.
  const isOwner = user.role === "MAHASISWA" && tesis.mahasiswaId === user.id;
  const isDosenTerkait =
    user.role === "DOSEN" &&
    [tesis.paId, tesis.pembimbing1Id, tesis.pembimbing2Id].includes(user.id);
  const isKaprodi =
    (user.role === "KAPRODI" || user.role === "ADMIN") &&
    (!user.prodiId || tesis.mahasiswa.prodiId === user.prodiId);

  if (!isOwner && !isDosenTerkait && !isKaprodi) notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detail Tesis</h1>
          <p className="text-sm text-slate-500">
            {tesis.mahasiswa.name} · NPM {tesis.mahasiswa.nimNip}
          </p>
        </div>
        <StageBadge stage={tesis.stage} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biodata Mahasiswa</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              <Row k="Nama" v={tesis.mahasiswa.name} />
              <Row k="NPM" v={tesis.mahasiswa.nimNip} />
              <Row k="Program Studi" v={tesis.mahasiswa.prodi?.name || "-"} />
              <Row k="Email" v={tesis.mahasiswa.email || "-"} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Judul &amp; Pembimbing</CardTitle>
              <CardDescription>
                Status judul: <JudulStatusBadge status={tesis.judulStatus} />
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-2">
              <Row
                k="Judul 1"
                v={joinJudul(tesis.judul1, tesis.jenis1)}
              />
              <Row
                k="Judul 2"
                v={joinJudul(tesis.judul2, tesis.jenis2)}
              />
              <Row
                k="Judul 3"
                v={joinJudul(tesis.judul3, tesis.jenis3)}
              />
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

          {(tesis.kut || tesis.sidang || tesis.seminars.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Progres Tahapan</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {tesis.seminars[0] && (
                  <Row
                    k="Seminar Proposal"
                    v={`${formatDateTime(tesis.seminars[0].jadwal)} · Hasil: ${tesis.seminars[0].hasil}`}
                  />
                )}
                {tesis.kut && (
                  <Row
                    k="KUT"
                    v={<StatusBadge status={tesis.kut.status} />}
                  />
                )}
                {tesis.sidang && (
                  <Row
                    k="Sidang"
                    v={`${formatDateTime(tesis.sidang.jadwal)}${tesis.sidang.ruang ? ` · ${tesis.sidang.ruang}` : ""}`}
                  />
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat</CardTitle>
              <CardDescription>Aktivitas terakhir</CardDescription>
            </CardHeader>
            <CardBody className="p-0">
              {tesis.timeline.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">
                  Belum ada aktivitas.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {tesis.timeline.map((t) => (
                    <li key={t.id} className="px-5 py-3">
                      <p className="text-sm text-slate-900">
                        {t.note || t.stage}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.actorId && actorName.get(t.actorId)
                          ? `${actorName.get(t.actorId)} · `
                          : ""}
                        {formatDateTime(t.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tautan Cepat</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              <QuickLink href="/tesis/judul" label="Pengajuan Judul" />
              <QuickLink
                href="/tesis/bimbingan-artikel"
                label="Kartu Bimbingan"
              />
              <QuickLink href="/tesis/kut" label="Kelayakan Ujian (KUT)" />
              {isKaprodi && (
                <QuickLink
                  href="/tesis/pembimbing"
                  label="Atur Pembimbing"
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function joinJudul(judul: string | null, jenis: string | null) {
  if (!judul) return "-";
  return jenis ? `${judul} (${jenis})` : judul;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 text-sm">
      <p className="text-slate-500">{k}</p>
      <div className="text-slate-900">{v}</div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}
