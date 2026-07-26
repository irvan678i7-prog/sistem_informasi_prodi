import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "./prisma";
import type { DocumentKind, User } from "@prisma/client";

export function makeDocumentCode(): string {
  // 12-char base32-like uppercase
  return crypto.randomBytes(8).toString("hex").toUpperCase().slice(0, 12);
}

/**
 * Serialisasi JSON yang deterministik: kunci objek diurutkan DI SETIAP LEVEL
 * (rekursif), bukan hanya level teratas.
 *
 * CATATAN BUG LAMA: implementasi sebelumnya memakai
 *   JSON.stringify(payload, Object.keys(payload).sort())
 * di mana argumen kedua (array) bertindak sebagai FILTER nama properti untuk
 * SEMUA level. Akibatnya seluruh objek bersarang (mis. `mahasiswa`, `payload`)
 * ikut terpangkas menjadi `{}` — sehingga hash TIDAK mencakup isi dokumen
 * (nama, NIM, isi surat) sama sekali. Fungsi di bawah memperbaikinya dengan
 * mengurutkan kunci secara rekursif tanpa membuang data apa pun.
 */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (val as Record<string, unknown>)[k];
          return acc;
        }, {});
    }
    return val;
  });
}

export function computeHash(payload: unknown): string {
  return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, scale: 6 });
}

export interface SignDocInput {
  kind: DocumentKind;
  nomor?: string | null;
  payload: Record<string, unknown>;
  signer: Pick<User, "id" | "name" | "role">;
}

export async function signDocument(input: SignDocInput) {
  const code = makeDocumentCode();
  const payload = { ...input.payload, code };
  const hash = computeHash(payload);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const verifyUrl = `${baseUrl}/verify/${code}`;
  const qrUrl = await generateQrDataUrl(verifyUrl);

  const doc = await prisma.signedDocument.create({
    data: {
      code,
      kind: input.kind,
      nomor: input.nomor ?? null,
      hash,
      signerId: input.signer.id,
      signerName: input.signer.name,
      signerRole: input.signer.role,
      payload,
      qrUrl,
    },
  });
  return doc;
}
