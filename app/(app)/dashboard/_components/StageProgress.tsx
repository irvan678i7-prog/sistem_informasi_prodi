// Ringkasan progres tesis: a per-stage breakdown shown to dosen and kaprodi.
//
// Renders one row per TesisStage with a proportional bar, so the chair/lecturer
// can see at a glance where their students sit in the thesis workflow.

import type { StageCount } from "@/lib/dashboard";

const STAGE_LABEL: Record<string, string> = {
  JUDUL: "Pengajuan Judul",
  PROPOSAL: "Penyusunan Proposal",
  SEMINAR_PROPOSAL: "Seminar Proposal",
  BIMBINGAN: "Bimbingan",
  KUT: "Kelayakan Ujian",
  SIDANG: "Sidang",
  REVISI: "Revisi",
  SELESAI: "Selesai",
};

export function StageProgress({ counts }: { counts: StageCount[] }) {
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  if (total === 0) {
    return (
      <p className="px-1 py-6 text-sm text-slate-500 text-center">
        Belum ada data tesis untuk diringkas.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {counts.map(({ stage, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <li key={stage} className="text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-700">{STAGE_LABEL[stage]}</span>
              <span className="text-slate-500 tabular-nums">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
