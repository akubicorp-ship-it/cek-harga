/**
 * scraper-hemat.js
 * -----------------------------------------------------------------------
 * Scraping hemat.id: untuk tiap kategori produk, ambil tabel perbandingan
 * harga ("Tabel Harga X Hari Ini") yang formatnya:
 *   Merk | Harga (Rp) | Harga per-unit (Rp) | Dijual Di
 *
 * Tidak perlu Playwright/browser -- situs ini HTML biasa (server-rendered),
 * jadi cukup axios (ambil HTML) + cheerio (parsing, mirip jQuery).
 *
 * CARA PAKAI:
 *   node scraper-hemat.js
 */

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

// ==== KONFIGURASI ====
// Tambah/kurangi slug kategori sesuai kebutuhan. Slug ini persis
// bagian akhir URL https://www.hemat.id/harga/{slug}/
const CATEGORIES = [
  "beras",
  "minyak-goreng",
  "gula-pemanis",
  "susu-uht",
  "mie",
  "kopi",
  "sabun-mandi-cair",
  "shampoo",
  "pasta-gigi",
  "deterjen-cair",
  "popok-celana",
  "daging-ayam",
  "daging-sapi",
  "telur", // contoh tambahan, hapus kalau slug-nya beda/tidak ada
];

const DELAY_MS = 1500; // jeda sopan antar request
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseRupiah(text) {
  if (!text) return null;
  const digits = text.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : null;
}

async function scrapeCategory(slug) {
  const url = `https://www.hemat.id/harga/${slug}/`;
  const { data: html } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
    timeout: 15000,
  });

  const $ = cheerio.load(html);
  const results = [];

  // Cari tabel yang header-nya mengandung "Merk" dan "Dijual Di"
  $("table").each((_, table) => {
    const headerCells = $(table)
      .find("tr")
      .first()
      .find("td, th")
      .map((_, c) => $(c).text().trim())
      .get();

    const isTargetTable =
      headerCells.some((h) => /merk/i.test(h)) &&
      headerCells.some((h) => /dijual/i.test(h));

    if (!isTargetTable) return;

    const rows = $(table).find("tr").slice(1); // skip header
    rows.each((_, row) => {
      const cells = $(row).find("td, th");
      const name = cells.eq(0).text().trim();
      const price = parseRupiah(cells.eq(1).text());
      const pricePerUnit = parseRupiah(cells.eq(2).text());
      const retailer = cells.eq(3).text().trim();
      const link = cells.eq(0).find("a").attr("href") || null;

      if (name) {
        results.push({ name, price, pricePerUnit, retailer, link, category: slug });
      }
    });
  });

  return results;
}

(async () => {
  const allResults = [];

  for (const slug of CATEGORIES) {
    try {
      const items = await scrapeCategory(slug);
      console.log(`"${slug}": ${items.length} produk`);
      for (const item of items) {
        allResults.push({ ...item, scrapedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error(`Gagal untuk "${slug}":`, err.response?.status || err.message);
    }
    await sleep(DELAY_MS);
  }

  fs.mkdirSync("public/data", { recursive: true });
  fs.writeFileSync("public/data/harga-data.json", JSON.stringify(allResults, null, 2));
  console.log(`\nSelesai. ${allResults.length} produk disimpan ke public/data/harga-data.json`);
})();
