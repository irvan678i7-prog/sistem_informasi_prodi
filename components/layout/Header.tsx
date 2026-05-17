"use client";

import Link from "next/link";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import type { Role } from "@prisma/client";
import { ROLE_LABEL } from "@/lib/rbac";

export function Header({
  name,
  nimNip,
  role,
  unreadCount = 0,
}: {
  name: string;
  nimNip: string;
  role: Role;
  unreadCount?: number;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-14">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand-600 text-white grid place-items-center font-bold">
            S
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              Sistem Informasi Prodi
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Program Pascasarjana UM Metro
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <p className="text-sm font-medium text-slate-900">{name}</p>
            <p className="text-[11px] text-slate-500">
              {ROLE_LABEL[role]} · {nimNip}
            </p>
          </div>
          <Link
            href="/notifikasi"
            className="relative w-9 h-9 rounded-full bg-slate-100 text-slate-700 grid place-items-center hover:bg-slate-200"
            aria-label="Notifikasi"
            title="Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 grid place-items-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 grid place-items-center">
            <UserIcon className="w-4 h-4" />
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="btn-ghost"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
