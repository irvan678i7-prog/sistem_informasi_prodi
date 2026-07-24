import { NextResponse } from "next/server";
import * as ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  parseCsv,
  rowsFromTable,
  checkBulkRows,
  toClientRow,
} from "@/lib/bulkPembimbing";

export const dynamic = "force-dynamic";

async function parseXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(buf));
  const ws = wb.worksheets[0];
  const rows: string[][] = [];
  if (!ws) return rows;
  ws.eachRow((row) => {
    const cells: string[] = [];
    for (let c = 1; c <= 5; c++) {
      cells.push(String(row.getCell(c).text ?? ""));
    }
    rows.push(cells);
  });
  return rows;
}

/**
 * Preview bulk upload PA & Pembimbing 1/2 (Kaprodi/Admin).
 * Membaca file Excel/CSV, memvalidasi setiap baris, dan mengembalikan
 * hasilnya TANPA menyimpan apa pun. Penyimpanan dilakukan endpoint
 * terpisah setelah user menekan konfirmasi.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { message: "Upload tidak valid" },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json(
      { message: "File belum dipilih" },
      { status: 400 },
    );
  if (file.size > 2_000_000)
    return NextResponse.json(
      { message: "Ukuran file maksimal 2 MB" },
      { status: 400 },
    );

  const name = (file.name || "").toLowerCase();
  let table: string[][];
  try {
    if (name.endsWith(".xlsx")) {
      table = await parseXlsx(await file.arrayBuffer());
    } else if (name.endsWith(".csv")) {
      table = parseCsv(await file.text());
    } else {
      return NextResponse.json(
        { message: "Format file harus .xlsx (Excel) atau .csv" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Gagal membaca file. Pastikan file tidak rusak." },
      { status: 400 },
    );
  }

  const rows = rowsFromTable(table);
  if (rows.length === 0)
    return NextResponse.json(
      { message: "File kosong atau tidak ada baris data" },
      { status: 400 },
    );
  if (rows.length > 500)
    return NextResponse.json(
      { message: "Maksimal 500 baris per upload" },
      { status: 400 },
    );

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  const kaprodiProdiId =
    session.role === "KAPRODI" ? (me?.prodiId ?? null) : null;

  const results = await checkBulkRows(rows, kaprodiProdiId);
  return NextResponse.json({ ok: true, rows: results.map(toClientRow) });
}
