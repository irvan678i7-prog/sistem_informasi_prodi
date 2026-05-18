# Panduan Setup — Sistem Informasi Prodi (PPs UM Metro)

Project ini memakai arsitektur:

| Komponen     | Layanan                          | Catatan                                  |
| ------------ | -------------------------------- | ---------------------------------------- |
| **Database** | **Neon** (PostgreSQL serverless) | Gratis, isolasi per-project              |
| **Storage**  | **Cloudflare R2** (S3-compatible)| 10 GB gratis, tanpa biaya egress         |
| **Auth**     | Custom JWT + bcrypt              | Built-in di repo, tidak perlu setup      |

> Tidak ada Supabase. Tiap project punya database & storage terpisah → bebas tabrakan.

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

### 2.1 Buat project

1. Buka **https://neon.tech** → Sign up (bisa pakai GitHub/Google).
2. Klik **Create a project**:
   - **Project name**: `sipro-pps-ummetro`
   - **Postgres version**: 16
   - **Region**: terdekat (mis. `Singapore` / `AWS ap-southeast-1`)
   - **Database name**: `neondb`
3. Klik **Create project**.

### 2.2 Ambil connection string

Setelah project dibuat, halaman **Connection Details** muncul.

1. Pilih **Pooled connection** → ini akan jadi `DATABASE_URL`.
   Hostnya mengandung `-pooler`, contoh:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```
2. Matikan toggle "Pooled connection" → ini akan jadi `DIRECT_URL` (tanpa `-pooler`):
   ```
   postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require
   ```

### 2.3 Tempel ke `.env`

Tambahkan parameter `&pgbouncer=true&connect_timeout=15` di akhir `DATABASE_URL`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"
```

### 2.4 Push schema & seed

```bash
npm run db:push     # buat semua tabel di Neon
npm run db:seed     # isi data awal (admin, kaprodi, dosen, mahasiswa)
```

Bila berhasil, terminal akan menampilkan kredensial seed:

```
Admin Sistem : admin@ummetro.ac.id / admin12345
Direktur     : direktur@ummetro.ac.id / direktur12345
Kaprodi MMP  : kaprodi.mmp@ummetro.ac.id / kaprodi12345
Dosen 1      : dosen1@ummetro.ac.id / dosen12345
Mahasiswa 1  : mhs1@ummetro.ac.id / mahasiswa12345
```

> **Wajib** ganti semua password default setelah login pertama.

---

## 3. Setup Storage — Cloudflare R2

R2 = layanan storage S3-compatible dari Cloudflare. **10 GB gratis selamanya** dan **bandwidth gratis tanpa batas** (tidak ada biaya egress, beda dengan S3/Supabase).

### 3.1 Aktifkan R2

1. Buka **https://dash.cloudflare.com** → Sign up (gratis).
2. Di sidebar pilih **R2 Object Storage**.
3. Cloudflare akan minta verifikasi (kartu/PayPal). **Tidak ditagih** selama dalam free tier — ini hanya untuk anti-abuse.
4. Klik **Enable R2**.

### 3.2 Buat bucket

1. **R2 → Create bucket**
   - **Name**: `sipro-documents`
   - **Location**: `Asia-Pacific (APAC)` (terdekat dengan user Indonesia)
2. Klik **Create bucket**.

### 3.3 Aktifkan akses publik (r2.dev)

Karena URL file disimpan di database & dilampirkan di surat, bucket perlu bisa dibuka publik.

1. Klik bucket `sipro-documents` yang baru dibuat.
2. Tab **Settings** → **Public access** (kategori "R2.dev subdomain").
3. Klik **Allow Access** → ketik konfirmasi → **Allow**.
4. Catat URL yang muncul, contoh:
   ```
   https://pub-abc123def456.r2.dev
   ```
   URL ini akan jadi `R2_PUBLIC_BASE_URL`.

> **Opsional**: kamu bisa pasang custom domain (mis. `https://files.sipro.ummetro.ac.id`) di tab **Settings → Custom Domains**. Setelahnya, ganti `R2_PUBLIC_BASE_URL` dengan URL custom domain itu.

### 3.4 Buat API token

1. Sidebar **R2 → Manage R2 API Tokens** → **Create User API Token**.
2. Konfigurasi:
   - **Token name**: `sipro-app`
   - **Permissions**: **Object Read & Write**
   - **Specify bucket(s)**: pilih `sipro-documents` (bukan all buckets)
   - **TTL**: Forever
3. Klik **Create API Token**.
4. Halaman akan menampilkan kredensial **SEKALI** — segera salin:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`

### 3.5 Ambil Account ID

Di sidebar **R2 Object Storage**, sebelah kanan ada panel "**Account ID**".
Salin → masukkan ke `R2_ACCOUNT_ID`.

### 3.6 Lengkapi `.env`

```env
R2_ACCOUNT_ID="abc123abc123abc123abc123"
R2_ACCESS_KEY_ID="<access-key-id>"
R2_SECRET_ACCESS_KEY="<secret-access-key>"
R2_BUCKET_NAME="sipro-documents"
R2_PUBLIC_BASE_URL="https://pub-abc123def456.r2.dev"
```

---

## 4. Konfigurasi Lainnya

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"   # ganti saat deploy
JWT_SECRET="<generate dengan: openssl rand -base64 48>"

ADMIN_EMAIL="admin@ummetro.ac.id"
ADMIN_PASSWORD="ChangeMe!Strong123"
```

Generate JWT secret yang aman:

```bash
openssl rand -base64 48
```

---

## 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka **http://localhost:3000**, login pakai kredensial seed.

---

## 6. Cek Setup Berhasil

| Cek                         | Cara                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| Database Neon terhubung     | `npx prisma studio` → tabel & seed data tampil                        |
| Storage R2 terhubung        | Mahasiswa upload revisi tesis → file masuk ke bucket `sipro-documents` |
| Auth bekerja                | Login / logout tanpa error                                            |

---

## 7. Deploy ke Vercel

1. Push repo ke GitHub.
2. **https://vercel.com/new** → import repo.
3. Tahap **Environment Variables**: salin **semua** isi `.env` ke Vercel.
4. Ubah `NEXT_PUBLIC_APP_URL` ke domain production.
5. Klik **Deploy**.
6. Setelah deploy berhasil, jalankan dari lokal (sekali saja, terhubung ke Neon production):
   ```bash
   npm run db:push
   npm run db:seed   # hanya jika belum pernah seed
   ```

---

## 8. Troubleshooting

### `Error: P1001 Can't reach database server`
- Cek `DATABASE_URL` & `DIRECT_URL` benar (host `-pooler` vs direct).
- Pastikan `?sslmode=require` ada di kedua URL.
- Neon free plan auto-suspend setelah idle. Coba ulangi request — branch akan resume otomatis (~1 detik).

### `Cannot access R2 bucket "..."`
- Cek `R2_BUCKET_NAME` benar (case-sensitive).
- Cek API token punya permission **Object Read & Write** untuk bucket itu (bukan token yang dibatasi ke bucket lain).
- Cek `R2_ACCOUNT_ID` benar (32 karakter hex).

### `R2_PUBLIC_BASE_URL is not set`
- Pastikan kamu sudah aktifkan **R2.dev subdomain** di Settings → Public Access bucket, lalu salin URL `https://pub-...r2.dev` ke env.

### File ter-upload tapi 404 saat dibuka
- Pastikan **Public access** bucket sudah **Allow** (bukan Block).
- Cek URL di DB persis = `R2_PUBLIC_BASE_URL` + `/key`.

---

## 9. Checklist Akhir

- [ ] `.env` terisi `DATABASE_URL`, `DIRECT_URL` (Neon, dengan `sslmode=require`)
- [ ] `.env` terisi semua `R2_*` (Cloudflare R2)
- [ ] Bucket R2 punya **Public Access = Allowed** (atau custom domain)
- [ ] `JWT_SECRET` di-generate ulang
- [ ] `npm run db:push` sukses
- [ ] `npm run db:seed` sukses
- [ ] `npm run dev` jalan & login berhasil
- [ ] Upload revisi → file muncul di bucket R2
- [ ] Password default semua user sudah diganti
