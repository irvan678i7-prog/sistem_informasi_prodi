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

// Bulk upload PA & Pembimbing 1/2 (Kaprodi/Admin) lewat file Excel.
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
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bulk Upload PA & Pembimbing 1/2
          </h1>
          <p className="text-sm text-slate-500">
            Tetapkan PA (Pembimbing Akademik), Pembimbing 1, dan Pembimbing 2
            untuk banyak mahasiswa sekaligus lewat file Excel.
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
        Langkah: 1) Download template Excel — nama mahasiswa sudah terisi
        otomatis sesuai database. 2) Isi kolom PA, Pembimbing 1, dan
        Pembimbing 2 — tinggal pilih nama dosen dari dropdown di tiap sel;
        kolom yang dikosongkan tidak akan diubah. 3) Upload file di sini,
        periksa pratinjau, lalu konfirmasi untuk menyimpan.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>1. Download Template (Excel)</CardTitle>
          <CardDescription>
            Template .xlsx sudah berisi NIM dan nama seluruh mahasiswa prodi
            Anda, beserta PA dan pembimbing saat ini jika sudah pernah
            ditetapkan. Kolom PA/pembimbing memiliki dropdown pilihan dosen,
            dan daftar lengkap dosen ada di sheet Daftar Dosen.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <a
            href="/api/tesis/pembimbing/bulk/template"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Download className="w-4 h-4" /> Download Template (Excel)
          </a>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Upload & Preview</CardTitle>
          <CardDescription>
            Setelah upload, sistem menampilkan pratinjau hasil pembacaan file
            — belum ada yang disimpan sampai Anda menekan Konfirmasi &
            Simpan. Baris dengan kolom PA dan pembimbing kosong akan
            dilewati. Bulk upload tidak menerbitkan SK otomatis; SK per
            mahasiswa dapat diterbitkan lewat tombol Tetapkan Pembimbing di
            halaman Mahasiswa & Pembimbing.
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
            Dropdown di template memakai nama dosen berikut. Anda juga bisa
            mengetik NIP atau nama persis seperti di bawah.
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
