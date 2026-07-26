import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  CHECKLIST_CONFIG,
  isChecklistJenis,
  parseChecklist,
  parseChecklistApproval,
} from "@/lib/checklist";
import { ChecklistDocument } from "@/components/ChecklistDocument";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

// Halaman resmi siap-cetak untuk ceklis berkas (Seminar Proposal / Ujian Tesis).
// Diakses mahasiswa pemilik atau staf (TU/Kaprodi/Admin). Print/Save-as-PDF.
export default async function CetakCeklisPage({
  params,
}: {
  params: { jenis: string; tesisId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isChecklistJenis(params.jenis)) notFound();
  const jenis = params.jenis;
  const config = CHECKLIST_CONFIG[jenis];

  let tesis: {
    id: string;
    mahasiswaId: string;
    seminarChecklist: unknown;
    ujianChecklist: unknown;
    checklistApproval: unknown;
    mahasiswa: { name: string; nimNip: string; prodi: { name: string } | null };
  } | null = null;
  try {
    tesis = await prisma.tesis.findUnique({
      where: { id: params.tesisId },
      select: {
        id: true,
        mahasiswaId: true,
        seminarChecklist: true,
        ujianChecklist: true,
        checklistApproval: true,
        mahasiswa: {
          select: {
            name: true,
            nimNip: true,
            prodi: { select: { name: true } },
          },
        },
      },
    });
  } catch (e) {
    console.error("[cetak/ceklis] kolom checklist belum tersedia:", e);
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-[820px] rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Fitur pengesahan ceklis belum aktif — kolom database baru belum
          disinkronkan. Jalankan pembaruan skema (prisma db push) lalu coba lagi.
        </div>
      </main>
    );
  }
  if (!tesis) notFound();

  const isOwner = tesis.mahasiswaId === user.id;
  const isStaff = user.role !== "MAHASISWA";
  if (!isOwner && !isStaff) notFound();

  const checks = parseChecklist(
    jenis === "seminar" ? tesis.seminarChecklist : tesis.ujianChecklist,
    jenis,
  );
  const approval = parseChecklistApproval(tesis.checklistApproval)[jenis];
  const rows = config.items.map((label, i) => ({
    no: i + 1,
    label,
    ada: checks[i],
  }));

  // Ambil aset pendukung (QR dari dokumen tersahkan + gambar TTD TU).
  let qrUrl: string | null = null;
  if (approval?.code) {
    const doc = await prisma.signedDocument.findUnique({
      where: { code: approval.code },
      select: { qrUrl: true },
    });
    qrUrl = doc?.qrUrl ?? null;
  }
  const ttdSetting = await prisma.appSetting.findUnique({
    where: { key: "ttd.tu.image" },
    select: { value: true },
  });
  const ttdImageUrl =
    typeof ttdSetting?.value === "string" ? ttdSetting.value : null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const verifyUrl = approval?.code ? `${baseUrl}/verify/${approval.code}` : null;

  return (
    <main className="min-h-screen bg-slate-100 py-6">
      <style>{`@media print { .no-print { display: none !important; } body { background: #fff; } @page { margin: 12mm; } }`}</style>

      <div className="mx-auto max-w-[820px] mb-3 flex items-center justify-between px-4 no-print">
        <Link
          href={isOwner ? config.mahasiswaHref : config.tuListHref}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Kembali
        </Link>
        {approval ? (
          <PrintButton />
        ) : (
          <span className="text-sm text-amber-700">
            Belum disahkan TU — belum dapat dicetak resmi.
          </span>
        )}
      </div>

      <div className="mx-auto max-w-[840px] bg-white shadow-sm print:shadow-none">
        <ChecklistDocument
          title={config.docTitle}
          mahasiswa={{
            name: tesis.mahasiswa.name,
            nimNip: tesis.mahasiswa.nimNip,
            prodi: tesis.mahasiswa.prodi?.name ?? null,
          }}
          rows={rows}
          approved={!!approval}
          signerName={approval?.signerName}
          approvedAtLabel={
            approval?.approvedAt ? formatDate(approval.approvedAt) : null
          }
          ttdImageUrl={ttdImageUrl}
          qrUrl={qrUrl}
          verifyUrl={verifyUrl}
          code={approval?.code ?? null}
        />
      </div>
    </main>
  );
}
