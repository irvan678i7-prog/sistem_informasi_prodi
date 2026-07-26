// Title-submission (pengajuan judul) helpers.
//
// Comments/revision notes on a judul reuse the existing RequestTimeline model
// (note + actorId) so no schema/migration change is needed — PostgreSQL/Prisma
// and Supabase storage stay exactly as they are. This module centralises the
// timeline stages that belong to the judul flow and resolves the commenter's
// account name for display.

import { prisma } from "./prisma";
import { ROLE_LABEL } from "./rbac";
import type { Role } from "@prisma/client";

// Timeline `stage` values that make up the judul conversation/audit trail.
export const JUDUL_TIMELINE_STAGES = [
  "JUDUL_SUBMITTED",
  "JUDUL_RESUBMITTED",
  "JUDUL_PA_APPROVED",
  "JUDUL_FINALIZED",
  "JUDUL_REJECTED",
  "JUDUL_REVISION_REQUESTED",
  "JUDUL_COMMENT",
] as const;

export type JudulComment = {
  id: string;
  stage: string;
  note: string;
  createdAt: Date;
  authorName: string;
  authorRole: Role | null;
};

// Load the judul timeline for a tesis, newest first, with the commenter's
// account name resolved. Only entries that carry a note are returned so the
// thread shows actual comments/decisions rather than empty stage markers.
export async function getJudulComments(tesisId: string): Promise<JudulComment[]> {
  const entries = await prisma.requestTimeline.findMany({
    where: {
      tesisId,
      stage: { in: [...JUDUL_TIMELINE_STAGES] },
      note: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  const actorIds = Array.from(
    new Set(entries.map((e) => e.actorId).filter((v): v is string => !!v)),
  );
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, role: true },
      })
    : [];
  const byId = new Map(actors.map((a) => [a.id, a]));

  return entries.map((e) => {
    const actor = e.actorId ? byId.get(e.actorId) : undefined;
    return {
      id: e.id,
      stage: e.stage,
      note: e.note ?? "",
      createdAt: e.createdAt,
      authorName: actor?.name ?? "Sistem",
      authorRole: actor?.role ?? null,
    };
  });
}

// Versi BATCH: ambil komentar untuk BANYAK tesis sekaligus dalam 2 query total
// (timeline + user), lalu kelompokkan di memori. Menggantikan pemanggilan
// getJudulComments() di dalam loop pada halaman antrian judul, yang menghasilkan
// 2×N query terpisah (berat di Supabase pooler dengan connection_limit=1).
export async function getJudulCommentsBatch(
  tesisIds: string[],
): Promise<Map<string, JudulComment[]>> {
  const result = new Map<string, JudulComment[]>();
  for (const id of tesisIds) result.set(id, []);
  if (tesisIds.length === 0) return result;

  const entries = await prisma.requestTimeline.findMany({
    where: {
      tesisId: { in: tesisIds },
      stage: { in: [...JUDUL_TIMELINE_STAGES] },
      note: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  const actorIds = Array.from(
    new Set(entries.map((e) => e.actorId).filter((v): v is string => !!v)),
  );
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, role: true },
      })
    : [];
  const byId = new Map(actors.map((a) => [a.id, a]));

  for (const e of entries) {
    if (!e.tesisId) continue;
    const actor = e.actorId ? byId.get(e.actorId) : undefined;
    const list = result.get(e.tesisId);
    if (!list) continue;
    list.push({
      id: e.id,
      stage: e.stage,
      note: e.note ?? "",
      createdAt: e.createdAt,
      authorName: actor?.name ?? "Sistem",
      authorRole: actor?.role ?? null,
    });
  }
  return result;
}

export function judulStageLabel(stage: string, role: Role | null): string {
  switch (stage) {
    case "JUDUL_SUBMITTED":
      return "Pengajuan judul";
    case "JUDUL_RESUBMITTED":
      return "Pengajuan ulang";
    case "JUDUL_PA_APPROVED":
      return "Disetujui PA";
    case "JUDUL_FINALIZED":
      return "Difinalisasi Kaprodi";
    case "JUDUL_REJECTED":
      return "Ditolak";
    case "JUDUL_REVISION_REQUESTED":
      return "Permintaan revisi";
    case "JUDUL_COMMENT":
      return "Komentar";
    default:
      return role ? ROLE_LABEL[role] : "Aktivitas";
  }
}
