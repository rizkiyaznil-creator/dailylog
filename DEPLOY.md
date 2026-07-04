# Deploy ke Vercel + Neon + Vercel Blob

Panduan deploy DailyLog gratis. Total biaya untuk mulai: **$0** (free tier).

Kamu butuh 2 akun: **Vercel** (hosting) dan **Neon** (Postgres). Vercel Blob
(storage) ada di dalam akun Vercel.

---

## 1. Siapkan database di Neon

1. Buat akun di https://neon.tech → **New Project**.
2. Setelah proyek dibuat, buka **Connection Details**.
3. Salin **dua** connection string:
   - **Pooled** (ada kata `-pooler` di host) → untuk `DATABASE_URL`
   - **Direct** (tanpa `-pooler`) → untuk `DIRECT_URL`
   Keduanya diakhiri `?sslmode=require`.

## 2. Terapkan skema ke Neon

Dari komputermu (sekali saja), jalankan migrasi memakai koneksi **direct**:

```bash
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
```

(Atau isi `.env` lalu jalankan `npm run db:deploy`.)

## 3. Import proyek ke Vercel

1. Push kode ke GitHub (branch mana pun; default `main`).
2. Di https://vercel.com → **Add New… → Project** → pilih repo `dailylog`.
3. Framework otomatis terdeteksi **Next.js**. Jangan deploy dulu — set env dulu (langkah 4–5).

## 4. Buat Blob store (storage file)

1. Di dashboard proyek Vercel → tab **Storage** → **Create Database** → **Blob**.
2. Hubungkan ke proyek. Vercel otomatis menambахkan env `BLOB_READ_WRITE_TOKEN`.
   (Tidak perlu menyalin manual.)

## 5. Set Environment Variables di Vercel

Project → **Settings → Environment Variables**, tambahkan:

| Nama | Nilai |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string |
| `DIRECT_URL` | Neon **direct** connection string |
| `AUTH_SECRET` | hasil `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `ENCRYPTION_KEY` | hasil `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

`BLOB_READ_WRITE_TOKEN` sudah otomatis dari langkah 4.

> ⚠️ **Simpan `ENCRYPTION_KEY` baik-baik.** Jika hilang/berubah, API key user yang
> sudah tersimpan tidak bisa didekripsi lagi.

## 6. Deploy

Klik **Deploy**. Build menjalankan `prisma generate && next build`.
Setelah selesai, buka URL yang diberikan Vercel → daftar akun → mulai mencatat.

---

## Catatan

- **Migrasi berikutnya:** setelah mengubah `schema.prisma`, buat migrasi baru
  (`npx prisma migrate dev` di lokal), commit, lalu jalankan `npm run db:deploy`
  ke Neon sebelum/sesudah deploy.
- **File lama (lokal):** upload yang dibuat saat dev tersimpan di `./uploads`
  dan tidak ikut ke produksi. Di produksi semua upload masuk Vercel Blob otomatis.
- **Komersial:** Vercel Hobby untuk penggunaan personal/non-komersial. Untuk
  komersial, upgrade ke Vercel Pro dan pertimbangkan Neon paid.
- **Alternatif storage:** untuk file yang membesar, Cloudflare R2 (10 GB gratis,
  tanpa biaya egress) bisa menggantikan Vercel Blob dengan sedikit perubahan pada
  `src/lib/storage.ts`.

## Pengembangan lokal (Postgres)

```bash
docker compose up -d          # Postgres lokal di :5432
cp .env.example .env          # isi AUTH_SECRET & ENCRYPTION_KEY
npx prisma migrate deploy     # terapkan skema
npm run dev
```

Tanpa `BLOB_READ_WRITE_TOKEN`, upload tersimpan lokal di `./uploads`.
