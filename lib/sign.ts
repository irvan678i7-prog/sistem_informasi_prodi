import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "./prisma";
import type { DocumentKind, User } from "@prisma/client";

export function makeDocumentCode(): string {
  // 12-char base32-like uppercase
  return crypto.randomBytes(8).toString("hex").toUpperCase().slice(0, 12);
}

export function computeHash(payload: unknown): string {
  const json = JSON.stringify(payload, Object.keys(payload as object).sort());
  return crypto.createHash("sha256").update(json).digest("hex");
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
