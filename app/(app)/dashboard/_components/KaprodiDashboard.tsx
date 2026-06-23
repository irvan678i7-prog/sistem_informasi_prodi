// Kaprodi dashboard: jumlah dosen & mahasiswa + ringkasan progres tesis prodi.

import Link from "next/link";
import { Users, GraduationCap, BookOpen, Bell } from "lucide-react";
import { StageBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";
import type { KaprodiDashboardData } from "@/lib/dashboard";
import {
  DashboardHero,
  StatCard,
  SectionCard,
  EmptyState,
} from "./shared";
import { StageProgress } from "./StageProgress";
import type { Role } from "@prisma/client";

type User = {
  name: string;
  role: Role;
  nimNip: string;
  prodi?: { name: string } | null;
};

export function KaprodiDashboard({
  user,
  data,
  unreadNotif,
}: {
  user: User;
  data: KaprodiDashboardData;
  unreadNotif: number;
}) {
  const { dosenCount, mahasiswaCount, tesisTotal, stageCounts, recentTheses } =
    data;
  const selesai =
    stageCounts.find((s) => s.stage === "SELESAI")?.count ?? 0;

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

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Ringkasan Progres Tesis"
          description="Sebaran tahap tesis mahasiswa di prodi Anda"
        >
          <StageProgress counts={stageCounts} />
        </SectionCard>

        <SectionCard
          title="Tesis Terbaru"
          description="Pembaruan terakhir di prodi"
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
                    <p className="font-medium text-slate-900 truncate">
                      {t.mahasiswa.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {t.judulFinal || t.judul1 || "(judul belum ada)"} ·{" "}
                      {formatDateTime(t.updatedAt)}
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
        <Link href="/surat" className="btn-secondary">
          Antrian Surat
        </Link>
      </div>
    </div>
  );
}
