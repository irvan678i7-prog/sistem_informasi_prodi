import { NextResponse } from "next/server";
import * as ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Download template Excel (.xlsx) untuk Bulk Upload Mahasiswa (Admin).
// Header memakai kunci mesin (nim, name, ...) supaya langsung terbaca saat
// diunggah. Kolom prodiCode diberi dropdown dari sheet "Daftar Prodi".
export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  const prodi = await prisma.prodi.findMany({
    orderBy: { name: "asc" },
    select: { code: true, name: true },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "SIPRO PPS";

  const ws = wb.addWorksheet("Mahasiswa", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = [
    { header: "nim", key: "nim", width: 18 },
    { header: "name", key: "name", width: 32 },
    { header: "email", key: "email", width: 30 },
    { header: "prodiCode", key: "prodiCode", width: 14 },
    { header: "angkatan", key: "angkatan", width: 12 },
    { header: "semester", key: "semester", width: 12 },
    { header: "phone", key: "phone", width: 18 },
    { header: "address", key: "address", width: 32 },
  ];

  const contohProdi = prodi[0]?.code ?? "MMP";
  ws.addRow({
    nim: "24010001",
    name: "Andi Pratama",
    email: "",
    prodiCode: contohProdi,
    angkatan: 2024,
    semester: 1,
    phone: "",
    address: "",
  });
  ws.addRow({
    nim: "24010002",
    name: "Budi Sanjaya",
    email: "budi@mhs.ummetro.ac.id",
    prodiCode: contohProdi,
    angkatan: 2024,
    semester: 1,
    phone: "",
    address: "",
  });

  const wsProdi = wb.addWorksheet("Daftar Prodi", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  wsProdi.columns = [
    { header: "Kode", key: "code", width: 14 },
    { header: "Nama Prodi", key: "name", width: 45 },
  ];
  for (const p of prodi) wsProdi.addRow({ code: p.code, name: p.name });

  const styleHeader = (sheet: ExcelJS.Worksheet) => {
    const row = sheet.getRow(1);
    row.height = 22;
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.alignment = { vertical: "middle" };
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0B46E3" },
      };
    });
  };
  styleHeader(ws);
  styleHeader(wsProdi);

  // Dropdown prodiCode (kolom D) mengacu ke daftar kode prodi.
  if (prodi.length > 0) {
    const prodiRange = `'Daftar Prodi'!$A$2:$A$${prodi.length + 1}`;
    for (let r = 2; r <= 500; r++) {
      ws.getCell(`D${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [prodiRange],
        showErrorMessage: false,
      };
    }
  }

  const xlsxData = await wb.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(xlsxData as ArrayBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-mahasiswa.xlsx"',
    },
  });
}
