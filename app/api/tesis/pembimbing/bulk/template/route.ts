import { NextResponse } from "next/server";
import * as ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Download template Excel (.xlsx) bulk upload PA & Pembimbing 1/2
 * (Kaprodi/Admin). Template sudah berisi NIM + nama mahasiswa sesuai
 * database, kolom PA/pembimbing memiliki dropdown pilihan dosen, dan ada
 * sheet Daftar Dosen sebagai referensi.
 */
export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "KAPRODI" && session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { prodiId: true },
  });
  const isKaprodi = session.role === "KAPRODI" && !!me?.prodiId;

  const [tesisList, dosenList] = await Promise.all([
    prisma.tesis.findMany({
      where: isKaprodi ? { mahasiswa: { prodiId: me!.prodiId! } } : {},
      select: {
        mahasiswa: { select: { name: true, nimNip: true } },
        pa: { select: { name: true } },
        pembimbing1: { select: { name: true } },
        pembimbing2: { select: { name: true } },
      },
      orderBy: { mahasiswa: { name: "asc" } },
    }),
    prisma.user.findMany({
      where: isKaprodi
        ? {
            prodiId: me!.prodiId!,
            role: { in: ["DOSEN", "KAPRODI"] },
            isActive: true,
          }
        : { role: { in: ["DOSEN", "KAPRODI"] }, isActive: true },
      select: { name: true, nimNip: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "SIPRO PPS";

  const ws = wb.addWorksheet("Pembimbing", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = [
    { header: "NIM", key: "nim", width: 18 },
    { header: "Nama Mahasiswa", key: "nama", width: 36 },
    { header: "PA (Pembimbing Akademik)", key: "pa", width: 36 },
    { header: "Pembimbing 1", key: "p1", width: 36 },
    { header: "Pembimbing 2 (opsional)", key: "p2", width: 36 },
  ];
  for (const t of tesisList) {
    ws.addRow({
      nim: t.mahasiswa.nimNip,
      nama: t.mahasiswa.name,
      pa: t.pa?.name ?? "",
      p1: t.pembimbing1?.name ?? "",
      p2: t.pembimbing2?.name ?? "",
    });
  }

  const wsDosen = wb.addWorksheet("Daftar Dosen", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  wsDosen.columns = [
    { header: "NIP / NIDN", key: "nip", width: 22 },
    { header: "Nama Dosen", key: "nama", width: 45 },
  ];
  for (const d of dosenList) {
    wsDosen.addRow({ nip: d.nimNip, nama: d.name });
  }

  const styleHeader = (sheet: ExcelJS.Worksheet) => {
    const row = sheet.getRow(1);
    row.height = 22;
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.alignment = { vertical: "middle" };
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E40AF" },
      };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      };
    });
  };
  styleHeader(ws);
  styleHeader(wsDosen);

  // Garis bantu tipis + dropdown pilihan dosen untuk kolom PA/Pembimbing.
  const dosenRange = `'Daftar Dosen'!$B$2:$B$${dosenList.length + 1}`;
  for (let r = 2; r <= tesisList.length + 1; r++) {
    for (let c = 1; c <= 5; c++) {
      ws.getCell(r, c).border = {
        bottom: { style: "hair", color: { argb: "FFCBD5E1" } },
      };
    }
    if (dosenList.length > 0) {
      for (const col of ["C", "D", "E"]) {
        ws.getCell(`${col}${r}`).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [dosenRange],
          showErrorMessage: false,
        };
      }
    }
  }

  const xlsxData = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(xlsxData as ArrayBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-pa-pembimbing.xlsx"',
    },
  });
}
