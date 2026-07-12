// Dashboard data layer — per-role aggregation helpers.
//
// Each role's dashboard reads only the data it needs through one of the
// functions below. Keeping the queries here (instead of inline in the page)
// gives later work on title submission, bimbingan, and the upload flow a
// single place to extend the dashboard's data without touching the views.

import type { Prisma, TesisStage } from "@prisma/client";
import { prisma } from "./prisma";

export type StageCount = { stage: TesisStage; count: number };

// Stage order used to render progress summaries consistently.
export const TESIS_STAGES: TesisStage[] = [
  "JUDUL",
  "PROPOSAL",
  "SEMINAR_PROPOSAL",
  "BIMBINGAN",
  "KUT",
  "SIDANG",
  "REVISI",
  "SELESAI",
];

function emptyStageCounts(): StageCount[] {
  return TESIS_STAGES.map((stage) => ({ stage, count: 0 }));
}

// Turn Prisma's groupBy result into a dense, ordered list covering every stage.
function toStageCounts(
  grouped: { stage: TesisStage; _count: { _all: number } }[],
): StageCount[] {
  const map = new Map(grouped.map((g) => [g.stage, g._count._all]));
  return TESIS_STAGES.map((stage) => ({
    stage,
    count: map.get(stage) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Mahasiswa
// ---------------------------------------------------------------------------

export async function getMahasiswaDashboard(userId: string) {
  const [tesis, unreadNotif, letterCount] = await Promise.all([
    prisma.tesis.findUnique({
      where: { mahasiswaId: userId },
      include: {
        pembimbing1: true,
        pembimbing2: true,
        pa: true,
        sidang: true,
        kut: true,
        seminars: { orderBy: { createdAt: "desc" }, take: 1 },
        bimbinganLogs: { orderBy: { tanggal: "desc" }, take: 1 },
        attachments: { orderBy: { createdAt: "desc" }, take: 5 },
        timeline: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.letterRequest.count({ where: { mahasiswaId: userId } }),
  ]);

  const pendingBimbingan = tesis
    ? await prisma.bimbinganLog.count({
        where: { tesisId: tesis.id, approved: false },
      })
    : 0;

  return { tesis, unreadNotif, letterCount, pendingBimbingan };
}

export type MahasiswaDashboardData = Awaited<
  ReturnType<typeof getMahasiswaDashboard>
>;

// ---------------------------------------------------------------------------
// Dosen
// ---------------------------------------------------------------------------

export async function getDosenDashboard(userId: string) {
  // A dosen "membimbing" a thesis when they are listed as PA or as either
  // pembimbing on it. We count distinct theses across those roles.
  const bimbinganWhere: Prisma.TesisWhereInput = {
    OR: [
      { paId: userId },
      { pembimbing1Id: userId },
      { pembimbing2Id: userId },
    ],
  };

  const [bimbinganCount, stageGrouped, pendingParaf, recentTheses] =
    await Promise.all([
      prisma.tesis.count({ where: bimbinganWhere }),
      prisma.tesis.groupBy({
        by: ["stage"],
        where: bimbinganWhere,
        _count: { _all: true },
      }),
      prisma.bimbinganLog.count({
        where: { dosenId: userId, approved: false },
      }),
      prisma.tesis.findMany({
        where: bimbinganWhere,
        include: { mahasiswa: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

  const stageCounts = bimbinganCount
    ? toStageCounts(stageGrouped)
    : emptyStageCounts();

  return { bimbinganCount, stageCounts, pendingParaf, recentTheses };
}

export type DosenDashboardData = Awaited<ReturnType<typeof getDosenDashboard>>;

// ---------------------------------------------------------------------------
// Kaprodi
// ---------------------------------------------------------------------------

export async function getKaprodiDashboard(prodiId: string | null) {
  // Scope everything to the kaprodi's prodi. Theses are scoped through the
  // owning mahasiswa's prodi.
  const tesisWhere: Prisma.TesisWhereInput = prodiId
    ? { mahasiswa: { prodiId } }
    : {};
  const userWhere = (role: "DOSEN" | "MAHASISWA"): Prisma.UserWhereInput =>
    prodiId ? { role, prodiId } : { role };

  const [dosenCount, mahasiswaCount, tesisTotal, stageGrouped, recentTheses] =
    await Promise.all([
      prisma.user.count({ where: userWhere("DOSEN") }),
      prisma.user.count({ where: userWhere("MAHASISWA") }),
      prisma.tesis.count({ where: tesisWhere }),
      prisma.tesis.groupBy({
        by: ["stage"],
        where: tesisWhere,
        _count: { _all: true },
      }),
      prisma.tesis.findMany({
        where: tesisWhere,
        include: {
          mahasiswa: true,
          pembimbing1: { select: { name: true } },
          pembimbing2: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

  return {
    dosenCount,
    mahasiswaCount,
    tesisTotal,
    stageCounts: toStageCounts(stageGrouped),
    recentTheses,
  };
}

export type KaprodiDashboardData = Awaited<
  ReturnType<typeof getKaprodiDashboard>
>;
