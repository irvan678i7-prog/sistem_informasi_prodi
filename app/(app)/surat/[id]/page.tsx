import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canHandleLetter, canApproveLetter } from "@/lib/rbac";
import { LETTER_LABEL } from "@/lib/letterTemplates";
import { LetterDocument } from "@/components/letter/LetterDocument";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";
import { LetterActions } from "./LetterActions";

export default async function SuratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const letter = await prisma.letterRequest.findUnique({
    where: { id },
    include: {
      mahasiswa: {
        include: { prodi: true, mahasiswaProfile: true },
      },
      handler: true,
      signedDoc: true,
      timeline: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!letter) notFound();

  // Authorization: mahasiswa can only see own; staff can see if in same prodi or admin sistem
  const isOwner = letter.mahasiswaId === user.id;
  const canView =
    isOwner ||
    user.role === "ADMIN_SISTEM" ||
    (canHandleLetter(user.role) &&
      (!user.prodiId || letter.mahasiswa.prodiId === user.prodiId));
  if (!canView) redirect("/surat");

  const canAct =
    canHandleLetter(user.role) && letter.mahasiswa.prodiId === user.prodiId;

  const payload =
    typeof letter.payload === "object" && letter.payload !== null
      ? (letter.payload as Record<string, unknown>)
      : {};

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-slate-500">
            <Link href="/surat" className="hover:underline">
              ← Persuratan
            </Link>
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            {LETTER_LABEL[letter.type]}
          </h1>
          <p className="text-sm text-slate-500">
            Diajukan {formatDateTime(letter.createdAt)} oleh{" "}
            {letter.mahasiswa.name} ({letter.mahasiswa.nimNip})
          </p>
        </div>
        <StatusBadge status={letter.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pratinjau Surat</CardTitle>
              <CardDescription>
                {letter.signedDoc
                  ? "Sudah disahkan + QR code aktif."
                  : "Belum disahkan. Pratinjau berikut adalah draft."}
              </CardDescription>
            </CardHeader>
            <CardBody>
              <LetterDocument
                type={letter.type}
                nomor={letter.nomor}
                payload={payload}
                date={letter.signedDoc?.signedAt || letter.createdAt}
                mahasiswa={{
                  name: letter.mahasiswa.name,
                  nimNip: letter.mahasiswa.nimNip,
                  prodi: letter.mahasiswa.prodi?.name ?? null,
                  jenjang: letter.mahasiswa.prodi?.jenjang ?? "S2",
                  semester: letter.mahasiswa.mahasiswaProfile?.semester ?? null,
                  angkatan: letter.mahasiswa.mahasiswaProfile?.angkatan ?? null,
                }}
                signer={
                  letter.signedDoc
                    ? {
                        name: letter.signedDoc.signerName,
                        role: letter.signedDoc.signerRole,
                        nip: null,
                      }
                    : null
                }
                qrUrl={letter.signedDoc?.qrUrl}
                verifyUrl={
                  letter.signedDoc
                    ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/verify/${letter.signedDoc.code}`
                    : null
                }
                isDraft={!letter.signedDoc}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle>Aksi</CardTitle>
                <CardDescription>
                  Tindakan tersedia sesuai peran Anda.
                </CardDescription>
              </CardHeader>
              <CardBody>
                <LetterActions
                  id={letter.id}
                  status={letter.status}
                  canApprove={canApproveLetter(user.role)}
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Linimasa</CardTitle>
              <CardDescription>Riwayat status pengajuan</CardDescription>
            </CardHeader>
            <CardBody>
              <ol className="space-y-3">
                {letter.timeline.map((t) => (
                  <li
                    key={t.id}
                    className="flex gap-3 items-start text-sm"
                  >
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{t.stage}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(t.createdAt)}
                      </p>
                      {t.note && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          {t.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          {letter.signedDoc && (
            <Card>
              <CardHeader>
                <CardTitle>QR Verifikasi</CardTitle>
                <CardDescription>
                  Scan untuk verifikasi keaslian
                </CardDescription>
              </CardHeader>
              <CardBody className="text-center space-y-2">
                {letter.signedDoc.qrUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={letter.signedDoc.qrUrl}
                    alt="QR"
                    className="mx-auto w-40 h-40"
                  />
                )}
                <p className="text-xs text-slate-500 break-all">
                  Kode: {letter.signedDoc.code}
                </p>
                <Link
                  href={`/verify/${letter.signedDoc.code}`}
                  className="btn-secondary text-sm w-full"
                  target="_blank"
                >
                  Buka halaman verifikasi
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
