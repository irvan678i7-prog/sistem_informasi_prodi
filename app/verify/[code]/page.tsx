import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { ShieldCheck, ShieldAlert } from "lucide-react";

const KIND_LABEL: Record<string, string> = {
  SURAT: "Surat Akademik",
  SK_PEMBIMBING: "SK Pembimbing Tesis",
  SK_SIDANG: "SK Sidang Ujian Tesis",
  UNDANGAN_SEMINAR: "Undangan Seminar Proposal",
  UNDANGAN_SIDANG: "Undangan Sidang Ujian Tesis",
  BERITA_ACARA_SEMINAR: "Berita Acara Seminar",
  BERITA_ACARA_SIDANG: "Berita Acara Sidang",
  LEMBAR_PENGESAHAN: "Lembar Pengesahan",
  LAINNYA: "Dokumen Lainnya",
};

export default async function VerifyCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const doc = await prisma.signedDocument.findUnique({
    where: { code: code.toUpperCase() },
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/verify"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Verifikasi lain
        </Link>

        {!doc ? (
          <div className="card mt-3">
            <div className="card-body text-center py-12">
              <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
              <h1 className="text-xl font-bold text-slate-900">
                Dokumen tidak ditemukan
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Kode <span className="font-mono">{code}</span> tidak terdaftar
                dalam sistem.
              </p>
            </div>
          </div>
        ) : doc.revoked ? (
          <div className="card mt-3 border-red-300">
            <div className="card-body py-8">
              <ShieldAlert className="w-12 h-12 text-red-600 mb-2" />
              <h1 className="text-xl font-bold text-red-700">
                Dokumen DICABUT
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Dokumen dengan kode {doc.code} telah dicabut/dibatalkan oleh
                penerbit.
              </p>
            </div>
          </div>
        ) : (
          <div className="card mt-3 border-green-300">
            <div className="card-body py-6 space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-10 h-10 text-green-600" />
                <div>
                  <h1 className="text-xl font-bold text-green-700">
                    Dokumen Sah
                  </h1>
                  <p className="text-sm text-slate-500">
                    Diterbitkan resmi oleh PPs UM Metro
                  </p>
                </div>
              </div>
              <dl className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <Row k="Jenis Dokumen" v={KIND_LABEL[doc.kind] || doc.kind} />
                <Row k="Nomor" v={doc.nomor || "-"} />
                <Row k="Kode" v={doc.code} mono />
                <Row k="Tanggal TTD" v={formatDateTime(doc.signedAt)} />
                <Row
                  k="Penandatangan"
                  v={
                    <>
                      <span className="font-medium">{doc.signerName}</span>
                      <br />
                      <span className="text-xs text-slate-500">
                        {ROLE_LABEL[doc.signerRole]}
                      </span>
                    </>
                  }
                />
                <Row k="Hash SHA-256" v={doc.hash.slice(0, 24) + "..."} mono />
              </dl>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                Hash ini menjamin bahwa konten dokumen tidak diubah sejak
                ditandatangani.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({
  k,
  v,
  mono,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd
        className={
          "text-sm text-slate-900 break-all " + (mono ? "font-mono" : "")
        }
      >
        {v}
      </dd>
    </div>
  );
}
