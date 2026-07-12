// Mahasiswa dashboard: upload area + key thesis progress.
//
// "Upload area" here is the set of entry points where a student submits
// documents (proposal, bimbingan, revisi) — it links into the existing
// upload flows so the dedicated pages remain the source of truth. Later work
// can swap the link cards for an inline uploader without changing the layout.

import Link from "next/link";
import {
  GraduationCap,
  Bell,
  Mail,
  Upload,
  ClipboardList,
  FileText,
  BookOpen,
} from "lucide-react";
import { StageBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { MahasiswaDashboardData } from "@/lib/dashboard";
import { DashboardHero, StatCard, SectionCard, EmptyState } from "./shared";
import type { Role } from "@prisma/client";

type User = {
  name: string;
  role: Role;
  nimNip: string;
  prodi?: { name: string } | null;
};

export function MahasiswaDashboard({
  user,
  data,
}: {
  user: User;
  data: MahasiswaDashboardData;
}) {
  const { tesis, unreadNotif, letterCount, pendingBimbingan } = data;

  return (
    <div className="space-y-6">
      <DashboardHero
        name={user.name}
        role={user.role}
        prodiName={user.prodi?.name}
        nimNip={user.nimNip}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          label="Tahap Tesis"
          value={tesis ? tesis.stage.replace(/_/g, " ") : "Belum mulai"}
          href="/tesis"
        />
        <StatCard
          icon={ClipboardList}
          label="Bimbingan Menunggu Paraf"
          value={pendingBimbingan}
          href="/tesis/bimbingan"
        />
        <StatCard
          icon={Mail}
          label="Surat Saya"
          value={letterCount}
          href="/surat"
        />
        <StatCard
          icon={Bell}
          label="Notifikasi Baru"
          value={unreadNotif}
          href="/notifikasi"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upload area */}
        <SectionCard
          title="Unggah Berkas"
          description="Kirim dokumen sesuai tahap tesis Anda (maks. 2MB per file, dapat dipreview)"
        >
          {tesis ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <UploadLink
                href="/tesis/bimbingan-artikel"
                icon={BookOpen}
                title="Bimbingan Artikel"
                desc="Unggah berkas per bagian (1–8)"
              />
              <UploadLink
                href="/tesis/bimbingan"
                icon={ClipboardList}
                title="Catatan Bimbingan"
                desc="Unggah progres & lampiran"
              />
              <UploadLink
                href="/tesis/revisi"
                icon={Upload}
                title="Berkas Revisi"
                desc="Unggah hasil revisi"
              />
              <UploadLink
                href="/tesis/seminar"
                icon={FileText}
                title="Proposal & Seminar"
                desc="Berkas seminar proposal"
              />
              <UploadLink
                href="/surat/baru"
                icon={Mail}
                title="Ajukan Surat"
                desc="Permohonan surat akademik"
              />
            </div>
          ) : (
            <div className="space-y-3 text-center py-4">
              <p className="text-sm text-slate-600">
                Mulai proses tesis dengan mengajukan judul. Area unggah berkas
                akan terbuka setelah judul diajukan.
              </p>
              <Link href="/tesis/judul" className="btn-primary inline-block">
                Ajukan Judul Sekarang
              </Link>
            </div>
          )}
        </SectionCard>

        {/* Key progress */}
        <SectionCard
          title="Progres Tesis"
          description="Ringkasan status tesis Anda"
          action={
            <Link href="/tesis" className="btn-ghost text-sm">
              Detail
            </Link>
          }
        >
          {tesis ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Tahap:</span>
                <StageBadge stage={tesis.stage} />
              </div>
              <Field
                label="Judul Final"
                value={tesis.judulFinal || "(menunggu persetujuan)"}
              />
              <Field
                label="Pembimbing 1"
                value={tesis.pembimbing1?.name || "(belum ditetapkan)"}
              />
              <Field
                label="Pembimbing 2"
                value={tesis.pembimbing2?.name || "(belum ditetapkan)"}
              />
              {tesis.sidang && (
                <div className="rounded-md border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">Jadwal Sidang</p>
                  <p className="text-slate-600">
                    {formatDate(tesis.sidang.jadwal)} ·{" "}
                    {tesis.sidang.ruang || "TBA"} · {tesis.sidang.mode}
                  </p>
                </div>
              )}
              {tesis.timeline.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs text-slate-500 mb-1">Aktivitas terbaru</p>
                  <ul className="space-y-1.5">
                    {tesis.timeline.slice(0, 3).map((t) => (
                      <li key={t.id} className="flex gap-2 text-sm">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
                        <div>
                          <p className="text-slate-800">{t.stage}</p>
                          <p className="text-xs text-slate-400">
                            {formatDateTime(t.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <EmptyState>Belum ada data tesis.</EmptyState>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function UploadLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
    >
      <Icon className="w-5 h-5 text-brand-700 mb-1.5" />
      <p className="font-medium text-slate-900 text-sm">{title}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </Link>
  );
}
