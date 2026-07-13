import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const metadata = {
  title: "Panduan Penggunaan - SIPRO PPs UM Metro",
  description:
    "Panduan penggunaan Sistem Informasi Program Studi Pascasarjana UM Metro.",
};

type GuideStep = { title: string; desc: string; href?: string };

const PANDUAN_MAHASISWA: GuideStep[] = [
  {
    title: "Ajukan judul tesis",
    desc: "Isi Formulir Pengajuan Judul dengan 3 rencana judul beserta jenis penelitiannya, pilih Dosen Pembimbing Akademik (PA), lalu kirim. Status dapat dipantau pada halaman yang sama.",
    href: "/tesis/judul",
  },
  {
    title: "Tunggu persetujuan judul",
    desc: "Dosen PA meninjau dan menyetujui salah satu judul, kemudian Kaprodi memfinalisasi. Notifikasi akan dikirim pada setiap perubahan status.",
  },
  {
    title: "Bimbingan tesis dan artikel",
    desc: "Setelah pembimbing ditetapkan, unggah berkas per bagian (maksimal 2MB per file, format PDF) pada Kartu Bimbingan. Catatan pembimbing tampil pada setiap bagian.",
    href: "/tesis/bimbingan-artikel",
  },
  {
    title: "Lengkapi berkas syarat ujian",
    desc: "Siapkan 14 berkas syarat ujian tesis sesuai daftar pada dashboard, lalu ajukan Kelayakan Ujian Tesis (KUT) dengan mencentang berkas yang sudah tersedia.",
    href: "/tesis/kut",
  },
  {
    title: "Ikuti ujian dan selesaikan revisi",
    desc: "Setelah KUT disetujui dan jadwal sidang terbit, ikuti ujian tesis. Unggah berkas revisi hingga disetujui untuk menyelesaikan proses.",
    href: "/tesis/revisi",
  },
  {
    title: "Ajukan surat akademik",
    desc: "Permohonan surat (keterangan aktif, izin penelitian, dan lainnya) diajukan melalui menu Persuratan dan diproses oleh admin prodi.",
    href: "/surat/baru",
  },
];

const PANDUAN_DOSEN: GuideStep[] = [
  {
    title: "Tinjau pengajuan judul",
    desc: "Sebagai Dosen PA, tinjau 3 rencana judul mahasiswa pada antrian pengajuan, beri komentar, dan setujui salah satu judul.",
    href: "/tesis/judul",
  },
  {
    title: "Beri catatan bimbingan",
    desc: "Tinjau berkas yang diunggah mahasiswa per bagian pada Kartu Bimbingan, beri tingkat revisi dan catatan pada kolom pembimbing Anda.",
    href: "/bimbingan/artikel",
  },
  {
    title: "Paraf log bimbingan",
    desc: "Setujui (paraf) catatan bimbingan yang diajukan mahasiswa agar terekam sebagai sesi bimbingan yang sah.",
    href: "/bimbingan",
  },
  {
    title: "Setujui Kelayakan Ujian Tesis",
    desc: "Periksa kelengkapan 14 berkas syarat dan hasil uji plagiasi, lalu berikan persetujuan KUT sebagai pembimbing.",
    href: "/tesis/kut",
  },
];

const PANDUAN_KAPRODI: GuideStep[] = [
  {
    title: "Finalisasi judul",
    desc: "Setelah Dosen PA menyetujui judul, lakukan finalisasi agar mahasiswa dapat melanjutkan ke tahap proposal.",
    href: "/tesis/judul",
  },
  {
    title: "Tetapkan pembimbing",
    desc: "Klik nama mahasiswa pada dashboard atau buka menu Atur Pembimbing untuk menetapkan Pembimbing 1 dan 2 beserta SK.",
    href: "/tesis/pembimbing",
  },
  {
    title: "Terbitkan SK Pembimbing",
    desc: "Kelola dan unduh SK penetapan pembimbing pada menu SK Pembimbing.",
    href: "/tesis/sk-pembimbing",
  },
  {
    title: "Setujui KUT dan pantau prodi",
    desc: "Berikan persetujuan akhir KUT dan pantau progres seluruh mahasiswa prodi melalui dashboard.",
    href: "/dashboard",
  },
];

const PANDUAN_ADMIN: GuideStep[] = [
  {
    title: "Kelola akun pengguna",
    desc: "Tambah, edit, nonaktifkan, atau reset password akun mahasiswa, dosen, dan kaprodi melalui menu Kelola User. Tersedia juga unggah massal mahasiswa.",
    href: "/admin/users",
  },
  {
    title: "Kelola prodi dan master data",
    desc: "Atur data program studi serta master data (jenis surat, tahun akademik, dan lainnya) yang dipakai seluruh sistem.",
    href: "/admin/prodi",
  },
  {
    title: "Pantau audit log",
    desc: "Seluruh tindakan penting (pembuatan akun, perubahan data, persetujuan) terekam dan dapat ditelusuri pada Audit Log.",
    href: "/admin/audit",
  },
];

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const sections: { heading: string; steps: GuideStep[] }[] = [];
  if (user.role === "MAHASISWA")
    sections.push({ heading: "Alur untuk Mahasiswa", steps: PANDUAN_MAHASISWA });
  if (user.role === "DOSEN")
    sections.push({ heading: "Alur untuk Dosen", steps: PANDUAN_DOSEN });
  if (user.role === "KAPRODI")
    sections.push(
      { heading: "Alur untuk Kaprodi", steps: PANDUAN_KAPRODI },
      { heading: "Alur Dosen (juga berlaku)", steps: PANDUAN_DOSEN },
    );
  if (user.role === "ADMIN")
    sections.push({ heading: "Alur untuk Administrator", steps: PANDUAN_ADMIN });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panduan Penggunaan</h1>
        <p className="text-sm text-slate-500">
          Ringkasan alur kerja Sistem Informasi Program Studi (SIPRO)
          Pascasarjana UM Metro sesuai peran Anda.
        </p>
      </div>

      {sections.map((section) => (
        <Card key={section.heading}>
          <CardHeader>
            <CardTitle>{section.heading}</CardTitle>
            <CardDescription>
              Ikuti langkah berikut secara berurutan.
            </CardDescription>
          </CardHeader>
          <CardBody className="p-0">
            <ol className="divide-y divide-slate-100">
              {section.steps.map((step, i) => (
                <li key={i} className="flex gap-4 px-5 py-4">
                  <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold grid place-items-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{step.title}</p>
                    <p className="text-sm text-slate-600 leading-relaxed mt-0.5">
                      {step.desc}
                    </p>
                    {step.href && (
                      <Link
                        href={step.href}
                        className="text-sm font-medium text-brand-700 hover:underline mt-1 inline-block"
                      >
                        Buka halaman terkait
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Ketentuan Umum</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-sm text-slate-600 leading-relaxed list-disc pl-5">
            <li>
              Berkas yang diunggah harus berformat PDF dengan ukuran maksimal
              2MB per file.
            </li>
            <li>
              Seluruh persetujuan (judul, KUT, bimbingan) terekam beserta waktu
              dan nama pemberi persetujuan.
            </li>
            <li>
              Notifikasi dikirim pada setiap perubahan status penting; periksa
              menu Notifikasi secara berkala.
            </li>
            <li>
              Apabila mengalami kendala akses akun, hubungi admin prodi untuk
              reset password.
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
