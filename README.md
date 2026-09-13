# Bandingkan Harga — React + Vite + Vercel (tanpa WordPress)

Alurnya:
```
GitHub Actions (jadwal tiap 6 jam)
  -> jalankan scraper-hemat.js (axios + cheerio, TANPA browser)
  -> simpan public/data/harga-data.json
  -> commit & push balik ke repo
      -> Vercel otomatis build ulang (npm run build) & re-deploy
          -> Web React kamu online, fetch data dari /data/harga-data.json
```

Web-nya React biasa (Vite), bukan widget yang perlu ditempel ke situs lain — ini situsnya sendiri, langsung deploy ke Vercel.

## Coba jalankan lokal dulu

```bash
npm install
npm run scrape        # jalankan scraper, isi public/data/harga-data.json
npm run dev            # buka http://localhost:5173, cek tampilannya
```

## Struktur project

- `src/App.jsx` — komponen React utama (tabel, search, filter kategori/retailer, sorting).
- `src/App.css` — styling.
- `scraper-hemat.js` — scraper hemat.id (axios + cheerio), sama seperti yang sudah kamu tes, cuma outputnya sekarang ke `public/data/harga-data.json` (biar ikut ke-build sebagai file statis).
- `.github/workflows/update-prices.yml` — jadwal otomatis.

## Langkah 1 — Push ke GitHub

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

## Langkah 2 — Aktifkan izin GitHub Actions untuk commit

Repo GitHub → **Settings → Actions → General → Workflow permissions** → pilih **"Read and write permissions"** → Save.

## Langkah 3 — Deploy ke Vercel

1. [vercel.com](https://vercel.com) → New Project → Import dari GitHub → pilih repo ini.
2. Vercel otomatis mendeteksi ini project **Vite** (framework preset "Vite"). Biarkan default:
   - Build Command: `npm run build` (atau `vite build`)
   - Output Directory: `dist`
3. Deploy. Dapat URL `nama-project.vercel.app` — ini sudah web React lengkap kamu, bukan cuma widget.
4. Custom domain bisa ditambahkan di tab **Domains**.

## Langkah 4 — Jalankan scraping pertama di GitHub

Tab **Actions** di GitHub repo → workflow **"Update Harga Hemat.id"** → **Run workflow** (manual).

Setelah selesai (~15 detik, tanpa perlu install browser), file `public/data/harga-data.json` ter-update & ter-push, Vercel otomatis build ulang (~1 menit) dan situsnya update sendiri.

## Menambah kategori produk

Edit array `CATEGORIES` di `scraper-hemat.js`. Slug kategori bisa dicari di halaman depan https://www.hemat.id/ pada bagian "Harga Terbaik Hari Ini" — slug-nya ada di akhir URL (`/harga/{slug}/`).

## Catatan
- Data ini agregasi promo dari hemat.id (bukan API resmi retailer) — dipakai untuk pribadi/informasional. Cek Terms of Service hemat.id kalau pemakaiannya makin besar/komersial.
- Kalau struktur tabel di hemat.id berubah, bagian pencarian tabel di `scraper-hemat.js` (cari header "Merk" & "Dijual Di") mungkin perlu disesuaikan lagi.
