import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMahasiswaDashboard,
  getDosenDashboard,
  getKaprodiDashboard,
} from "@/lib/dashboard";
import { ClipboardList, FileText, Bell } from "lucide-react";
import { DashboardHero, StatCard } from "./_components/shared";
import { MahasiswaDashboard } from "./_components/MahasiswaDashboard";
import { DosenDashboard } from "./_components/DosenDashboard";
import { KaprodiDashboard } from "./_components/KaprodiDashboard";
import { AdminDashboard } from "./_components/AdminDashboard";

// Role-based dashboard. This page only resolves the current user and routes to
// the dashboard for their role; each role's data + view lives in its own module
// (lib/dashboard.ts + ./_components/*) so the title submission, bimbingan, and
// upload features can extend their slice without touching the others.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  switch (user.role) {
    case "MAHASISWA": {
      const data = await getMahasiswaDashboard(user.id);
      return <MahasiswaDashboard user={user} data={data} />;
    }
    case "DOSEN": {
      const [data, unreadNotif] = await Promise.all([
        getDosenDashboard(user.id),
        prisma.notification.count({
          where: { userId: user.id, readAt: null },
        }),
      ]);
      return (
        <DosenDashboard user={user} data={data} unreadNotif={unreadNotif} />
      );
    }
    case "KAPRODI": {
      const [data, unreadNotif] = await Promise.all([
        getKaprodiDashboard(user.prodiId),
        prisma.notification.count({
          where: { userId: user.id, readAt: null },
        }),
      ]);
      return (
        <KaprodiDashboard user={user} data={data} unreadNotif={unreadNotif} />
      );
    }
    // Dashboard TU: ringkas saja — fokus ke pemeriksaan berkas Seminar Proposal.
    case "TU": {
      const [seminarMhs, ujianMhs, unreadNotif] = await Promise.all([
        prisma.tesis.count({ where: { seminarBerkas: { some: {} } } }),
        prisma.tesis.count({ where: { ujianBerkas: { some: {} } } }),
        prisma.notification.count({
          where: { userId: user.id, readAt: null },
        }),
      ]);
      return (
        <div className="space-y-6">
          <DashboardHero
            name={user.name}
            role={user.role}
            prodiName={user.prodi?.name}
            nimNip={user.nimNip}
          />
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              icon={ClipboardList}
              label="Berkas Seminar Masuk"
              value={seminarMhs}
              accent="brand"
              href="/tu/seminar-berkas"
            />
            <StatCard
              icon={FileText}
              label="Berkas Ujian Masuk"
              value={ujianMhs}
              accent="emerald"
              href="/tu/ujian-berkas"
            />
            <StatCard
              icon={Bell}
              label="Notifikasi Baru"
              value={unreadNotif}
              accent="amber"
              href="/notifikasi"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tu/seminar-berkas" className="btn-primary">
              Cek Berkas Seminar Proposal
            </Link>
            <Link href="/tu/ujian-berkas" className="btn-secondary">
              Cek Berkas Ujian Tesis
            </Link>
          </div>
        </div>
      );
    }
    case "ADMIN":
    default: {
      const [userCount, prodiCount, unreadNotif, roleGroups, recentAudit] =
        await Promise.all([
          prisma.user.count(),
          prisma.prodi.count(),
          prisma.notification.count({
            where: { userId: user.id, readAt: null },
          }),
          prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
          prisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 6,
            select: {
              id: true,
              action: true,
              entity: true,
              createdAt: true,
              actor: { select: { name: true } },
            },
          }),
        ]);
      const roleCounts: Record<string, number> = {};
      for (const g of roleGroups) roleCounts[g.role] = g._count._all;
      return (
        <AdminDashboard
          user={user}
          userCount={userCount}
          prodiCount={prodiCount}
          unreadNotif={unreadNotif}
          roleCounts={roleCounts}
          recentAudit={recentAudit}
        />
      );
    }
  }
}
