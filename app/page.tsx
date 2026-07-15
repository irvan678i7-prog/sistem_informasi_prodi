import Link from "next/link";
import {
  Mail,
  GraduationCap,
  Activity,
  ShieldCheck,
  Clock,
  ArrowRight,
  BookOpen,
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
    icon: BookOpen,
    title: "Kartu Bimbingan Digital",
    body: "Bimbingan tesis dan artikel tercatat rapi, revisi cukup unggah ulang berkas.",
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
  { n: "5", t: "Revisi & Pengesahan", d: "Unggah revisi hingga disahkan." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Bar atas putih dengan identitas kampus, mengikuti web resmi UM Metro */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-um-metro.png"
              alt="UM Metro"
              className="w-11 h-11 object-contain"
            />
            <div>
              <p className="font-semibold text-slate-900 leading-tight">
                SIPRO
              </p>
              <p className="text-xs text-slate-500 leading-tight">
                Program Pascasarjana Universitas Muhammadiyah Metro
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center rounded-md bg-accent text-slate-900 font-semibold text-sm px-5 py-2.5 hover:bg-accent-600 transition-colors"
          >
            Masuk
          </Link>
        </div>
      </header>

      {/* Hero biru royal khas UM Metro */}
      <section className="bg-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-[1fr_280px] gap-10 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Sesuai SOP Tesis PPs UM Metro
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Layanan Akademik &amp; Manajemen Tesis Digital
            </h1>
            <p className="mt-4 text-lg text-white/85 max-w-2xl leading-relaxed">
              Persuratan akademik dan seluruh alur tesis — dari pengajuan judul
              sampai sidang — dalam satu aplikasi yang ringan dan mudah
              digunakan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-accent text-slate-900 font-semibold text-base px-6 py-3 hover:bg-accent-600 transition-colors"
              >
                Masuk dengan NIM / NIDN
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { k: "5", v: "Jenis Surat" },
                { k: "6", v: "Tahap Tesis" },
                { k: "24/7", v: "Akses Online" },
              ].map((s) => (
                <div key={s.v} className="text-center">
                  <p className="text-2xl font-bold text-accent">{s.k}</p>
                  <p className="text-xs text-white/75 mt-0.5">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-um-metro.png"
              alt="Logo UM Metro"
              className="w-56 h-56 object-contain bg-white rounded-full p-6"
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Alur Tesis Mahasiswa
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Lima tahap utama sesuai standar mutu pascasarjana.
        </p>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STAGES.map((s) => (
            <li key={s.n}>
              <div className="card p-4 h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white grid place-items-center text-sm font-bold">
                    {s.n}
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{s.t}</p>
                </div>
                <p className="text-xs text-slate-600">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Fitur Utama
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Dirancang ringkas, cepat, dan aman.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-brand-900 text-white/80">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Program Pascasarjana UM Metro.</p>
          <p>Sesuai POB Tesis REV F · Disahkan Kaprodi PPs UM Metro</p>
        </div>
      </footer>
    </main>
  );
}
