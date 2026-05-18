# Panduan Setup — Sistem Informasi Prodi (PPs UM Metro)

Project ini sekarang memakai arsitektur:

| Komponen     | Layanan                          | Catatan                              |
| ------------ | -------------------------------- | ------------------------------------ |
| **Database** | **Neon** (PostgreSQL serverless) | Gratis, isolasi per-project          |
| **Storage**  | **Supabase Storage**             | Project Supabase BARU, terpisah      |
| **Auth**     | Custom JWT + bcrypt              | Sudah built-in, tidak perlu setup    |

> Database dan storage **dipisah** agar tidak tabrakan dengan aplikasi lain.

---

## 1. Persiapan Lokal

```bash
git clone <repo-url>
cd sistem_informasi_prodi
npm install
cp .env.example .env
```

Edit `.env` mengikuti langkah-langkah di bawah.

---

## 2. Setup Database — Neon

### 2.1 Daftar & Buat Project

1. Buka **https://neon.tech** → klik **Sign up** (bisa pakai GitHub/Google).
2. Setelah login, klik **Create a project**.
3. Isi form:
   - **Project name**: `sipro-pps-ummetro`
   - **Postgres version**: 16 (default)
   - **Region**: pilih yang terdekat (mis. `Singapore` / `AWS ap-southeast-1`)
   - **Database name**: `neondb` (default oke)
4. Klik **Create project**.

### 2.2 Ambil Connection String

Setelah project dibuat, Neon menampilkan halaman **Connection Details**:

1. Pilih dropdown **Connection string** → **Pooled connection**.
   Connection string ini akan jadi `DATABASE_URL`.
   Formatnya seperti:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```
2. Pilih dropdown **Connection string** → **Direct connection** (matikan toggle "Pooled connection").
   Connection string ini akan jadi `DIRECT_URL`. Formatnya:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require
   ```

> Cara mudah membedakan: hostname **DATABASE_URL** mengandung `-pooler`,
> sedangkan **DIRECT_URL** TIDAK mengandung `-pooler`.

### 2.3 Tambahkan ke `.env`

Tambahkan parameter `&pgbouncer=true&connect_timeout=15` di akhir `DATABASE_URL`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"
```

### 2.4 Push Schema & Seed Data

```bash
npm run db:push     # buat semua tabel di Neon (sesuai prisma/schema.prisma)
npm run db:seed     # isi data awal (admin, kaprodi, dosen, mahasiswa contoh)
```

Bila berhasil, terminal akan menampilkan kredensial login:

```
Admin Sistem : admin@ummetro.ac.id / admin12345
Direktur     : direktur@ummetro.ac.id / direktur12345
Kaprodi MMP  : kaprodi.mmp@ummetro.ac.id / kaprodi12345
Dosen 1      : dosen1@ummetro.ac.id / dosen12345
Mahasiswa 1  : mhs1@ummetro.ac.id / mahasiswa12345
```

> **Wajib**: ganti semua password default di atas setelah login pertama (Admin → Users).

---

## 3. Setup Storage — Supabase (Project BARU)

Karena project Supabase lama tabrakan dengan aplikasi lain, buat project Supabase **baru** yang khusus untuk app ini. Kita **hanya** memakai fitur Storage-nya.

### 3.1 Buat Project Supabase Baru

1. Buka **https://supabase.com/dashboard** → klik **New project**.
2. Isi form:
   - **Name**: `sipro-pps-storage`
   - **Database password**: bebas (tidak akan kita pakai, simpan saja)
   - **Region**: pilih yang sama/terdekat dengan Neon
   - **Pricing plan**: Free
3. Klik **Create new project** → tunggu ~1 menit.

### 3.2 Ambil API Keys

Pada project baru → menu **Project Settings** (ikon gerigi) → **API**:

- **Project URL** → `SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys → `anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project API keys → `service_role` `secret`** → `SUPABASE_SERVICE_ROLE_KEY`
  > Service role key bersifat rahasia. JANGAN expose ke client.

### 3.3 Tambahkan ke `.env`

```env
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_STORAGE_BUCKET="documents"
```

> Bucket `documents` akan dibuat **otomatis** saat upload pertama, kamu tidak perlu membuat bucket manual.

---

## 4. Konfigurasi Lainnya

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"   # ganti saat deploy
JWT_SECRET="<generate dengan: openssl rand -base64 48>"

ADMIN_EMAIL="admin@ummetro.ac.id"
ADMIN_PASSWORD="ChangeMe!Strong123"
```

Generate `JWT_SECRET` yang kuat:

```bash
openssl rand -base64 48
```

---

## 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:3000

Login dengan kredensial seed di atas.

---

## 6. Cek Setup Berhasil

| Cek                       | Cara                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| Database Neon terhubung   | `npx prisma studio` → seharusnya tampil semua tabel & seed data.    |
| Storage Supabase terhubung | Buat surat baru → upload PDF → cek di **Supabase → Storage → documents**. |
| Auth bekerja              | Login & logout tanpa error.                                         |

---

## 7. Deploy ke Production (Vercel)

1. Push repo ke GitHub.
2. Buka **https://vercel.com/new** → import repo.
3. Di tahap **Environment Variables**, salin **semua** isi `.env` ke Vercel.
4. **Penting:** ubah `NEXT_PUBLIC_APP_URL` ke domain production (mis. `https://sipro.ummetro.ac.id`).
5. Klik **Deploy**.
6. Setelah deploy berhasil, jalankan migrate sekali (otomatis sudah lewat `prisma generate` di `build`, tapi schema push perlu di-jalankan dari lokal):
   ```bash
   # dari lokal, terhubung ke Neon production
   npm run db:push
   npm run db:seed   # hanya jika belum pernah seed
   ```

---

## 8. Troubleshooting

### `Error: P1001 Can't reach database server`
- Cek `DATABASE_URL` & `DIRECT_URL` benar (perhatikan host `-pooler` vs direct).
- Pastikan `?sslmode=require` ada di kedua URL.
- Neon free plan auto-suspend setelah idle. Coba ulangi request, suspended branch akan resume otomatis (~1 detik).

### `Supabase env not configured`
- `.env` belum lengkap. Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` terisi.

### `Failed to create Supabase bucket`
- Cek `SUPABASE_SERVICE_ROLE_KEY` benar (bukan `anon` key).
- Cek di Supabase Dashboard → Storage, hapus bucket gagal lalu retry.

### Migrasi data dari Supabase lama ke Neon (opsional)
Jika ada data di project Supabase lama yang ingin dipindah ke Neon:

```bash
# Dump dari Supabase lama
pg_dump "postgresql://postgres.<old-ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  --schema=public --data-only --no-owner --no-privileges \
  -f data.sql

# Restore ke Neon (pakai DIRECT_URL)
psql "postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require" \
  -f data.sql
```

> Lakukan `npm run db:push` di Neon **dulu** sebelum restore data.

---

## 9. Checklist Akhir

- [ ] `.env` terisi `DATABASE_URL`, `DIRECT_URL` (Neon)
- [ ] `.env` terisi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `NEXT_PUBLIC_*`
- [ ] `JWT_SECRET` di-generate ulang (jangan pakai default)
- [ ] `npm run db:push` sukses
- [ ] `npm run db:seed` sukses
- [ ] `npm run dev` jalan & login berhasil
- [ ] Upload file → muncul di Supabase Storage bucket `documents`
- [ ] Password default semua user sudah diganti
