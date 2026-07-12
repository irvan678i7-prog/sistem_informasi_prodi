import Link from "next/link";
import {
  Mail,
  GraduationCap,
  QrCode,
  Activity,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
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

const STAGES = [
  { n: "1", t: "Pengajuan Judul", d: "Ajukan 3 rencana judul ke Dosen PA." },
  { n: "2", t: "Seminar Proposal", d: "SK Pembimbing terbit, daftar seminar." },
  { n: "3", t: "Bimbingan & KUT", d: "Catatan bimbingan & Kartu Ujian Tesis." },
  { n: "4", t: "Sidang Tesis", d: "Daftar sidang setelah KUT disetujui Kaprodi." },
  { n: "5", t: "Revisi & Pengesahan", d: "Lembar pengesahan ber-QR siap unduh." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-um-metro.png"
            alt="UM Metro"
            className="w-11 h-11 object-contain"
          />
          <div>
            <p className="font-semibold text-slate-900 leading-tight">SIPRO</p>
            <p className="text-xs text-slate-500 leading-tight">
              Program Pascasarjana UM Metro
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/verify" className="btn-ghost">
            Verifikasi QR
          </Link>
          <Link href="/login" className="btn-primary">
            Masuk
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-transparent"
        />
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-16 grid lg:grid-cols-[1fr_320px] gap-8 items-center relative">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-100 text-brand-800 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai SOP Tesis PPs UM
              Metro
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Layanan Akademik &
              <span className="block bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                Manajemen Tesis Digital
              </span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl">
              Persuratan akademik & seluruh alur tesis (judul → sidang) dalam
              satu aplikasi. Setiap dokumen resmi ber-QR untuk verifikasi
              publik.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="btn-primary text-base px-5 py-3 inline-flex items-center"
              >
                Masuk dengan NIM / NIDN
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
              <Link
                href="/verify"
                className="btn-secondary text-base px-5 py-3"
              >
                Verifikasi Dokumen
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { k: "5", v: "Jenis Surat" },
                { k: "6", v: "Tahap Tesis" },
                { k: "24/7", v: "Akses Online" },
              ].map((s) => (
                <div key={s.v} className="text-center">
                  <p className="text-2xl font-bold text-brand-700">{s.k}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-200/40 blur-3xl rounded-full" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-um-metro.png"
                alt="Logo UM Metro"
                className="relative w-64 h-64 object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Alur Tesis Mahasiswa
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Lima tahap utama sesuai standar mutu pascasarjana.
        </p>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STAGES.map((s, i) => (
            <li key={s.n} className="relative">
              <div className="card p-4 h-full hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-bold">
                    {s.n}
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{s.t}</p>
                </div>
                <p className="text-xs text-slate-600">{s.d}</p>
              </div>
              {i < STAGES.length - 1 ? (
                <ArrowRight className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Fitur Utama
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Dirancang ringkas, modern, dan aman.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Program Pascasarjana UM Metro.</p>
          <p>Sesuai POB Tesis REV F · Disahkan Kaprodi PPs UM Metro</p>
        </div>
      </footer>
    </main>
  );
}
