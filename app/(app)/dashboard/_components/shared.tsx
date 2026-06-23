// Shared building blocks for the role-based dashboards.
//
// These are intentionally small and presentational so each role's dashboard
// can compose them, and so later features (upload flow, bimbingan, title
// submission) can reuse the same look without re-implementing the layout.

import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { ROLE_LABEL } from "@/lib/rbac";
import type { Role } from "@prisma/client";

export function DashboardHero({
  name,
  role,
  prodiName,
  nimNip,
}: {
  name: string;
  role: Role;
  prodiName?: string | null;
  nimNip: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-6 shadow-sm">
      <div
        aria-hidden
        className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-xl"
      />
      <div
        aria-hidden
        className="absolute -right-2 -bottom-10 w-36 h-36 rounded-full bg-white/10 blur-2xl"
      />
      <div className="relative flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-um-metro.png"
          alt="UM Metro"
          className="w-14 h-14 object-contain bg-white/10 rounded-lg p-1"
        />
        <div>
          <h1 className="text-2xl font-bold">Halo, {name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-white/85">
            {ROLE_LABEL[role]}
            {prodiName ? ` · ${prodiName}` : ""} · NIM/NIDN {nimNip}
          </p>
        </div>
      </div>
    </div>
  );
}

// A compact metric tile. Renders as a link when `href` is provided.
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900 truncate">
          {value}
        </p>
        {hint && <p className="text-xs text-slate-400 truncate">{hint}</p>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
      >
        {inner}
      </Link>
    );
  }

  return <div className="card p-4 flex items-center gap-3">{inner}</div>;
}

// A titled card with an optional header action (e.g. a "view all" link).
export function SectionCard({
  title,
  description,
  action,
  children,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <Card>
      <div className="card-header">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          {action}
        </div>
      </div>
      <CardBody className={bodyClassName}>{children}</CardBody>
    </Card>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 py-6 text-sm text-slate-500 text-center">{children}</p>
  );
}
