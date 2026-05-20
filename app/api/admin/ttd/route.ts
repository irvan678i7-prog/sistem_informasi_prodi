import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadFileToSupabase } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "KAPRODI")
    return NextResponse.json({ message: "Tidak diizinkan" }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  const file = form.get("file");
  const key = String(form.get("key") || "ttd.kaprodi.image");

  if (!(file instanceof File))
    return NextResponse.json({ message: "File tidak ada" }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type))
    return NextResponse.json(
      { message: "Format harus PNG/JPG/WEBP/SVG" },
      { status: 400 },
    );
  if (file.size > MAX_SIZE)
    return NextResponse.json(
      { message: "Ukuran maks 2 MB" },
      { status: 400 },
    );
  if (!key.startsWith("ttd.") && key !== "institusi.logo")
    return NextResponse.json(
      { message: "Key tidak diizinkan" },
      { status: 400 },
    );

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const folder = key === "institusi.logo" ? "branding" : "ttd";
  const path = `${folder}/${key.replace(/\./g, "_")}-${Date.now()}.${ext}`;

  const uploaded = await uploadFileToSupabase(path, file);

  await prisma.appSetting.upsert({
    where: { key },
    update: { value: uploaded.url },
    create: { key, value: uploaded.url },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.uid,
      action: key === "institusi.logo" ? "LOGO_UPLOAD" : "TTD_UPLOAD",
      entity: "AppSetting",
      entityId: key,
      metadata: { url: uploaded.url, size: uploaded.size },
    },
  });

  return NextResponse.json({ ok: true, url: uploaded.url });
}
