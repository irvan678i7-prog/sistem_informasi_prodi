import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TesisStage } from "@prisma/client";

const STAGES: { key: TesisStage; label: string }[] = [
  { key: "JUDUL", label: "Judul" },
  { key: "PROPOSAL", label: "Proposal" },
  { key: "SEMINAR_PROPOSAL", label: "Seminar" },
  { key: "BIMBINGAN", label: "Bimbingan" },
  { key: "KUT", label: "KUT" },
  { key: "SIDANG", label: "Sidang" },
  { key: "REVISI", label: "Revisi" },
  { key: "SELESAI", label: "Selesai" },
];

// Stepper perjalanan tesis mahasiswa: tahap lampau tercentang, tahap aktif
// disorot, tahap berikutnya redup. Bisa di-scroll horizontal di layar kecil.
export function StageStepper({ current }: { current: TesisStage }) {
  const idx = STAGES.findIndex((s) => s.key === current);

  return (
    <div className="overflow-x-auto pb-8 -mb-4">
      <ol className="flex items-center min-w-max px-1 pt-1">
        {STAGES.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <Fragment key={s.key}>
              <li className="relative flex flex-col items-center">
                <span
                  className={cn(
                    "w-8 h-8 rounded-full grid place-items-center text-xs font-semibold shrink-0 transition-colors",
                    done && "bg-brand-600 text-white",
                    active && "bg-brand-600 text-white ring-4 ring-brand-100",
                    !done && !active && "bg-slate-100 text-slate-400",
                  )}
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "absolute top-10 w-16 text-center text-[11px] leading-tight",
                    active
                      ? "text-brand-700 font-semibold"
                      : done
                        ? "text-slate-600"
                        : "text-slate-400",
                  )}
                >
                  {s.label}
                </span>
              </li>
              {i < STAGES.length - 1 && (
                <span
                  className={cn(
                    "h-0.5 w-10 sm:w-14 rounded-full shrink-0",
                    i < idx ? "bg-brand-500" : "bg-slate-200",
                  )}
                />
              )}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
