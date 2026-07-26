// Admin dashboard: account & master-data management + ringkasan pengguna.
// Admin tidak ikut alur akademik, jadi dashboard ini fokus ke pengelolaan.

import Link from "next/link";
import {
  Users,
  Building2,
  Cog,
  ShieldCheck,
  Bell,
  GraduationCap,
  UserCog,
  Activity,
} from "lucide-react";
import { DashboardHero, StatCard, SectionCard, EmptyState } from "./shared";
import { DonutChart } from "@/components/charts/DonutChart";
import { ROLE_LABEL } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import type { Role } from "@prisma/client";

type User = {
  name: string;
  role: Role;
  nimNip: string;
  prodi?: { name: string } | null;
};

type AuditRow = {
  id: string;
  action: string;
  entity: string | null;
  createdAt: Date;
  actor: { name: string } | null;
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "#0938b4",
  KAPRODI: "#8b5cf6",
  DOSEN: "#0ea5e9",
  MAHASISWA: "#22c55e",
  TU: "#f59e0b",
};

const QUICK_ACTIONS = [
  {
    href: "/admin/users",
    icon: Users,
    title: "Kelola User",
    desc: "Tambah, ubah, nonaktifkan akun",
  },
  {
    href: "/admin/prodi",
    icon: Building2,
    title: "Kelola Prodi",
    desc: "Program studi & Kaprodi",
  },
  {
    href: "/admin/master",
    icon: Cog,
    title: "Master Data",
    desc: "Identitas institusi & TTD",
  },
  {
    href: "/admin/audit",
    icon: ShieldCheck,
    title: "Audit Log",
    desc: "Riwayat aktivitas sistem",
  },
];

export function AdminDashboard({
  user,
  userCount,
  prodiCount,
  unreadNotif,
  roleCounts,
  recentAudit,
}: {
  user: User;
  userCount: number;
  prodiCount: number;
  unreadNotif: number;
  roleCounts: Record<string, number>;
  recentAudit: AuditRow[];
}) {
  const mahasiswa = roleCounts.MAHASISWA ?? 0;
  const dosen = (roleCounts.DOSEN ?? 0) + (roleCounts.KAPRODI ?? 0);

  const roleSegments = (["MAHASISWA", "DOSEN", "KAPRODI", "TU", "ADMIN"] as const)
    .map((r) => ({
      label: ROLE_LABEL[r],
      value: roleCounts[r] ?? 0,
      color: ROLE_COLOR[r],
    }))
    .filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <DashboardHero
        name={user.name}
        role={user.role}
        prodiName={user.prodi?.name}
        nimNip={user.nimNip}
        right={
          <div className="text-right">
            <p className="text-3xl font-bold leading-none">{userCount}</p>
            <p className="text-xs text-white/70 mt-1">Total Pengguna</p>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Mahasiswa"
          value={mahasiswa}
          accent="emerald"
          href="/admin/users"
        />
        <StatCard
          icon={UserCog}
          label="Dosen & Kaprodi"
          value={dosen}
          accent="sky"
          href="/admin/users"
        />
        <StatCard
          icon={Building2}
          label="Program Studi"
          value={prodiCount}
          accent="violet"
          href="/admin/prodi"
        />
        <StatCard
          icon={Bell}
          label="Notifikasi Baru"
          value={unreadNotif}
          accent="amber"
          href="/notifikasi"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Distribusi Pengguna"
          description="Komposisi akun berdasarkan peran"
        >
          {userCount === 0 ? (
            <EmptyState>Belum ada pengguna.</EmptyState>
          ) : (
            <DonutChart segments={roleSegments} centerLabel="Pengguna" />
          )}
        </SectionCard>

        <SectionCard
          title="Aktivitas Terbaru"
          description="Jejak audit sistem"
          action={
            <Link href="/admin/audit" className="btn-ghost text-sm">
              Lihat semua
            </Link>
          }
          bodyClassName="p-0"
        >
          {recentAudit.length === 0 ? (
            <EmptyState>Belum ada aktivitas.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentAudit.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 text-slate-500 grid place-items-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {a.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {a.actor?.name ?? "Sistem"}
                      {a.entity ? ` · ${a.entity}` : ""} ·{" "}
                      {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Pengelolaan Sistem"
        description="Akses cepat ke modul administrasi"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-brand-300 hover:bg-brand-50/40 hover:-translate-y-0.5"
            >
              <span className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center mb-2 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <a.icon className="w-5 h-5" />
              </span>
              <p className="font-medium text-slate-900 text-sm">{a.title}</p>
              <p className="text-xs text-slate-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
