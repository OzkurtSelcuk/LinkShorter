const express = require("express");
const { nanoid } = require("nanoid");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

let linkler = [];

app.post("/kisalt", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ hata: "URL gerekli" });

  const kod = nanoid(6);
  linkler.unshift({ id: Date.now(), uzun_url: url, kisa_kod: kod, tiklanma: 0 });

  // Render için dinamik protokol ve host tespiti
  const protokol = req.headers['x-forwarded-proto'] || 'http';
  const kisa_url = `${protokol}://${req.headers.host}/${kod}`;
  
  res.json({ kisa_url });
});

app.get("/api/linkler", (req, res) => {
  res.json(linkler);
});

app.delete("/sil/:kod", (req, res) => {
  linkler = linkler.filter(l => l.kisa_kod !== req.params.kod);
  res.json({ basari: true });
});

app.get("/:kod", (req, res) => {
  const link = linkler.find(l => l.kisa_kod === req.params.kod);
  if (!link) return res.status(404).send("Link bulunamadı");
  link.tiklanma++;
  res.redirect(link.uzun_url);
});

app.listen(port, () => console.log(`Sunucu aktif: Port ${port}`));