import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCheckSeminarBerkas } from "@/lib/rbac";
import { SEMINAR_BERKAS_ITEMS } from "@/lib/seminarBerkas";
import { previewUrl } from "@/lib/preview";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChecklistForm } from "./ChecklistForm";

// Detail cek berkas Seminar Proposal satu mahasiswa (halaman TU).
export default async function TuSeminarBerkasDetailPage({
  params,
}: {
  params: { tesisId: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!canCheckSeminarBerkas(user.role)) redirect("/dashboard");

  const tesis = await prisma.tesis.findUnique({
    where: { id: params.tesisId },
    select: {
      id: true,
      judulFinal: true,
      seminarChecklist: true,
      mahasiswa: { select: { name: true, nimNip: true } },
      seminarBerkas: {
        select: { item: true, fileUrl: true, fileName: true },
        orderBy: { item: "asc" },
      },
    },
  });
  if (!tesis) notFound();

  const byItem = new Map(tesis.seminarBerkas.map((b) => [b.item, b]));
  const saved = Array.isArray(tesis.seminarChecklist)
    ? (tesis.seminarChecklist as boolean[])
    : [];

  const items = SEMINAR_BERKAS_ITEMS.map((label, i) => {
    const berkas = byItem.get(i + 1);
    return {
      no: i + 1,
      label,
      file: berkas
        ? {
            name: berkas.fileName,
            url: previewUrl(berkas.fileUrl, berkas.fileName),
          }
        : null,
    };
  });

  // Nilai awal ceklis: pakai ceklis tersimpan; jika belum pernah dicek,
  // default mengikuti ada/tidaknya berkas yang diunggah.
  const initial = SEMINAR_BERKAS_ITEMS.map((_, i) =>
    typeof saved[i] === "boolean" ? saved[i] : byItem.has(i + 1),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cek Berkas: {tesis.mahasiswa.name}
          </h1>
          <p className="text-sm text-slate-500">
            {tesis.mahasiswa.nimNip}
            {tesis.judulFinal ? " \u2014 " + tesis.judulFinal : ""}
          </p>
        </div>
        <Link href="/tu/seminar-berkas" className="btn-ghost">
          Kembali
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check List Berkas Syarat Seminar Proposal</CardTitle>
          <CardDescription>
            Klik \u201cLihat\u201d untuk memeriksa isi berkas, lalu ceklis ADA /
            TIDAK ADA dan simpan.
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <ChecklistForm tesisId={tesis.id} items={items} initial={initial} />
        </CardBody>
      </Card>
    </div>
  );
}
