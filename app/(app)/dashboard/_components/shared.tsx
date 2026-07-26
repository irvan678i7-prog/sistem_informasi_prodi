// Shared building blocks for the role-based dashboards.
//
// Presentational only, composed by each role's dashboard. New optional props
// (accent, right, ...) are additive so existing call sites keep working.

import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { ROLE_LABEL } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import type { Role } from "@prisma/client";

export type Accent =
  | "brand"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "sky"
  | "slate";

const ACCENT_CHIP: Record<Accent, string> = {
  brand: "bg-brand-50 text-brand-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
  slate: "bg-slate-100 text-slate-700",
};

export function DashboardHero({
  name,
  role,
  prodiName,
  nimNip,
  right,
}: {
  name: string;
  role: Role;
  prodiName?: string | null;
  nimNip: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 text-white p-6 shadow-sm">
      {/* Ornamen lingkaran halus */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -right-4 top-16 h-32 w-32 rounded-full bg-white/5" />
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-um-metro.png"
            alt="UM Metro"
            className="w-14 h-14 object-contain bg-white rounded-xl p-1.5 shadow-sm"
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70">
              {formatDate(new Date())}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-balance leading-tight">
              Selamat datang, {name}
            </h1>
            <p className="text-sm text-white/80 mt-0.5">
              <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
                {ROLE_LABEL[role]}
              </span>
              {prodiName ? <span className="ml-2">{prodiName}</span> : null}
              <span className="ml-2 text-white/60">· {nimNip}</span>
            </p>
          </div>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}

// A compact metric tile with a colored icon chip. Renders as a link when `href`
// is provided. `accent` tints the icon chip; defaults to brand.
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  accent = "brand",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  accent?: Accent;
}) {
  const inner = (
    <>
      <div
        className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${ACCENT_CHIP[accent]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 truncate leading-tight">
          {value}
        </p>
        {hint && <p className="text-xs text-slate-400 truncate">{hint}</p>}
      </div>
    </>
  );

  const base = "card p-4 flex items-center gap-3 transition-all hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={`${base} hover:-translate-y-0.5`}>
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
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
