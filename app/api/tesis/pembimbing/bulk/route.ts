import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const Body = z.object({
  csv: z.string().min(1).max(500_000),
});

type RowResult = {
  nim: string;
  nama: string;
  status: "ok" | "dilewati" | "error";
  message: string;
};

// Parser CSV sederhana: dukung pemisah ; atau , dan kolom dalam tanda kutip.
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delim =
    (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n") {
      row.push(cur);
      cur = "";
      rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Bulk assign Pembimbing 1 & 2 dari file CSV (Kaprodi/Admin).
 * Dosen dapat diisi dengan NIP/NIDN atau nama persis seperti di database.
 * Catatan: bulk upload TIDAK menerbitkan SK otomatis; SK dapat diterbitkan
 * per mahasiswa lewat tombol Tetapkan Pembimbing di halaman pembimbing.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Body tidak valid";
    return NextResponse.json({ message: msg }, { status: 400 });
  }

  const rows = parseCsv(parsed.csv);
  if (rows.length < 2)
    return NextResponse.json(
      { message: "File CSV kosong atau hanya berisi header" },
      { status: 400 },
    );
  const dataRows = rows.slice(1);
  if (dataRows.length > 500)
    return NextResponse.json(
      { message: "Maksimal 500 baris per upload" },
      { status: 400 },
    );

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  const kaprodiProdiId = session.role === "KAPRODI" ? me?.prodiId : null;

  const dosenList = await prisma.user.findMany({
    where: { role: { in: ["DOSEN", "KAPRODI"] }, isActive: true },
    select: { id: true, name: true, nimNip: true },
  });
  const norm = (s: string) => s.trim().toLowerCase();
  const findDosen = (key: string) => {
    const k = norm(key);
    if (!k) return null;
    return (
      dosenList.find((d) => norm(d.nimNip) === k) ??
      dosenList.find((d) => norm(d.name) === k) ??
      null
    );
  };

  const results: RowResult[] = [];
  let updated = 0;

  for (const r of dataRows) {
    const nim = (r[0] ?? "").trim();
    const namaCsv = (r[1] ?? "").trim();
    const p1Key = (r[2] ?? "").trim();
    const p2Key = (r[3] ?? "").trim();

    if (!nim) {
      results.push({
        nim: "-",
        nama: namaCsv,
        status: "error",
        message: "Kolom NIM kosong",
      });
      continue;
    }
    if (!p1Key && !p2Key) {
      results.push({
        nim,
        nama: namaCsv,
        status: "dilewati",
        message: "Pembimbing tidak diisi",
      });
      continue;
    }

    const mhs = await prisma.user.findUnique({
      where: { nimNip: nim },
      select: { id: true, name: true, prodiId: true, role: true },
    });
    if (!mhs || mhs.role !== "MAHASISWA") {
      results.push({
        nim,
        nama: namaCsv,
        status: "error",
        message: "Mahasiswa dengan NIM ini tidak ditemukan",
      });
      continue;
    }
    if (kaprodiProdiId && mhs.prodiId && mhs.prodiId !== kaprodiProdiId) {
      results.push({
        nim,
        nama: mhs.name,
        status: "error",
        message: "Bukan mahasiswa prodi Anda",
      });
      continue;
    }

    const tesis = await prisma.tesis.findUnique({
      where: { mahasiswaId: mhs.id },
      select: {
        id: true,
        stage: true,
        pembimbing1Id: true,
        pembimbing2Id: true,
      },
    });
    if (!tesis) {
      results.push({
        nim,
        nama: mhs.name,
        status: "error",
        message: "Data tesis mahasiswa belum ada",
      });
      continue;
    }

    const p1 = p1Key ? findDosen(p1Key) : null;
    if (p1Key && !p1) {
      results.push({
        nim,
        nama: mhs.name,
        status: "error",
        message: `Dosen "${p1Key}" tidak ditemukan (isi NIP atau nama persis)`,
      });
      continue;
    }
    const p2 = p2Key ? findDosen(p2Key) : null;
    if (p2Key && !p2) {
      results.push({
        nim,
        nama: mhs.name,
        status: "error",
        message: `Dosen "${p2Key}" tidak ditemukan (isi NIP atau nama persis)`,
      });
      continue;
    }
    if (!p1) {
      results.push({
        nim,
        nama: mhs.name,
        status: "error",
        message: "Pembimbing 1 wajib diisi",
      });
      continue;
    }
    if (p2 && p2.id === p1.id) {
      results.push({
        nim,
        nama: mhs.name,
        status: "error",
        message: "Pembimbing 1 dan 2 tidak boleh sama",
      });
      continue;
    }

    if (
      tesis.pembimbing1Id === p1.id &&
      (tesis.pembimbing2Id ?? null) === (p2?.id ?? null)
    ) {
      results.push({
        nim,
        nama: mhs.name,
        status: "dilewati",
        message: "Tidak ada perubahan",
      });
      continue;
    }

    await prisma.tesis.update({
      where: { id: tesis.id },
      data: {
        pembimbing1Id: p1.id,
        pembimbing2Id: p2?.id ?? null,
        ...(tesis.stage === "JUDUL" ? { stage: "PROPOSAL" as const } : {}),
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: mhs.id,
          title: "Pembimbing Ditetapkan",
          body: `Pembimbing tesis Anda telah ditetapkan. Pembimbing 1: ${p1.name}${p2 ? `, Pembimbing 2: ${p2.name}` : ""}.`,
          link: "/tesis",
        },
        {
          userId: p1.id,
          title: "Penugasan Pembimbing 1",
          body: `Anda ditetapkan sebagai Pembimbing 1 untuk ${mhs.name} (${nim}).`,
          link: "/dashboard",
        },
        ...(p2
          ? [
              {
                userId: p2.id,
                title: "Penugasan Pembimbing 2",
                body: `Anda ditetapkan sebagai Pembimbing 2 untuk ${mhs.name} (${nim}).`,
                link: "/dashboard",
              },
            ]
          : []),
      ],
    });

    updated++;
    results.push({
      nim,
      nama: mhs.name,
      status: "ok",
      message: `Pembimbing 1: ${p1.name}${p2 ? `, Pembimbing 2: ${p2.name}` : ""}`,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: "TESIS_PEMBIMBING_BULK_ASSIGN",
      entity: "Tesis",
      metadata: { updated, total: dataRows.length },
    },
  });

  return NextResponse.json({ ok: true, updated, results });
}
