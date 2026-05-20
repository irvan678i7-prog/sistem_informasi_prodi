import type { LetterType, Role } from "@prisma/client";
import { LETTER_LABEL } from "@/lib/letterTemplates";
import { formatDate } from "@/lib/utils";

interface SignerInfo {
  name: string;
  role: Role;
  nip?: string | null;
  signatureUrl?: string | null;
}

interface MahasiswaInfo {
  name: string;
  nimNip: string;
  prodi?: string | null;
  jenjang?: string | null;
  semester?: number | null;
  angkatan?: number | null;
}

interface InstitutionInfo {
  nama?: string;
  alamat?: string;
  telp?: string;
  email?: string;
  website?: string;
  logo?: string;
}

interface LetterDocumentProps {
  type: LetterType;
  nomor?: string | null;
  date?: Date | string;
  payload: Record<string, unknown>;
  mahasiswa: MahasiswaInfo;
  signer?: SignerInfo | null;
  qrUrl?: string | null;
  verifyUrl?: string | null;
  isDraft?: boolean;
  institution?: InstitutionInfo;
}

const ROLE_TITLE: Partial<Record<Role, string>> = {
  KAPRODI: "Ketua Program Studi",
  ADMIN: "Administrator",
  DOSEN: "Dosen",
};

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="meta-line">
      <div>{k}</div>
      <div>:</div>
      <div>{v ?? "-"}</div>
    </div>
  );
}

export function LetterDocument(props: LetterDocumentProps) {
  const {
    type,
    nomor,
    payload,
    mahasiswa,
    signer,
    qrUrl,
    verifyUrl,
    isDraft,
    institution,
  } = props;
  const date = props.date ? new Date(props.date) : new Date();
  const title = LETTER_LABEL[type];

  return (
    <div className="print-page shadow-sm border border-slate-200">
      {/* KOP SURAT */}
      <header className="border-b-4 border-double border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={institution?.logo || "/logo-um-metro.png"}
            alt="Logo UM Metro"
            className="w-20 h-20 object-contain shrink-0"
          />
          <div className="text-center flex-1">
            <p className="text-[11px] uppercase tracking-wide">
              Majelis Pendidikan Tinggi Penelitian Dan Pengembangan
            </p>
            <p className="text-[11px] uppercase tracking-wide">
              Pimpinan Pusat Muhammadiyah
            </p>
            <h2 className="text-lg font-bold uppercase">
              Universitas Muhammadiyah Metro
            </h2>
            <h3 className="text-base font-bold uppercase">
              {institution?.nama || "Program Pascasarjana"}
            </h3>
            <p className="text-[11px] text-slate-700">
              {institution?.alamat ||
                "Jl. Ki Hajar Dewantara No. 116, Iringmulyo, Kota Metro, Lampung 34111"}
              {institution?.telp ? ` · Telp. ${institution.telp}` : ""}
            </p>
            <p className="text-[11px] text-slate-700">
              {institution?.website
                ? `Website: ${institution.website}`
                : "Website: pps.ummetro.ac.id"}
              {institution?.email
                ? ` · E-mail: ${institution.email}`
                : " · E-mail: pps@ummetro.ac.id"}
            </p>
          </div>
        </div>
      </header>

      {/* NOMOR */}
      <div className="mb-3 text-sm">
        <Field k="Nomor" v={nomor || <em>(akan dibuat saat pengesahan)</em>} />
        <Field k="Lampiran" v="-" />
        <Field k="Perihal" v={<strong>{title}</strong>} />
      </div>

      {/* Ditujukan */}
      {payload.ditujukan ? (
        <div className="mt-3 mb-3 text-sm">
          <p>Kepada Yth,</p>
          <p>{String(payload.ditujukan)}</p>
          <p>di Tempat</p>
        </div>
      ) : null}

      <p className="text-sm">
        <em>Assalamu&apos;alaikum Warahmatullahi Wabarakatuh,</em>
      </p>

      <p className="text-sm mt-2">
        Yang bertanda tangan di bawah ini,{" "}
        {ROLE_TITLE[signer?.role || "KAPRODI"] || "Pejabat Berwenang"} Program
        Pascasarjana Universitas Muhammadiyah Metro, dengan ini menerangkan
        bahwa:
      </p>

      <div className="my-3 ml-6 text-sm">
        <Field k="Nama" v={mahasiswa.name} />
        <Field k="NIM" v={mahasiswa.nimNip} />
        <Field k="Program Studi" v={mahasiswa.prodi || "-"} />
        <Field k="Jenjang" v={mahasiswa.jenjang || "S2"} />
        {mahasiswa.angkatan ? (
          <Field k="Angkatan" v={mahasiswa.angkatan} />
        ) : null}
        {mahasiswa.semester ? (
          <Field k="Semester" v={mahasiswa.semester} />
        ) : null}
      </div>

      <LetterBody type={type} payload={payload} mahasiswa={mahasiswa} />

      <p className="text-sm mt-3">
        Demikian surat keterangan ini dibuat untuk dapat dipergunakan
        sebagaimana mestinya.
      </p>
      <p className="text-sm mt-1">
        <em>Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh.</em>
      </p>

      {/* TTD */}
      <div className="ttd">
        <div className="col" />
        <div className="col">
          <p>
            Metro, {formatDate(date)}
            <br />
            {ROLE_TITLE[signer?.role || "KAPRODI"] || "Pejabat Berwenang"},
          </p>
          <div className="my-2 flex items-end gap-3">
            {/* TTD image (if signer uploaded) */}
            <div className="h-20 w-24 flex items-end">
              {signer?.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signer.signatureUrl}
                  alt="TTD"
                  className="h-20 w-auto object-contain"
                />
              ) : null}
            </div>
            {/* QR verifikasi */}
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrUrl} alt="QR Verifikasi" className="w-20 h-20" />
            ) : (
              <div className="w-20 h-20 border border-dashed border-slate-400 grid place-items-center text-[10px] text-slate-400">
                QR
              </div>
            )}
          </div>
          <p className="font-semibold underline">
            {signer?.name || "(Belum ditandatangani)"}
          </p>
          {signer?.nip ? <p>NIP/NIDN: {signer.nip}</p> : null}
        </div>
      </div>

      {isDraft ? (
        <p className="mt-6 text-center text-xs text-red-600 font-semibold">
          DRAFT / PRATINJAU — Belum disahkan
        </p>
      ) : verifyUrl ? (
        <p className="mt-6 text-center text-[10px] text-slate-500">
          Dokumen ini ditandatangani secara elektronik. Verifikasi di:{" "}
          {verifyUrl}
        </p>
      ) : null}
    </div>
  );
}

function LetterBody({
  type,
  payload,
}: {
  type: LetterType;
  payload: Record<string, unknown>;
  mahasiswa: MahasiswaInfo;
}) {
  switch (type) {
    case "AKTIF_KULIAH":
      return (
        <p className="text-sm">
          Adalah benar mahasiswa Program Pascasarjana Universitas Muhammadiyah
          Metro yang terdaftar dan aktif kuliah pada{" "}
          <strong>Semester {String(payload.semester || "-")}</strong> Tahun
          Akademik <strong>{String(payload.tahunAkademik || "-")}</strong>.
          Surat keterangan ini diberikan untuk keperluan:{" "}
          <em>{String(payload.keperluan || "-")}</em>.
        </p>
      );
    case "IZIN_PENELITIAN":
      return (
        <div className="text-sm space-y-2">
          <p>
            Bermaksud mengadakan penelitian dalam rangka penyusunan tesis
            dengan rincian:
          </p>
          <div className="ml-6">
            <Field k="Judul Penelitian" v={String(payload.judulPenelitian || "-")} />
            <Field k="Tempat" v={String(payload.tempatPenelitian || "-")} />
            <Field
              k="Periode"
              v={
                <>
                  {String(payload.tanggalMulai || "-")} s/d{" "}
                  {String(payload.tanggalSelesai || "-")}
                </>
              }
            />
          </div>
          <p>
            Sehubungan dengan hal tersebut, kami mohon kiranya Bapak/Ibu
            berkenan memberikan izin kepada mahasiswa tersebut untuk
            melaksanakan penelitian di instansi yang Bapak/Ibu pimpin.
          </p>
        </div>
      );
    case "CUTI_AKADEMIK":
      return (
        <p className="text-sm">
          Mengajukan permohonan cuti akademik untuk{" "}
          <strong>Semester {String(payload.semester || "-")}</strong> Tahun
          Akademik <strong>{String(payload.tahunAkademik || "-")}</strong>{" "}
          dengan alasan: <em>{String(payload.alasan || "-")}</em>.
        </p>
      );
    case "PENGANTAR_SKPI":
      return (
        <div className="text-sm space-y-2">
          <p>
            Mahasiswa tersebut telah dinyatakan lulus dan berhak memperoleh
            Surat Keterangan Pendamping Ijazah (SKPI).
          </p>
          <div className="ml-6">
            {payload.noIjazah ? (
              <Field k="No. Ijazah" v={String(payload.noIjazah)} />
            ) : null}
            <Field k="Tanggal Lulus" v={String(payload.tanggalLulus || "-")} />
          </div>
          <p>
            Kompetensi & kegiatan pendukung yang relevan:{" "}
            <em>{String(payload.kompetensi || "-")}</em>.
          </p>
        </div>
      );
    case "BEBAS_PLAGIASI":
      return (
        <div className="text-sm space-y-2">
          <p>
            Tesis yang bersangkutan telah lulus uji plagiasi dengan rincian:
          </p>
          <div className="ml-6">
            <Field k="Judul Tesis" v={String(payload.judulTesis || "-")} />
            <Field
              k="Persentase Similarity"
              v={`${String(payload.persenSimilarity ?? "-")}%`}
            />
            <Field k="Alat Uji" v={String(payload.alatUji || "-")} />
            <Field k="Tanggal Uji" v={String(payload.tanggalUji || "-")} />
          </div>
        </div>
      );
    default:
      return null;
  }
}
