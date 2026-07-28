import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSignedUrl } from "@/lib/storage";

// Selalu dievaluasi per permintaan: hasilnya bergantung pada sesi pemanggil.
export const dynamic = "force-dynamic";

/**
 * Penyaji berkas Storage yang terautentikasi.
 *
 * Dipakai ketika bucket Supabase dijadikan privat
 * (`SUPABASE_STORAGE_PRIVATE="true"`): berkas tidak lagi punya URL publik
 * permanen. Rute ini memeriksa sesi pemanggil terlebih dahulu, lalu
 * meneruskannya ke signed URL berumur pendek (5 menit).
 */
export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } },
) {
  // getCurrentUser() sudah menolak akun nonaktif / terhapus.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Tidak diizinkan. Silakan login kembali." },
      { status: 401 },
    );
  }

  const segments = params.path ?? [];
  const path = segments
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");

  if (!path || path.includes("..")) {
    return NextResponse.json(
      { error: "Path berkas tidak valid." },
      { status: 400 },
    );
  }

  try {
    const signedUrl = await getSignedUrl(path, 60 * 5);
    return NextResponse.redirect(signedUrl, 307);
  } catch {
    return NextResponse.json(
      { error: "Berkas tidak ditemukan." },
      { status: 404 },
    );
  }
}
