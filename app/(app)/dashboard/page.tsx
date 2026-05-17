import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/rbac";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatusBadge, StageBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatDate } from "@/lib/utils";
import { Mail, GraduationCap, Bell, FileCheck } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [myLetters, myTesis, unreadNotif] = await Promise.all([
    prisma.letterRequest.findMany({
      where: { mahasiswaId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    user.role === "MAHASISWA"
      ? prisma.tesis.findUnique({
          where: { mahasiswaId: user.id },
          include: { sidang: true, kut: true },
        })
      : null,
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  const isMhs = user.role === "MAHASISWA";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Halo, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-500">
          {ROLE_LABEL[user.role]}
          {user.prodi ? ` · ${user.prodi.name}` : ""} · NIM/NIP {user.nimNip}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Mail}
          label="Surat Saya"
          value={String(myLetters.length)}
          href="/surat"
        />
        <KpiCard
          icon={GraduationCap}
          label={isMhs ? "Status Tesis" : "Modul Tesis"}
          value={isMhs && myTesis ? myTesis.stage.replace(/_/g, " ") : "Aktif"}
          href="/tesis"
        />
        <KpiCard
          icon={Bell}
          label="Notifikasi Baru"
          value={String(unreadNotif)}
          href="/notifikasi"
        />
        <KpiCard
          icon={FileCheck}
          label="Verifikasi Dokumen"
          value="Publik"
          href="/verify"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Surat Terbaru</CardTitle>
                <CardDescription>
                  5 pengajuan surat terakhir Anda
                </CardDescription>
              </div>
              <Link href="/surat" className="btn-ghost text-sm">
                Lihat semua
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {myLetters.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500 text-center">
                Belum ada pengajuan surat.{" "}
                <Link href="/surat/baru" className="text-brand-700 underline">
                  Ajukan sekarang
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {myLetters.map((l) => (
                  <li key={l.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {LETTER_LABEL[l.type]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(l.createdAt)}
                        {l.nomor ? ` · No. ${l.nomor}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                    <Link
                      href={`/surat/${l.id}`}
                      className="btn-ghost text-sm"
                    >
                      Lihat
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isMhs ? "Tesis Saya" : "Aksi Cepat"}</CardTitle>
            <CardDescription>
              {isMhs
                ? "Ringkasan progres tesis Anda"
                : "Akses cepat ke modul tesis"}
            </CardDescription>
          </CardHeader>
          <CardBody>
            {isMhs ? (
              myTesis ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Tahap:</span>
                    <StageBadge stage={myTesis.stage} />
                  </div>
                  {myTesis.judulFinal && (
                    <div>
                      <p className="text-xs text-slate-500">Judul Final</p>
                      <p className="font-medium text-slate-900">
                        {myTesis.judulFinal}
                      </p>
                    </div>
                  )}
                  {myTesis.sidang && (
                    <div className="rounded-md border border-slate-200 p-3 text-sm">
                      <p className="font-medium text-slate-900">
                        Jadwal Sidang
                      </p>
                      <p className="text-slate-600">
                        {formatDate(myTesis.sidang.jadwal)} ·{" "}
                        {myTesis.sidang.ruang || "TBA"} ·{" "}
                        {myTesis.sidang.mode}
                      </p>
                    </div>
                  )}
                  <Link href="/tesis" className="btn-primary inline-block">
                    Buka Modul Tesis
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-600 mb-3">
                    Anda belum mengajukan judul tesis.
                  </p>
                  <Link href="/tesis/judul" className="btn-primary">
                    Ajukan Judul Sekarang
                  </Link>
                </div>
              )
            ) : (
              <div className="flex flex-wrap gap-2">
                <Link href="/tesis" className="btn-secondary">
                  Antrian Tesis
                </Link>
                <Link href="/surat" className="btn-secondary">
                  Antrian Surat
                </Link>
                {user.role === "ADMIN_SISTEM" && (
                  <>
                    <Link href="/admin/users" className="btn-secondary">
                      Kelola User
                    </Link>
                    <Link href="/admin/prodi" className="btn-secondary">
                      Kelola Prodi
                    </Link>
                  </>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

const LETTER_LABEL: Record<string, string> = {
  AKTIF_KULIAH: "Surat Aktif Kuliah",
  IZIN_PENELITIAN: "Surat Izin Penelitian",
  CUTI_AKADEMIK: "Surat Cuti Akademik",
  PENGANTAR_SKPI: "Pengantar SKPI",
  BEBAS_PLAGIASI: "Bebas Plagiasi",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3"
    >
      <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-700 grid place-items-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-slate-900">{value}</p>
      </div>
    </Link>
  );
}
