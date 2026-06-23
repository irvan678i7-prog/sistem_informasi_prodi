import type { RequestStatus, SidangResult, TesisStage } from "@prisma/client";

const STATUS_LABEL: Record<RequestStatus, { label: string; cls: string }> = {
  DRAFT:     { label: "Draft",          cls: "badge-gray" },
  SUBMITTED: { label: "Diajukan",       cls: "badge-blue" },
  VERIFIED:  { label: "Diverifikasi",   cls: "badge-purple" },
  APPROVED:  { label: "Disetujui",      cls: "badge-green" },
  REJECTED:  { label: "Ditolak",        cls: "badge-red" },
  COMPLETED: { label: "Selesai",        cls: "badge-green" },
};

const SIDANG_LABEL: Record<SidangResult, { label: string; cls: string }> = {
  BELUM:               { label: "Belum",         cls: "badge-gray" },
  LULUS:               { label: "Lulus",         cls: "badge-green" },
  LULUS_DENGAN_REVISI: { label: "Lulus + Revisi", cls: "badge-yellow" },
  TIDAK_LULUS:         { label: "Tidak Lulus",   cls: "badge-red" },
};

const STAGE_LABEL: Record<TesisStage, string> = {
  JUDUL: "Pengajuan Judul",
  PROPOSAL: "Penyusunan Proposal",
  SEMINAR_PROPOSAL: "Seminar Proposal",
  BIMBINGAN: "Bimbingan Tesis",
  KUT: "Kelayakan Ujian",
  SIDANG: "Sidang Ujian Tesis",
  REVISI: "Revisi",
  SELESAI: "Selesai",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const s = STATUS_LABEL[status];
  return <span className={s.cls}>{s.label}</span>;
}

export function SidangBadge({ result }: { result: SidangResult }) {
  const s = SIDANG_LABEL[result];
  return <span className={s.cls}>{s.label}</span>;
}

export function StageBadge({ stage }: { stage: TesisStage }) {
  return <span className="badge-blue">{STAGE_LABEL[stage]}</span>;
}

// Status khusus alur pengajuan judul. Berbeda dari StatusBadge umum: judul yang
// sudah disetujui ditampilkan biru (bukan hijau) sesuai ketentuan alur judul.
const JUDUL_STATUS_LABEL: Record<RequestStatus, { label: string; cls: string }> =
  {
    DRAFT: { label: "Perlu Revisi", cls: "badge-yellow" },
    SUBMITTED: { label: "Menunggu PA", cls: "badge-blue" },
    VERIFIED: { label: "Disetujui PA", cls: "badge-purple" },
    APPROVED: { label: "Disetujui", cls: "badge-blue" },
    REJECTED: { label: "Ditolak", cls: "badge-red" },
    COMPLETED: { label: "Selesai", cls: "badge-blue" },
  };

export function JudulStatusBadge({ status }: { status: RequestStatus }) {
  const s = JUDUL_STATUS_LABEL[status];
  return <span className={s.cls}>{s.label}</span>;
}
