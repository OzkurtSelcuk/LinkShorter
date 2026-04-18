const express = require("express");
const Database = require("better-sqlite3");
const { nanoid } = require("nanoid");

const app = express();
const db = new Database("linkler.db");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

db.exec(`
  CREATE TABLE IF NOT EXISTS linkler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uzun_url TEXT NOT NULL,
    kisa_kod TEXT NOT NULL UNIQUE,
    tiklanma INTEGER DEFAULT 0,
    tarih DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.post("/kisalt", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ hata: "URL gerekli" });

  const kod = nanoid(6);
  try {
    db.prepare("INSERT INTO linkler (uzun_url, kisa_kod) VALUES (?, ?)").run(url, kod);
    res.json({ kisa_url: `https://${req.headers.host}/${kod}` });
  } catch (err) {
    res.status(500).json({ hata: "Veritabanı hatası" });
  }
});

app.get("/api/linkler", (req, res) => {
  const satirlar = db.prepare("SELECT * FROM linkler ORDER BY tarih DESC").all();
  res.json(satirlar);
});

app.get("/:kod", (req, res) => {
  const { kod } = req.params;
  const satir = db.prepare("SELECT uzun_url FROM linkler WHERE kisa_kod = ?").get(kod);
  if (!satir) return res.status(404).send("Link bulunamadı");
  db.prepare("UPDATE linkler SET tiklanma = tiklanma + 1 WHERE kisa_kod = ?").run(kod);
  res.redirect(satir.uzun_url);
});

app.delete("/sil/:kod", (req, res) => {
  const { kod } = req.params;
  db.prepare("DELETE FROM linkler WHERE kisa_kod = ?").run(kod);
  res.json({ basari: true });
});

app.listen(3000, () => console.log("Sunucu çalışıyor: http://localhost:3000"));