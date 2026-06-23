// Dosen dashboard: jumlah mahasiswa bimbingan + status tesis mereka.

import Link from "next/link";
import { Users, ClipboardList, Bell, GraduationCap } from "lucide-react";
import { StageBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";
import type { DosenDashboardData } from "@/lib/dashboard";
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

export function DosenDashboard({
  user,
  data,
  unreadNotif,
}: {
  user: User;
  data: DosenDashboardData;
  unreadNotif: number;
}) {
  const { bimbinganCount, stageCounts, pendingParaf, recentTheses } = data;
  const aktif = stageCounts
    .filter((s) => s.stage !== "SELESAI")
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <DashboardHero
        name={user.name}
        role={user.role}
        prodiName={user.prodi?.name}
        nimNip={user.nimNip}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Mahasiswa Bimbingan"
          value={bimbinganCount}
          href="/tesis"
        />
        <StatCard
          icon={GraduationCap}
          label="Tesis Aktif"
          value={aktif}
          hint="belum selesai"
          href="/tesis"
        />
        <StatCard
          icon={ClipboardList}
          label="Menunggu Paraf"
          value={pendingParaf}
          href="/bimbingan"
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
          title="Status Tesis Bimbingan"
          description="Sebaran tahap tesis mahasiswa bimbingan Anda"
        >
          <StageProgress counts={stageCounts} />
        </SectionCard>

        <SectionCard
          title="Mahasiswa Bimbingan"
          description="Pembaruan terbaru"
          action={
            <Link href="/tesis" className="btn-ghost text-sm">
              Lihat semua
            </Link>
          }
          bodyClassName="p-0"
        >
          {recentTheses.length === 0 ? (
            <EmptyState>Belum ada mahasiswa bimbingan.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentTheses.map((t) => (
                <li
                  key={t.id}
                  className="px-5 py-3 flex items-center gap-3"
                >
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
    </div>
  );
}
