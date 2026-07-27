import { NextResponse } from "next/server";
import * as ExcelJS from "exceljs";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_COLS = 12;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function tableFromCsv(text: string): string[][] {
  return text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => splitCsvLine(l).map((c) => c.trim()));
}

async function tableFromXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  const table: string[][] = [];
  if (!ws) return table;
  ws.eachRow((row) => {
    const cells: string[] = [];
    for (let c = 1; c <= MAX_COLS; c++) {
      cells.push(String(row.getCell(c).text ?? "").trim());
    }
    // buang kolom kosong di ekor
    while (cells.length && cells[cells.length - 1] === "") cells.pop();
    table.push(cells);
  });
  return table;
}

// Parse file Excel/CSV bulk mahasiswa menjadi { headers, rows } — TANPA
// menyimpan. Baris pertama = header (kunci: nim, name, email, prodiCode, dst).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Upload tidak valid" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ message: "File belum dipilih" }, { status: 400 });
  if (file.size > 5_000_000)
    return NextResponse.json(
      { message: "Ukuran file maksimal 5 MB" },
      { status: 400 },
    );

  const name = (file.name || "").toLowerCase();
  let table: string[][];
  try {
    if (name.endsWith(".xlsx")) table = await tableFromXlsx(await file.arrayBuffer());
    else if (name.endsWith(".csv")) table = tableFromCsv(await file.text());
    else
      return NextResponse.json(
        { message: "Format file harus .xlsx (Excel) atau .csv" },
        { status: 400 },
      );
  } catch {
    return NextResponse.json(
      { message: "Gagal membaca file. Pastikan file tidak rusak." },
      { status: 400 },
    );
  }

  const nonEmpty = table.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length < 2)
    return NextResponse.json(
      { message: "File kosong atau tidak ada baris data (hanya header)." },
      { status: 400 },
    );

  const headers = nonEmpty[0].map((h) => h.trim());
  const dataRows = nonEmpty.slice(1);
  if (dataRows.length > 1000)
    return NextResponse.json(
      { message: "Maksimal 1000 baris per upload" },
      { status: 400 },
    );

  const rows = dataRows.map((cols) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = (cols[i] ?? "").trim();
    });
    return obj;
  });

  return NextResponse.json({ ok: true, headers, rows });
}
