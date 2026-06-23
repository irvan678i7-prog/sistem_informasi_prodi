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
