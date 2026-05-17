"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  GraduationCap,
  Users,
  Building2,
  ClipboardList,
  ShieldCheck,
  Bell,
  Cog,
  FileText,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/surat",
    label: "Persuratan",
    icon: Mail,
    roles: ["MAHASISWA", "DOSEN", "KAPRODI", "WAKIL_DIREKTUR", "DIREKTUR"],
  },
  {
    href: "/tesis",
    label: "Tesis",
    icon: GraduationCap,
    roles: ["MAHASISWA", "DOSEN", "KAPRODI", "WAKIL_DIREKTUR", "DIREKTUR"],
  },
  {
    href: "/bimbingan",
    label: "Bimbingan",
    icon: ClipboardList,
    roles: ["DOSEN", "KAPRODI", "WAKIL_DIREKTUR", "DIREKTUR", "MAHASISWA"],
  },
  {
    href: "/notifikasi",
    label: "Notifikasi",
    icon: Bell,
  },
  {
    href: "/tesis/sk-pembimbing",
    label: "SK Pembimbing",
    icon: FileText,
    roles: ["KAPRODI", "WAKIL_DIREKTUR", "DIREKTUR"],
  },
  {
    href: "/admin/users",
    label: "Kelola User",
    icon: Users,
    roles: ["ADMIN_SISTEM", "ADMIN_PRODI"],
  },
  {
    href: "/admin/prodi",
    label: "Kelola Prodi",
    icon: Building2,
    roles: ["ADMIN_SISTEM"],
  },
  {
    href: "/admin/master",
    label: "Master Data",
    icon: Cog,
    roles: ["ADMIN_SISTEM"],
  },
  {
    href: "/admin/audit",
    label: "Audit Log",
    icon: ShieldCheck,
    roles: ["ADMIN_SISTEM", "ADMIN_PRODI"],
  },
];

export function Sidebar({
  role,
  unreadCount = 0,
}: {
  role: Role;
  unreadCount?: number;
}) {
  const pathname = usePathname() ?? "";
  const items = NAV.filter((n) => !n.roles || n.roles.includes(role));

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-56px)] sticky top-14">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-4 px-2">
          <School className="text-brand-700" />
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-tight">
              SIPRO
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              PPs UM Metro
            </p>
          </div>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/notifikasi" && unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 grid place-items-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-slate-200">
          <Link
            href="/help"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <FileText className="w-4 h-4" /> Panduan
          </Link>
        </div>
      </div>
    </aside>
  );
}
