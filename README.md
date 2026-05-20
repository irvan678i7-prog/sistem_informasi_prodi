# Sistem Informasi Prodi — PPs UM Metro

Aplikasi internal Program Pascasarjana UM Metro untuk pengelolaan:

- Pengajuan dan penandatanganan surat (aktif kuliah, izin penelitian, cuti, SKPI, bebas plagiasi)
- Alur tesis: judul → proposal → seminar → bimbingan → KUT → sidang → revisi
- SK pembimbing, undangan, berita acara, dengan tanda tangan digital + QR verifikasi
- Notifikasi, audit log, manajemen user & prodi multi-role

## Tech Stack

- **Next.js 14** (App Router, Server Actions)
- **Supabase Postgres** (database + storage dalam satu project)
- **Prisma** ORM
- **Supabase Storage** (bucket `documents`)
- **Custom Auth**: JWT + bcrypt (cookie-based session)
- **Tailwind CSS** + **Lucide Icons**
- **pdf-lib** + **qrcode** untuk pembuatan & verifikasi dokumen

## Quick Start

1. Clone repo & install deps
   ```bash
   git clone <repo-url>
   cd sistem_informasi_prodi
   npm install
   ```
2. Copy & isi env
   ```bash
   cp .env.example .env
   ```
3. Push schema + seed data
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. Run dev server
   ```bash
   npm run dev
   ```

## Setup Lengkap

Untuk panduan setup detail (Supabase Database + Storage) lihat **[SETUP.md](./SETUP.md)**.

## Deploy ke Vercel

Repo sudah dilengkapi `vercel.json` (preset Next.js, region `sin1`). Ringkasan langkah:

1. **Import** repo di https://vercel.com/new → framework Next.js auto-detect.
2. Salin **semua** isi `.env.example` ke **Environment Variables** Vercel (lihat tabel lengkap di [SETUP.md § 8](./SETUP.md#8-deploy-ke-production-vercel)).
3. Pastikan `DATABASE_URL` memakai pooler (`pooler.supabase.com:6543?pgbouncer=true&connection_limit=1`) dan `DIRECT_URL` memakai direct (`db.<ref>.supabase.co:5432`).
4. **Deploy**, lalu dari lokal jalankan sekali: `npm run db:push && npm run db:seed`.
5. Login dengan kredensial yang tampil di output seed (default lihat tabel di bawah).

## Scripts

| Command            | Keterangan                                  |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Jalankan Next.js dev server                 |
| `npm run build`    | Production build (auto run `prisma generate`)|
| `npm run start`    | Jalankan production build                   |
| `npm run lint`     | ESLint                                      |
| `npm run typecheck`| TypeScript check                            |
| `npm run db:push`  | Sync `prisma/schema.prisma` ke database     |
| `npm run db:seed`  | Isi data awal (admin, dosen, mahasiswa)     |

## Default Login (setelah seed)

| Role          | Email                       | Password         |
| ------------- | --------------------------- | ---------------- |
| Admin Sistem  | admin@ummetro.ac.id         | admin12345       |
| Direktur      | direktur@ummetro.ac.id      | direktur12345    |
| Kaprodi       | kaprodi.mmp@ummetro.ac.id   | kaprodi12345     |
| Dosen         | dosen1@ummetro.ac.id        | dosen12345       |
| Mahasiswa     | mhs1@ummetro.ac.id          | mahasiswa12345   |

> **Wajib ganti** semua password default sebelum production.
