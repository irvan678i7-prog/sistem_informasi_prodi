"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  GraduationCap,
  Users,
  Building2,
  ShieldCheck,
  Cog,
  FileText,
  BookOpen,
  ClipboardList,
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
    roles: ["MAHASISWA", "DOSEN", "KAPRODI"],
  },
  {
    href: "/tesis",
    label: "Tesis",
    icon: GraduationCap,
    roles: ["MAHASISWA", "DOSEN", "KAPRODI"],
  },
  // Menu kartu bimbingan mahasiswa: labelnya mengikuti jalur yang dipilih
  // saat mengajukan judul (Bimbingan Tesis atau Bimbingan Artikel).
  {
    href: "/tesis/bimbingan-artikel",
    label: "Bimbingan Tesis",
    icon: BookOpen,
    roles: ["MAHASISWA"],
  },
  // Check list berkas syarat + form upload untuk mendaftar Seminar Proposal.
  {
    href: "/tesis/seminar-proposal",
    label: "Seminar Proposal",
    icon: ClipboardList,
    roles: ["MAHASISWA"],
  },
  {
    href: "/bimbingan/artikel",
    label: "Kartu Bimbingan",
    icon: BookOpen,
    roles: ["DOSEN", "KAPRODI"],
  },
  {
    href: "/tesis/pembimbing",
    label: "Atur Pembimbing",
    icon: Users,
    roles: ["KAPRODI"],
  },
  {
    href: "/tesis/sk-pembimbing",
    label: "SK Pembimbing",
    icon: FileText,
    roles: ["KAPRODI"],
  },
  {
    href: "/admin/users",
    label: "Kelola User",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/prodi",
    label: "Kelola Prodi",
    icon: Building2,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/master",
    label: "Master Data",
    icon: Cog,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/audit",
    label: "Audit Log",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
];

export function Sidebar({
  role,
  mahasiswaTrack,
}: {
  role: Role;
  mahasiswaTrack?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const items = NAV.filter((n) => !n.roles || n.roles.includes(role)).map(
    (n) => {
      // Label kartu bimbingan mahasiswa mengikuti jalur pilihan (tesis/artikel).
      if (n.href === "/tesis/bimbingan-artikel" && mahasiswaTrack === "ARTIKEL")
        return { ...n, label: "Bimbingan Artikel" };
      return n;
    },
  );

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-56px)] sticky top-14">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5 mb-5 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-um-metro.png"
            alt="UM Metro"
            className="w-9 h-9 object-contain"
          />
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
