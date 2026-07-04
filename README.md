# 📔 DailyLog

Aplikasi web untuk mencatat aktivitas harian (teks, suara, gambar) dan
mengubahnya menjadi **laporan mingguan** yang rapi dengan analisis — bisa
di-export ke Markdown.

## Fitur

- 🔐 **Multi-user** dengan login (email + password)
- ✍️ **Catatan harian** berupa teks bebas, rekaman suara (→ transkripsi), dan gambar
- 📊 **Laporan mingguan**: ringkasan rapi per tanggal + analisis statistik & narasi AI
- 📤 **Export Markdown**
- 🔑 **BYOK (Bring Your Own Key)** — tiap user memakai API key sendiri.
  Tanpa key, fitur AI memakai mock dan laporan tetap jalan dengan analisis statistik.

## Teknologi

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Prisma** + **Postgres** (Neon di produksi, Docker di lokal)
- **Vercel Blob** untuk penyimpanan gambar/audio (lokal: folder `./uploads`)
- **Auth.js (NextAuth v5)** — sesi JWT, provider credentials
- API key user disimpan **terenkripsi (AES-256-GCM)**

## Setup (lokal)

Butuh **Postgres**. Cara termudah: Docker.

```bash
npm install

# 1. Jalankan Postgres lokal
docker compose up -d

# 2. Siapkan variabel lingkungan
cp .env.example .env
# lalu isi AUTH_SECRET dan ENCRYPTION_KEY:
node -e "console.log('AUTH_SECRET='+require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('ENCRYPTION_KEY='+require('crypto').randomBytes(32).toString('hex'))"

# 3. Terapkan skema
npx prisma migrate deploy

# 4. Jalankan
npm run dev
```

Buka http://localhost:3000 — daftar akun, lalu isi API key di **Pengaturan**
untuk mengaktifkan fitur AI. Tanpa `BLOB_READ_WRITE_TOKEN`, upload tersimpan
lokal di `./uploads`.

## Deploy

Lihat **[DEPLOY.md](./DEPLOY.md)** untuk panduan deploy gratis ke
**Vercel + Neon (Postgres) + Vercel Blob**.

## Peta jalan pengembangan

- [x] **Fase 1 — Fondasi**: setup, auth (daftar/login), pengaturan BYOK terenkripsi
- [x] **Fase 2 — Daily Log**: buat/edit/hapus catatan (teks, gambar, suara→teks)
- [x] **Fase 3 — Laporan Mingguan**: kelompok per minggu, analisis statistik + narasi AI (Claude), export Markdown
- [x] **Fase 4 — Poles**: render Markdown, navigasi responsif, loading state
- [x] **Fase 5 — Cloud-ready**: Postgres (Neon), upload ke Vercel Blob, panduan deploy
