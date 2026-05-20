# Panduan Setup — Sistem Informasi Prodi (PPs UM Metro)

Project ini memakai **satu project Supabase** untuk dua kebutuhan:

| Komponen     | Layanan                          | Catatan                              |
| ------------ | -------------------------------- | ------------------------------------ |
| **Database** | **Supabase Postgres**            | Pooled connection (Transaction mode) |
| **Storage**  | **Supabase Storage**             | Bucket `documents` (auto-create)     |
| **Auth**     | Custom JWT + bcrypt              | Sudah built-in, tidak perlu setup    |

> Database dan storage cukup memakai **satu project Supabase** yang sama.

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

## 2. Buat Project Supabase

1. Buka **https://supabase.com/dashboard** → klik **New project**.
2. Isi form:
   - **Name**: `sipro-pps-ummetro`
   - **Database password**: simpan baik-baik, akan dipakai untuk connection string
   - **Region**: pilih yang terdekat (mis. `Southeast Asia (Singapore)`)
   - **Pricing plan**: Free
3. Klik **Create new project** → tunggu ~1 menit hingga project siap.

---

## 3. Setup Database

### 3.1 Ambil Connection String

Pada project Supabase yang baru dibuat → menu **Project Settings** (ikon gerigi) → **Database** → bagian **Connection string**:

1. Pilih tab **URI** dan mode **Transaction** (port `6543`).
   String ini menjadi **`DATABASE_URL`** (dipakai runtime). Formatnya:
   ```
   postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
   ```
2. Pilih mode **Session** atau scroll ke **Direct connection** (port `5432`, host `db.<ref>.supabase.co`).
   String ini menjadi **`DIRECT_URL`** (dipakai `prisma migrate` / `db push`). Formatnya:
   ```
   postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
   ```

> Cara mudah membedakan: **DATABASE_URL** memakai host `pooler.supabase.com:6543`,
> **DIRECT_URL** memakai host `db.<ref>.supabase.co:5432`.

### 3.2 Tambahkan ke `.env`

Tambahkan parameter `?pgbouncer=true&connection_limit=1` di akhir `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
```

> Ganti `PROJECT_REF`, `PASSWORD`, dan `REGION` dengan nilai dari dashboard Supabase Anda.

### 3.3 Push Schema & Seed Data

```bash
npm run db:push     # buat semua tabel di Supabase (sesuai prisma/schema.prisma)
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

## 4. Setup Storage

Storage memakai **project Supabase yang sama** dengan database di atas. Tidak perlu membuat project baru.

### 4.1 Ambil API Keys

Pada project Supabase → **Project Settings** (ikon gerigi) → **API**:

- **Project URL** → `SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_URL`
- **Project API keys → `anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project API keys → `service_role` `secret`** → `SUPABASE_SERVICE_ROLE_KEY`
  > Service role key bersifat rahasia. JANGAN expose ke client.

### 4.2 Tambahkan ke `.env`

```env
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_STORAGE_BUCKET="documents"
```

> Bucket `documents` akan dibuat **otomatis** saat upload pertama, kamu tidak perlu membuat bucket manual.

---

## 5. Konfigurasi Lainnya

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

## 6. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:3000

Login dengan kredensial seed di atas.

---

## 7. Cek Setup Berhasil

| Cek                        | Cara                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| Database Supabase terhubung| `npx prisma studio` → seharusnya tampil semua tabel & seed data.     |
| Storage Supabase terhubung | Buat surat baru → upload PDF → cek di **Supabase → Storage → documents**. |
| Auth bekerja               | Login & logout tanpa error.                                          |

---

## 8. Deploy ke Production (Vercel)

Project ini sudah dilengkapi `vercel.json` (preset Next.js, region `sin1` / Singapore agar dekat dengan Supabase Southeast Asia).

### 8.1 Opsi A — Lewat Vercel Dashboard (UI)

1. Push repo ke GitHub.
2. Buka **https://vercel.com/new** → **Import** repo `sistem_informasi_prodi`.
3. **Framework Preset**: pilih **Next.js** (otomatis terdeteksi).
4. Pada tahap **Environment Variables**, tambahkan **semua** variabel berikut (salin nilainya dari `.env` lokal Anda):

   | Key                              | Catatan                                                                       |
   | -------------------------------- | ----------------------------------------------------------------------------- |
   | `DATABASE_URL`                   | Pooled, port `6543`, **wajib** `?pgbouncer=true&connection_limit=1`           |
   | `DIRECT_URL`                     | Direct, port `5432` — dipakai `prisma migrate` / `db push`                    |
   | `SUPABASE_URL`                   | `https://<project-ref>.supabase.co`                                           |
   | `SUPABASE_SERVICE_ROLE_KEY`      | Service role secret. **Jangan** expose ke client.                             |
   | `NEXT_PUBLIC_SUPABASE_URL`       | Sama dengan `SUPABASE_URL`                                                    |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Anon public key                                                               |
   | `SUPABASE_STORAGE_BUCKET`        | `documents` (atau bebas)                                                      |
   | `JWT_SECRET`                     | Generate: `openssl rand -base64 48`                                           |
   | `NEXT_PUBLIC_APP_URL`            | Domain production, mis. `https://sipro.vercel.app`                            |
   | `ADMIN_EMAIL`                    | Email admin default (dipakai script seed)                                     |
   | `ADMIN_PASSWORD`                 | Password admin default (dipakai script seed)                                  |

   > Pastikan ke-empat scope `Production`, `Preview`, `Development` dicentang untuk variabel yang dipakai semua environment.
5. Klik **Deploy**.
6. Setelah deploy berhasil, jalankan **schema push** sekali dari lokal (build Vercel hanya menjalankan `prisma generate`, bukan `db push`):
   ```bash
   # pastikan .env lokal Anda mengarah ke project Supabase production
   npm run db:push
   npm run db:seed   # hanya jika belum pernah seed
   ```
7. Buka URL Vercel Anda → login dengan kredensial dari output seed.

### 8.2 Opsi B — Lewat Vercel CLI (lebih cepat)

```bash
# 1. Install CLI dan login (kalau belum)
npm i -g vercel
vercel login

# 2. Link repo lokal ke project Vercel
cd sistem_informasi_prodi
vercel link            # ikuti prompt: pilih scope & beri nama project, mis. sipro

# 3. Tarik env yang sudah ada di Vercel (jika ada)
vercel env pull .env.production

# 4. Tambahkan env baru (ulangi untuk setiap variabel di tabel 8.1)
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_STORAGE_BUCKET production
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PASSWORD production

# 5. Deploy ke production
vercel deploy --prod

# 6. Push schema & seed (dari lokal, mengarah ke Supabase production)
npm run db:push
npm run db:seed
```

### 8.3 Custom Domain (opsional)

1. Vercel Dashboard → project → **Settings → Domains** → **Add Domain**.
2. Ikuti instruksi DNS (CNAME/A record).
3. Setelah domain aktif, **update** env var `NEXT_PUBLIC_APP_URL` ke domain baru lalu **Redeploy**.

---

## 9. Troubleshooting

### `Error: P1001 Can't reach database server`
- Cek `DATABASE_URL` & `DIRECT_URL` benar (perhatikan host `pooler.supabase.com:6543` vs `db.<ref>.supabase.co:5432`).
- Pastikan password URL-encoded jika mengandung karakter spesial.
- Cek di **Supabase Dashboard → Project Settings → Database** apakah project tidak dalam keadaan paused (free tier auto-pause setelah idle 7 hari).

### `prisma migrate` / `db push` gagal di pooled connection
- `prisma migrate` & `db push` **wajib** memakai `DIRECT_URL` (port `5432`, bukan pooler). Pastikan `directUrl = env("DIRECT_URL")` ada di `prisma/schema.prisma` dan `DIRECT_URL` di `.env` terisi benar.

### Vercel: deploy sukses tapi runtime error `prepared statement "sX" already exists` / `P05`
- Penyebab: `DATABASE_URL` tidak memakai mode pooler (`?pgbouncer=true&connection_limit=1`).
- Cek di Vercel → Project → Settings → Environment Variables, pastikan `DATABASE_URL` memakai host `pooler.supabase.com:6543` dan diakhiri `?pgbouncer=true&connection_limit=1`.

### Vercel: `Error: P1001 Can't reach database` atau IPv6/network error
- Beberapa project Supabase lama hanya menyediakan koneksi IPv6 langsung; pakailah connection string **Pooler** (port 6543) yang sudah IPv4-compatible.
- Free tier Supabase auto-pause setelah idle 7 hari → buka dashboard untuk meng-unpause.

### `Supabase env not configured`
- `.env` belum lengkap. Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` terisi.

### `Failed to create Supabase bucket`
- Cek `SUPABASE_SERVICE_ROLE_KEY` benar (bukan `anon` key).
- Cek di Supabase Dashboard → Storage, hapus bucket gagal lalu retry.

---

## 10. Checklist Akhir

- [ ] `.env` terisi `DATABASE_URL` (pooled) & `DIRECT_URL` (direct) dari Supabase
- [ ] `.env` terisi `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `NEXT_PUBLIC_*`
- [ ] `JWT_SECRET` di-generate ulang (jangan pakai default)
- [ ] `npm run db:push` sukses
- [ ] `npm run db:seed` sukses
- [ ] `npm run dev` jalan & login berhasil
- [ ] Upload file → muncul di Supabase Storage bucket `documents`
- [ ] Password default semua user sudah diganti
