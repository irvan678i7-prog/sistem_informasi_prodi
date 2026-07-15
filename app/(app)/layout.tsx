import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Dua query dijalankan paralel agar navigasi antarhalaman lebih cepat.
  const [unread, tesis] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
    // Jalur bimbingan mahasiswa (TESIS/ARTIKEL) menentukan label menu.
    user.role === "MAHASISWA"
      ? prisma.tesis.findUnique({
          where: { mahasiswaId: user.id },
          select: { track: true },
        })
      : Promise.resolve(null),
  ]);
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden">
        <Header
          name={user.name}
          nimNip={user.nimNip}
          role={user.role}
          unreadCount={unread}
        />
      </div>
      <div className="flex">
        <div className="print:hidden">
          <Sidebar role={user.role} mahasiswaTrack={tesis?.track ?? null} />
        </div>
        <main className="flex-1 px-4 lg:px-6 py-6 max-w-screen-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
