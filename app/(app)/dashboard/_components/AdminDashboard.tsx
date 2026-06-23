// Admin dashboard: account & master-data management entry points.
// Admin tidak ikut alur akademik, jadi dashboard ini fokus ke pengelolaan.

import Link from "next/link";
import { Users, Building2, Cog, ShieldCheck, Bell } from "lucide-react";
import { DashboardHero, StatCard, SectionCard } from "./shared";
import type { Role } from "@prisma/client";

type User = {
  name: string;
  role: Role;
  nimNip: string;
  prodi?: { name: string } | null;
};

export function AdminDashboard({
  user,
  userCount,
  prodiCount,
  unreadNotif,
}: {
  user: User;
  userCount: number;
  prodiCount: number;
  unreadNotif: number;
}) {
  return (
    <div className="space-y-6">
      <DashboardHero
        name={user.name}
        role={user.role}
        prodiName={user.prodi?.name}
        nimNip={user.nimNip}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total User"
          value={userCount}
          href="/admin/users"
        />
        <StatCard
          icon={Building2}
          label="Program Studi"
          value={prodiCount}
          href="/admin/prodi"
        />
        <StatCard
          icon={Bell}
          label="Notifikasi Baru"
          value={unreadNotif}
          href="/notifikasi"
        />
      </div>

      <SectionCard
        title="Pengelolaan Sistem"
        description="Akses cepat ke modul administrasi"
      >
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users" className="btn-secondary">
            <Users className="w-4 h-4" /> Kelola User
          </Link>
          <Link href="/admin/prodi" className="btn-secondary">
            <Building2 className="w-4 h-4" /> Kelola Prodi
          </Link>
          <Link href="/admin/master" className="btn-secondary">
            <Cog className="w-4 h-4" /> Master Data
          </Link>
          <Link href="/admin/audit" className="btn-secondary">
            <ShieldCheck className="w-4 h-4" /> Audit Log
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
