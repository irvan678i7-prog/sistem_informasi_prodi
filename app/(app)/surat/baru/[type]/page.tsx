import { notFound, redirect } from "next/navigation";
import type { LetterType } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { LETTER_FIELDS, LETTER_LABEL } from "@/lib/letterTemplates";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LetterDraftForm } from "./LetterDraftForm";

const VALID: Record<string, LetterType> = {
  aktif_kuliah: "AKTIF_KULIAH",
  izin_penelitian: "IZIN_PENELITIAN",
  cuti_akademik: "CUTI_AKADEMIK",
  pengantar_skpi: "PENGANTAR_SKPI",
  bebas_plagiasi: "BEBAS_PLAGIASI",
};

export default async function NewSuratPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const letterType = VALID[type];
  if (!letterType) notFound();

  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") redirect("/surat");

  const fields = LETTER_FIELDS[letterType];
  const mhsInfo = {
    name: user.name,
    nimNip: user.nimNip,
    prodi: user.prodi?.name ?? null,
    jenjang: user.prodi?.jenjang ?? "S2",
    semester: user.mahasiswaProfile?.semester ?? null,
    angkatan: user.mahasiswaProfile?.angkatan ?? null,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <p className="text-sm text-slate-500">Pengajuan Surat</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {LETTER_LABEL[letterType]}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pengajuan</CardTitle>
          <CardDescription>
            Lengkapi data berikut. Anda dapat melihat preview surat sebelum
            mengirim ke admin prodi.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <LetterDraftForm
            type={letterType}
            fields={fields}
            mahasiswa={mhsInfo}
          />
        </CardBody>
      </Card>
    </div>
  );
}
