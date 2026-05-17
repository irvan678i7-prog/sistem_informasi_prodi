import Link from "next/link";
import type { LetterType } from "@prisma/client";
import { LETTER_DESC, LETTER_LABEL } from "@/lib/letterTemplates";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mail } from "lucide-react";

const TYPES: LetterType[] = [
  "AKTIF_KULIAH",
  "IZIN_PENELITIAN",
  "CUTI_AKADEMIK",
  "PENGANTAR_SKPI",
  "BEBAS_PLAGIASI",
];

export default async function PilihJenisSuratPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "MAHASISWA") {
    redirect("/surat");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ajukan Surat</h1>
        <p className="text-sm text-slate-500">
          Pilih jenis surat yang ingin Anda ajukan.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TYPES.map((t) => (
          <Card key={t} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <CardTitle>{LETTER_LABEL[t]}</CardTitle>
                  <CardDescription>{LETTER_DESC[t]}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <Link
                href={`/surat/baru/${t.toLowerCase()}`}
                className="btn-primary w-full"
              >
                Ajukan
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
