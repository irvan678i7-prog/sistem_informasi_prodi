import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BulkUploadForm } from "./BulkUploadForm";

export const dynamic = "force-dynamic";

export default async function BulkUploadPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/dashboard");

  const prodi = await prisma.prodi.findMany({
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/admin/users" className="hover:underline">
            ← Kelola User
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          Bulk Upload Mahasiswa
        </h1>
        <p className="text-sm text-slate-500">
          Unggah daftar mahasiswa via CSV. Username = NIM, password awal juga =
          NIM.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Format CSV</CardTitle>
          <CardDescription>
            Baris pertama harus berisi header. Kolom yang dikenali:
          </CardDescription>
        </CardHeader>
        <CardBody className="text-sm space-y-2">
          <ul className="list-disc list-inside text-slate-700">
            <li>
              <code>nim</code> (wajib) — dipakai juga sebagai password awal
            </li>
            <li>
              <code>name</code> (wajib)
            </li>
            <li>
              <code>email</code> — opsional. Kalau kosong, otomatis dibuat{" "}
              <code>&lt;nim&gt;@mhs.ummetro.ac.id</code>
            </li>
            <li>
              <code>prodiCode</code> — kode prodi (mis. <code>MMP</code>).
              Opsional kalau pilih default prodi di bawah.
            </li>
            <li>
              <code>angkatan</code>, <code>semester</code>, <code>phone</code>,{" "}
              <code>address</code> — opsional
            </li>
          </ul>
          <p className="text-slate-700">
            Contoh isi CSV:
          </p>
          <pre className="bg-slate-50 p-3 rounded-md text-xs overflow-x-auto border border-slate-200">{`nim,name,email,prodiCode,angkatan,semester
24010001,Andi Pratama,andi@mhs.ummetro.ac.id,MMP,2024,1
24010002,Budi Sanjaya,,MMP,2024,1
24010003,Citra Wulandari,,MMP,2024,1`}</pre>
          <p className="text-xs text-slate-500">
            Kode prodi yang tersedia:{" "}
            {prodi.length === 0
              ? "(belum ada prodi, buat dulu di menu Kelola Prodi)"
              : prodi.map((p) => `${p.code} (${p.name})`).join(", ")}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unggah CSV</CardTitle>
        </CardHeader>
        <CardBody>
          <BulkUploadForm prodi={prodi} />
        </CardBody>
      </Card>
    </div>
  );
}
