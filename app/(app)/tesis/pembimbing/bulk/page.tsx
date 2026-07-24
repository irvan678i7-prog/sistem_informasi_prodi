import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { BulkUploadForm } from "./BulkUploadForm";

export const dynamic = "force-dynamic";

// Bulk upload Pembimbing 1 & 2 (Kaprodi/Admin) lewat file CSV.
export default async function BulkPembimbingPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "KAPRODI" && user.role !== "ADMIN")
    redirect("/dashboard");

  const dosenList =
    user.role === "KAPRODI" && user.prodiId
      ? await prisma.user.findMany({
          where: {
            prodiId: user.prodiId,
            role: { in: ["DOSEN", "KAPRODI"] },
            isActive: true,
          },
          select: { id: true, name: true, nimNip: true },
          orderBy: { name: "asc" },
        })
      : await prisma.user.findMany({
          where: {
            role: { in: ["DOSEN", "KAPRODI"] },
            isActive: true,
          },
          select: { id: true, name: true, nimNip: true },
          orderBy: { name: "asc" },
        });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bulk Upload Pembimbing 1 & 2
          </h1>
          <p className="text-sm text-slate-500">
            Tetapkan Pembimbing 1 dan Pembimbing 2 untuk banyak mahasiswa
            sekaligus lewat file CSV.
          </p>
        </div>
        <Link
          href="/tesis/pembimbing"
          className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Mahasiswa & Pembimbing
        </Link>
      </div>

      <Alert variant="info">
        Langkah: 1) Download template — nama mahasiswa sudah terisi otomatis
        sesuai database. 2) Isi kolom Pembimbing 1 dan Pembimbing 2 dengan NIP
        atau nama dosen persis seperti pada daftar dosen di bawah. 3) Simpan
        sebagai CSV lalu upload di sini.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>1. Download Template</CardTitle>
          <CardDescription>
            Template CSV sudah berisi NIM dan nama seluruh mahasiswa prodi
            Anda, beserta pembimbing saat ini jika sudah pernah ditetapkan.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <a
            href="/api/tesis/pembimbing/bulk/template"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Download className="w-4 h-4" /> Download Template (CSV)
          </a>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Upload File yang Sudah Diisi</CardTitle>
          <CardDescription>
            Baris dengan kolom pembimbing kosong akan dilewati. Bulk upload
            tidak menerbitkan SK otomatis; SK per mahasiswa dapat diterbitkan
            lewat tombol Tetapkan Pembimbing di halaman Mahasiswa &
            Pembimbing.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <BulkUploadForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Dosen (Referensi Pengisian)</CardTitle>
          <CardDescription>
            Gunakan NIP atau nama persis seperti di bawah pada kolom
            Pembimbing 1 / Pembimbing 2.
          </CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-slate-600 w-48">
                    NIP / NIDN
                  </th>
                  <th className="px-3 py-2 font-medium text-slate-600">
                    Nama Dosen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dosenList.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2 text-slate-500">{d.nimNip}</td>
                    <td className="px-3 py-2 text-slate-900">{d.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
