import { useEffect, useMemo, useState } from "react";

const fmtRp = (n) => (n == null || isNaN(n) ? "-" : "Rp" + Number(n).toLocaleString("id-ID"));

export default function App() {
  const [products, setProducts] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [retailer, setRetailer] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState(1);

  useEffect(() => {
    fetch("/data/harga-data.json")
      .then((r) => r.json())
      .then(setProducts)
      .catch((err) => setError(err.message));
  }, []);

  const categories = useMemo(
    () => [...new Set((products || []).map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );
  const retailers = useMemo(
    () => [...new Set((products || []).map((p) => p.retailer).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    let list = products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(search.toLowerCase()) &&
        (!category || p.category === category) &&
        (!retailer || p.retailer === retailer)
    );
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" || typeof bv === "number") {
        return ((av || 0) - (bv || 0)) * sortDir;
      }
      return String(av).localeCompare(String(bv)) * sortDir;
    });
    return list;
  }, [products, search, category, retailer, sortKey, sortDir]);

  const lastUpdated = useMemo(() => {
    if (!products || products.length === 0) return null;
    const times = products.map((p) => p.scrapedAt).filter(Boolean).sort();
    return times[times.length - 1];
  }, [products]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => -d);
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <h1>💰 Bandingkan Harga</h1>
        <p className="subtitle">
          Data harga dari berbagai retailer (Alfamart, Indomaret, Superindo, dll), diambil dari
          hemat.id{lastUpdated ? ` — terakhir update ${new Date(lastUpdated).toLocaleString("id-ID")}` : ""}
        </p>
      </header>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={retailer} onChange={(e) => setRetailer(e.target.value)}>
          <option value="">Semua retailer</option>
          {retailers.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="state-message">Gagal memuat data: {error}</div>}
      {!error && products === null && <div className="state-message">Memuat data...</div>}
      {!error && products !== null && filtered.length === 0 && (
        <div className="state-message">
          {products.length === 0
            ? "Belum ada data. Tunggu GitHub Action pertama selesai jalan."
            : "Produk tidak ditemukan."}
        </div>
      )}

      {filtered.length > 0 && (
        <table>
          <thead>
            <tr>
              <th onClick={() => toggleSort("name")}>Produk</th>
              <th onClick={() => toggleSort("retailer")}>Dijual Di</th>
              <th onClick={() => toggleSort("price")}>Harga</th>
              <th onClick={() => toggleSort("category")}>Kategori</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i}>
                <td>
                  {p.link ? (
                    <a href={p.link} target="_blank" rel="noreferrer">
                      {p.name}
                    </a>
                  ) : (
                    p.name
                  )}
                </td>
                <td>
                  <span className="badge">{p.retailer || "-"}</span>
                </td>
                <td>
                  <div className="price">{fmtRp(p.price)}</div>
                  {p.pricePerUnit ? <div className="unit-price">{fmtRp(p.pricePerUnit)} /unit</div> : null}
                </td>
                <td>{p.category || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <footer className="footer">
        Data diperbarui otomatis tiap 6 jam lewat GitHub Actions. Sumber: hemat.id
      </footer>
    </div>
  );
}
