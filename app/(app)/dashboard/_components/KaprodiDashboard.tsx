// Kaprodi dashboard: jumlah dosen & mahasiswa + ringkasan progres tesis prodi,
// ditambah blok "Bimbingan Saya" karena kaprodi juga bisa menjadi PA /
// Pembimbing 1 / Pembimbing 2 (perannya sama seperti dosen).

import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  ClipboardList,
} from "lucide-react";
import { StageBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";
import type {
  KaprodiDashboardData,
  DosenDashboardData,
} from "@/lib/dashboard";
import {
  DashboardHero,
  StatCard,
  SectionCard,
  EmptyState,
} from "./shared";
import { StageProgress } from "./StageProgress";
import { DonutChart } from "@/components/charts/DonutChart";
import type { Role } from "@prisma/client";

type User = {
  name: string;
  role: Role;
  nimNip: string;
  prodi?: { name: string } | null;
};

// Label & warna per tahap untuk diagram donut sebaran tesis.
const STAGE_META: Record<string, { label: string; color: string }> = {
  JUDUL: { label: "Pengajuan Judul", color: "#6366f1" },
  PROPOSAL: { label: "Proposal", color: "#0ea5e9" },
  BIMBINGAN: { label: "Bimbingan", color: "#14b8a6" },
  SEMINAR_PROPOSAL: { label: "Seminar Proposal", color: "#06b6d4" },
  REVISI: { label: "Revisi", color: "#f43f5e" },
  KUT: { label: "Kelayakan Ujian", color: "#f59e0b" },
  SIDANG: { label: "Ujian Tesis", color: "#8b5cf6" },
  SELESAI: { label: "Selesai", color: "#22c55e" },
};

export function KaprodiDashboard({
  user,
  data,
  bimbingan,
  unreadNotif,
}: {
  user: User;
  data: KaprodiDashboardData;
  // Ringkasan bimbingan pribadi kaprodi (opsional agar komponen tetap dapat
  // dipakai tanpa data ini).
  bimbingan?: DosenDashboardData;
  unreadNotif: number;
}) {
  const { dosenCount, mahasiswaCount, tesisTotal, stageCounts, recentTheses } =
    data;
  const selesai =
    stageCounts.find((s) => s.stage === "SELESAI")?.count ?? 0;
  const stageSegments = stageCounts.map((s) => ({
    label: STAGE_META[s.stage]?.label ?? s.stage,
    value: s.count,
    color: STAGE_META[s.stage]?.color ?? "#94a3b8",
  }));

  // Blok bimbingan pribadi hanya ditampilkan bila kaprodi memang membimbing
  // atau punya paraf tertunda, supaya dashboard tidak penuh angka nol.
  const showBimbingan =
    !!bimbingan &&
    (bimbingan.bimbinganCount > 0 || bimbingan.pendingParaf > 0);

  return (
    <div className="space-y-6">
      <DashboardHero
        name={user.name}
        role={user.role}
        prodiName={user.prodi?.name}
        nimNip={user.nimNip}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Jumlah Dosen" value={dosenCount} />
        <StatCard
          icon={GraduationCap}
          label="Jumlah Mahasiswa"
          value={mahasiswaCount}
        />
        <StatCard
          icon={BookOpen}
          label="Tesis Berjalan"
          value={tesisTotal}
          hint={`${selesai} selesai`}
          href="/tesis"
        />
        <StatCard
          icon={Bell}
          label="Notifikasi Baru"
          value={unreadNotif}
          href="/notifikasi"
        />
      </div>

      {showBimbingan && bimbingan && (
        <SectionCard
          title="Bimbingan Saya"
          description="Mahasiswa yang Anda bimbing sebagai PA / Pembimbing 1 / Pembimbing 2"
          action={
            <Link href="/bimbingan/artikel" className="btn-ghost text-sm">
              Kartu Bimbingan
            </Link>
          }
        >
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <StatCard
                icon={BookOpen}
                label="Mahasiswa Bimbingan"
                value={bimbingan.bimbinganCount}
                accent="brand"
                href="/bimbingan/artikel"
              />
              <StatCard
                icon={ClipboardList}
                label="Menunggu Paraf Anda"
                value={bimbingan.pendingParaf}
                accent="amber"
              />
            </div>

            {bimbingan.recentTheses.length === 0 ? (
              <EmptyState>Belum ada mahasiswa bimbingan.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-200">
                {bimbingan.recentTheses.map((t) => (
                  <li key={t.id} className="py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {t.mahasiswa.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        NPM {t.mahasiswa.nimNip} ·{" "}
                        {t.judulFinal || t.judul1 || "(judul belum ada)"}
                      </p>
                    </div>
                    <StageBadge stage={t.stage} />
                    <Link
                      href={`/bimbingan/artikel/${t.id}`}
                      className="btn-ghost text-sm"
                    >
                      Nilai
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Ringkasan Progres Tesis"
          description="Sebaran tahap tesis mahasiswa di prodi Anda"
        >
          {tesisTotal === 0 ? (
            <StageProgress counts={stageCounts} />
          ) : (
            <div className="space-y-5">
              <DonutChart segments={stageSegments} centerLabel="Total Tesis" />
              <div className="border-t border-slate-100 pt-4">
                <StageProgress counts={stageCounts} />
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Mahasiswa Prodi"
          description="Klik nama mahasiswa untuk menetapkan pembimbing"
          action={
            <Link href="/tesis" className="btn-ghost text-sm">
              Lihat semua
            </Link>
          }
          bodyClassName="p-0"
        >
          {recentTheses.length === 0 ? (
            <EmptyState>Belum ada data tesis.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentTheses.map((t) => (
                <li key={t.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Biodata mini: nama (link ke penetapan pembimbing) + NPM */}
                    <Link
                      href="/tesis/pembimbing"
                      className="font-medium text-brand-700 hover:underline truncate block"
                    >
                      {t.mahasiswa.name}
                    </Link>
                    <p className="text-xs text-slate-500 truncate">
                      NPM {t.mahasiswa.nimNip} ·{" "}
                      {t.judulFinal || t.judul1 || "(judul belum ada)"} ·{" "}
                      {formatDateTime(t.updatedAt)}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      P1: {t.pembimbing1?.name ?? "—"} · P2:{" "}
                      {t.pembimbing2?.name ?? "—"}
                    </p>
                  </div>
                  <StageBadge stage={t.stage} />
                  <Link href={`/tesis/${t.id}`} className="btn-ghost text-sm">
                    Detail
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/tesis/pembimbing" className="btn-secondary">
          Atur Pembimbing
        </Link>
        <Link href="/tesis/sk-pembimbing" className="btn-secondary">
          SK Pembimbing
        </Link>
        <Link href="/bimbingan/artikel" className="btn-secondary">
          Kartu Bimbingan
        </Link>
        <Link href="/surat" className="btn-secondary">
          Antrian Surat
        </Link>
      </div>
    </div>
  );
}
