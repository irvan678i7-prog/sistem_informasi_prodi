import { prisma } from "@/lib/prisma";

// Satu baris input dari file bulk upload PA & pembimbing.
export type BulkRowInput = {
  nim: string;
  nama: string;
  pa: string;
  p1: string;
  p2: string;
};

// Hasil validasi satu baris (dipakai untuk preview maupun penyimpanan).
export type BulkRowCheck = {
  nim: string;
  nama: string;
  pa: string;
  p1: string;
  p2: string;
  paNama: string | null;
  p1Nama: string | null;
  p2Nama: string | null;
  status: "ok" | "dilewati" | "error";
  message: string;
  tesisId?: string;
  tesisStage?: string;
  mahasiswaId?: string;
  paId?: string | null;
  p1Id?: string | null;
  p2Id?: string | null;
};

// Parser CSV sederhana: dukung pemisah ; atau , dan kolom dalam tanda kutip.
// Dipertahankan sebagai fallback jika user tetap meng-upload CSV.
export function parseCsv(text: string): string[][] {
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

// Ubah tabel mentah (termasuk header di baris pertama) menjadi baris input.
// Urutan kolom: NIM | Nama | PA | Pembimbing 1 | Pembimbing 2.
export function rowsFromTable(table: string[][]): BulkRowInput[] {
  return table
    .slice(1)
    .map((r) => ({
      nim: (r[0] ?? "").trim(),
      nama: (r[1] ?? "").trim(),
      pa: (r[2] ?? "").trim(),
      p1: (r[3] ?? "").trim(),
      p2: (r[4] ?? "").trim(),
    }))
    .filter(
      (r) =>
        r.nim !== "" ||
        r.nama !== "" ||
        r.pa !== "" ||
        r.p1 !== "" ||
        r.p2 !== "",
    );
}

/**
 * Validasi seluruh baris TANPA menyimpan apa pun ke database.
 * Dipakai oleh endpoint preview dan (ulang) oleh endpoint simpan.
 * Kolom kosong berarti tidak diubah, kecuali Pembimbing 2 yang ikut
 * dikosongkan saat Pembimbing 1 diisi.
 */
export async function checkBulkRows(
  rows: BulkRowInput[],
  kaprodiProdiId: string | null,
): Promise<BulkRowCheck[]> {
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

  const out: BulkRowCheck[] = [];
  for (const r of rows) {
    const base = {
      nim: r.nim || "-",
      nama: r.nama,
      pa: r.pa,
      p1: r.p1,
      p2: r.p2,
      paNama: null as string | null,
      p1Nama: null as string | null,
      p2Nama: null as string | null,
    };
    if (!r.nim) {
      out.push({ ...base, status: "error", message: "Kolom NIM kosong" });
      continue;
    }
    if (!r.pa && !r.p1 && !r.p2) {
      out.push({
        ...base,
        status: "dilewati",
        message: "PA dan pembimbing tidak diisi",
      });
      continue;
    }

    const mhs = await prisma.user.findUnique({
      where: { nimNip: r.nim },
      select: { id: true, name: true, prodiId: true, role: true },
    });
    if (!mhs || mhs.role !== "MAHASISWA") {
      out.push({
        ...base,
        status: "error",
        message: "Mahasiswa dengan NIM ini tidak ditemukan",
      });
      continue;
    }
    base.nama = mhs.name;
    if (kaprodiProdiId && mhs.prodiId && mhs.prodiId !== kaprodiProdiId) {
      out.push({
        ...base,
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
        paId: true,
        pembimbing1Id: true,
        pembimbing2Id: true,
      },
    });
    if (!tesis) {
      out.push({
        ...base,
        status: "error",
        message: "Data tesis mahasiswa belum ada",
      });
      continue;
    }

    const pa = r.pa ? findDosen(r.pa) : null;
    if (r.pa && !pa) {
      out.push({
        ...base,
        status: "error",
        message: `Dosen PA "${r.pa}" tidak ditemukan (isi NIP atau nama persis)`,
      });
      continue;
    }
    const p1 = r.p1 ? findDosen(r.p1) : null;
    if (r.p1 && !p1) {
      out.push({
        ...base,
        status: "error",
        message: `Dosen "${r.p1}" tidak ditemukan (isi NIP atau nama persis)`,
      });
      continue;
    }
    const p2 = r.p2 ? findDosen(r.p2) : null;
    if (r.p2 && !p2) {
      out.push({
        ...base,
        status: "error",
        message: `Dosen "${r.p2}" tidak ditemukan (isi NIP atau nama persis)`,
      });
      continue;
    }
    if (r.p2 && !r.p1) {
      out.push({
        ...base,
        status: "error",
        message: "Pembimbing 1 wajib diisi jika Pembimbing 2 diisi",
      });
      continue;
    }
    if (p1 && p2 && p2.id === p1.id) {
      out.push({
        ...base,
        status: "error",
        message: "Pembimbing 1 dan 2 tidak boleh sama",
      });
      continue;
    }

    base.paNama = pa?.name ?? null;
    base.p1Nama = p1?.name ?? null;
    base.p2Nama = p2?.name ?? null;

    const changePa = !!pa && pa.id !== (tesis.paId ?? null);
    const changePembimbing =
      !!p1 &&
      (p1.id !== tesis.pembimbing1Id ||
        (p2?.id ?? null) !== (tesis.pembimbing2Id ?? null));

    if (!changePa && !changePembimbing) {
      out.push({
        ...base,
        status: "dilewati",
        message: "Tidak ada perubahan",
      });
      continue;
    }

    const parts: string[] = [];
    if (pa) parts.push(`PA: ${pa.name}`);
    if (p1) parts.push(`Pembimbing 1: ${p1.name}`);
    if (p2) parts.push(`Pembimbing 2: ${p2.name}`);

    out.push({
      ...base,
      status: "ok",
      message: parts.join(", "),
      tesisId: tesis.id,
      tesisStage: tesis.stage,
      mahasiswaId: mhs.id,
      paId: changePa ? pa!.id : null,
      p1Id: changePembimbing ? p1!.id : null,
      p2Id: changePembimbing ? (p2?.id ?? null) : null,
    });
  }
  return out;
}

// Bentuk aman untuk dikirim ke client (tanpa id internal).
export function toClientRow(c: BulkRowCheck) {
  return {
    nim: c.nim,
    nama: c.nama,
    pa: c.pa,
    p1: c.p1,
    p2: c.p2,
    paNama: c.paNama,
    p1Nama: c.p1Nama,
    p2Nama: c.p2Nama,
    status: c.status,
    message: c.message,
  };
}
