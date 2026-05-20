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
  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        name={user.name}
        nimNip={user.nimNip}
        role={user.role}
        unreadCount={unread}
      />
      <div className="flex">
        <Sidebar role={user.role} />
        <main className="flex-1 px-4 lg:px-6 py-6 max-w-screen-2xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
