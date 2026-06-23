import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMahasiswaDashboard,
  getDosenDashboard,
  getKaprodiDashboard,
} from "@/lib/dashboard";
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
