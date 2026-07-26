import { prisma } from "./prisma";

/**
 * Ambil nomor urut berikutnya untuk sebuah "seri" penomoran (mis. SK per tahun,
 * surat per tipe per tahun) secara ATOMIK.
 *
 * Counter disimpan di tabel AppSetting (kolom `value` JSON berisi angka). Satu
 * pernyataan `INSERT ... ON CONFLICT DO UPDATE` membuat Postgres mengunci baris
 * counter, sehingga dua request bersamaan TIDAK PERNAH mendapat angka yang sama
 * — inilah yang menutup race condition pada penomoran surat/SK (dua Kaprodi
 * menandatangani di saat yang sama tidak lagi bisa menghasilkan nomor kembar).
 *
 * `seed` hanya dipakai SAAT counter pertama kali dibuat, agar penomoran
 * melanjutkan dari jumlah dokumen yang sudah ada (mis. hasil count tahun
 * berjalan) alih-alih mulai dari 1. Pada pemanggilan berikutnya seed diabaikan.
 *
 * Mengembalikan `null` bila query gagal, supaya pemanggil bisa fallback ke
 * mekanisme lama (`count + 1`). Dengan begitu proses tanda tangan tetap jalan
 * walau ada masalah tak terduga pada counter.
 */
export async function nextSequence(
  key: string,
  seed = 0,
): Promise<number | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ seq: number }>>`
      INSERT INTO "AppSetting" ("key", "value", "updatedAt")
      VALUES (${key}, to_jsonb(${seed + 1}::int), now())
      ON CONFLICT ("key") DO UPDATE
        SET "value" = to_jsonb(((("AppSetting"."value")::text)::int) + 1),
            "updatedAt" = now()
      RETURNING ((("value")::text)::int) AS seq
    `;
    const seq = Number(rows?.[0]?.seq);
    return Number.isFinite(seq) && seq > 0 ? seq : null;
  } catch (err) {
    console.error(`[nextSequence] gagal untuk key="${key}", fallback:`, err);
    return null;
  }
}
