# Sistem Informasi Prodi — PPs UM Metro

Aplikasi internal Program Pascasarjana UM Metro untuk pengelolaan:

- Pengajuan dan penandatanganan surat (aktif kuliah, izin penelitian, cuti, SKPI, bebas plagiasi)
- Alur tesis: judul → proposal → seminar → bimbingan → KUT → sidang → revisi
- SK pembimbing, undangan, berita acara, dengan tanda tangan digital + QR verifikasi
- Notifikasi, audit log, manajemen user & prodi multi-role

## Tech Stack

- **Next.js 14** (App Router, Server Actions)
- **PostgreSQL** di **Neon** (serverless, free tier)
- **Prisma** ORM
- **Cloudflare R2** untuk file storage (S3-compatible, free 10 GB)
- **Custom Auth**: JWT + bcrypt (cookie-based session)
- **Tailwind CSS** + **Lucide Icons**
- **pdf-lib** + **qrcode** untuk pembuatan & verifikasi dokumen

## Quick Start

```bash
git clone <repo-url>
cd sistem_informasi_prodi
npm install
cp .env.example .env       # lalu isi sesuai SETUP.md
npm run db:push
npm run db:seed
npm run dev
```

Panduan setup lengkap (Neon + Cloudflare R2 + deploy): **[SETUP.md](./SETUP.md)**

## Scripts

| Command             | Keterangan                                   |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Jalankan Next.js dev server                  |
| `npm run build`     | Production build (auto run `prisma generate`)|
| `npm run start`     | Jalankan production build                    |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | TypeScript check                             |
| `npm run db:push`   | Sync `prisma/schema.prisma` ke database      |
| `npm run db:seed`   | Isi data awal                                |

## Default Login (setelah seed)

| Role         | Email                       | Password         |
| ------------ | --------------------------- | ---------------- |
| Admin Sistem | admin@ummetro.ac.id         | admin12345       |
| Direktur     | direktur@ummetro.ac.id      | direktur12345    |
| Kaprodi      | kaprodi.mmp@ummetro.ac.id   | kaprodi12345     |
| Dosen        | dosen1@ummetro.ac.id        | dosen12345       |
| Mahasiswa    | mhs1@ummetro.ac.id          | mahasiswa12345   |

> **Wajib ganti** semua password default sebelum production.
