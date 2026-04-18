const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { nanoid } = require("nanoid");

const app = express();
const db = new sqlite3.Database("linkler.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Veritabanı tablosunu oluştur
db.run(`
  CREATE TABLE IF NOT EXISTS linkler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uzun_url TEXT NOT NULL,
    kisa_kod TEXT NOT NULL UNIQUE,
    tiklanma INTEGER DEFAULT 0,
    tarih DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Kısalt
app.post("/kisalt", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ hata: "URL gerekli" });

  const kod = nanoid(6);
  db.run(
    "INSERT INTO linkler (uzun_url, kisa_kod) VALUES (?, ?)",
    [url, kod],
    (err) => {
      if (err) return res.status(500).json({ hata: "Veritabanı hatası" });
      res.json({ kisa_url: `http://localhost:3000/${kod}` });
    }
  );
});
// Sil
app.delete("/sil/:kod", (req, res) => {
  const { kod } = req.params;
  db.run("DELETE FROM linkler WHERE kisa_kod = ?", [kod], (err) => {
    if (err) return res.status(500).json({ hata: "Silinemedi" });
    res.json({ basari: true });
  });
});

// Yönlendir
app.get("/:kod", (req, res) => {
  const { kod } = req.params;
  db.get(
    "SELECT uzun_url FROM linkler WHERE kisa_kod = ?",
    [kod],
    (err, satir) => {
      if (!satir) return res.status(404).send("Link bulunamadı");
      db.run("UPDATE linkler SET tiklanma = tiklanma + 1 WHERE kisa_kod = ?", [kod]);
      res.redirect(satir.uzun_url);
    }
  );
});

// Tüm linkleri listele
app.get("/api/linkler", (req, res) => {
  db.all("SELECT * FROM linkler ORDER BY tarih DESC", (err, satirlar) => {
    res.json(satirlar);
  });
});

app.listen(3000, () => console.log("Sunucu çalışıyor: http://localhost:3000"));