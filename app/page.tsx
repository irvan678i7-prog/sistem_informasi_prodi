import Link from "next/link";
import {
  Mail,
  GraduationCap,
  QrCode,
  Activity,
  ShieldCheck,
  Clock,
} from "lucide-react";

const FEATURES = [
  {
    icon: Mail,
    title: "Persuratan Akademik Digital",
    body: "Pengajuan surat aktif kuliah, izin penelitian, cuti, dan pengantar SKPI sepenuhnya online.",
  },
  {
    icon: GraduationCap,
    title: "Manajemen Tesis",
    body: "Alur lengkap sesuai SOP: pengajuan judul, seminar proposal, SK bimbingan, KUT, hingga sidang.",
  },
  {
    icon: QrCode,
    title: "Tanda Tangan Elektronik + QR",
    body: "Dokumen resmi diberi QR code untuk verifikasi publik, anti-pemalsuan.",
  },
  {
    icon: Activity,
    title: "Tracking Real-time",
    body: "Mahasiswa dapat memantau status pengajuan kapan saja.",
  },
  {
    icon: Clock,
    title: "Akses 24/7",
    body: "Layanan diakses kapan saja, dari mana saja, asalkan terhubung internet.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & Keamanan",
    body: "Setiap aksi tercatat dalam audit log dengan role-based access control.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">
            S
          </div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">SIPRO</p>
            <p className="text-xs text-slate-500 leading-tight">
              PPs UM Metro
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-secondary">
            Masuk
          </Link>
          <Link href="/admin/login" className="btn-primary">
            Admin
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-14">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Sistem Informasi Prodi
            <span className="block text-brand-700">PPs UM Metro</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Layanan persuratan akademik digital & manajemen tesis sesuai{" "}
            <strong>POB Tesis PPs UM Metro</strong>. Tidak perlu antre, tidak
            perlu fotocopy berkas. Semua online.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="btn-primary text-base px-5 py-3">
              Masuk dengan NIM / NIP
            </Link>
            <Link
              href="/verify"
              className="btn-secondary text-base px-5 py-3"
            >
              Verifikasi Dokumen
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Fitur Utama
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <f.icon className="w-7 h-7 text-brand-700 mb-3" />
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Program Pascasarjana UM Metro.</p>
          <p>
            Sesuai POB Tesis REV F · Kode Dok: PPs · Disahkan Direktur PPs
          </p>
        </div>
      </footer>
    </main>
  );
}
