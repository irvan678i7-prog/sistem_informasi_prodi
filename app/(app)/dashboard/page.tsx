import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMahasiswaDashboard,
  getDosenDashboard,
  getKaprodiDashboard,
} from "@/lib/dashboard";
import { Card, CardBody } from "@/components/ui/card";
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
      const [mhsCount, berkasCount, unreadNotif] = await Promise.all([
        prisma.tesis.count({ where: { seminarBerkas: { some: {} } } }),
        prisma.seminarBerkas.count(),
        prisma.notification.count({
          where: { userId: user.id, readAt: null },
        }),
      ]);
      return (
        <div className="max-w-4xl mx-auto space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dashboard Tata Usaha
            </h1>
            <p className="text-sm text-slate-500">
              Selamat datang, {user.name}.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Card>
              <CardBody>
                <p className="text-xs text-slate-500">
                  Mahasiswa unggah berkas
                </p>
                <p className="text-2xl font-bold text-slate-900">{mhsCount}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-slate-500">Total berkas masuk</p>
                <p className="text-2xl font-bold text-slate-900">
                  {berkasCount}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-xs text-slate-500">Notifikasi belum dibaca</p>
                <p className="text-2xl font-bold text-slate-900">
                  {unreadNotif}
                </p>
              </CardBody>
            </Card>
          </div>
          <Link
            href="/tu/seminar-berkas"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Cek Berkas Seminar Proposal
          </Link>
        </div>
      );
    }
    case "ADMIN":
    default: {
      const [userCount, prodiCount, unreadNotif] = await Promise.all([
        prisma.user.count(),
        prisma.prodi.count(),
        prisma.notification.count({
          where: { userId: user.id, readAt: null },
        }),
      ]);
      return (
        <AdminDashboard
          user={user}
          userCount={userCount}
          prodiCount={prodiCount}
          unreadNotif={unreadNotif}
        />
      );
    }
  }
}
