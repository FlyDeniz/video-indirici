// server.js — ESM (package.json'da "type":"module" ile uyumlu)
import express from "express";
import fetch from "node-fetch";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { URL } from "url";
import dotenv from "dotenv";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const YTDLP_BIN = process.env.YTDLP_BIN || "yt-dlp";
const FFMPEG_BIN = process.env.FFMPEG_BIN || "ffmpeg";

// Beyaz liste
const ENV_ALLOWLIST = (process.env.ALLOWLIST || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const DEFAULT_ALLOWLIST = ["archive.org", "example.com", "data.gov.tr"];
const ALLOWLIST = ENV_ALLOWLIST.length ? ENV_ALLOWLIST : DEFAULT_ALLOWLIST;

// Güvenlik & performans
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));

// Rate limit (IP başına 30 istek/5dk)
const rateLimiter = new RateLimiterMemory({ points: 30, duration: 300 });
app.use(async (req, res, next) => {
  try { await rateLimiter.consume(req.ip); next(); }
  catch { res.status(429).json({ error: "Çok fazla istek. Lütfen biraz bekleyin." }); }
});

// Statik dosyalar
app.use(express.static(path.join(__dirname, "public")));

function isHostAllowed(inputUrl) {
  try {
    const u = new URL(inputUrl);
    return ALLOWLIST.some(allowed => u.hostname === allowed || u.hostname.endsWith(`.${allowed}`));
  } catch { return false; }
}

// Header için güvenli dosya adı üret (ASCII + RFC5987)
function safeFilename(name) {
  const base = path.basename(name)
    .replace(/[\r\n"]/g, "")
    .replace(/[<>:\\|?*\u0000-\u001F]/g, "_");
  const ascii = base.replace(/[^\x20-\x7E]/g, "_");
  return ascii || "download.mp4";
}

app.get("/allowlist", (_, res) => res.json({ allowlist: ALLOWLIST }));

// 1) Beyaz listeli doğrudan dosya indirme
app.post("/download", async (req, res) => {
  try {
    const { url } = req.body || {};
    const attested = req.headers["x-rights-attestation"] === "true";
    if (!url) return res.status(400).json({ error: "URL gerekli." });
    if (!attested) return res.status(412).json({ error: "İndirme hakkını onaylamalısın." });
    if (!isHostAllowed(url)) return res.status(403).json({ error: "Bu alan adı izinli değil." });

    const head = await fetch(url, { method: "HEAD" });
    if (!head.ok) return res.status(400).json({ error: `Kaynağa erişilemedi: ${head.status}` });

    const contentType = head.headers.get("content-type") || "application/octet-stream";
    const fileResp = await fetch(url);
    if (!fileResp.ok) return res.status(400).json({ error: `İndirme hatası: ${fileResp.status}` });

    const srcUrl = new URL(url);
    const cd = fileResp.headers.get("content-disposition");
    const guessedName = (cd && /filename="?([^"]+)"?/i.exec(cd)?.[1]) ||
      srcUrl.pathname.split("/").pop() || "download";

    const asciiName = safeFilename(guessedName);
    const utf8Name = encodeURIComponent(guessedName);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition",
      `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);
    fileResp.body.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
});

// 2) X (Twitter) indirici — sadece localhost
app.post("/download-x", async (req, res) => {
  try {
    const { url } = req.body || {};
    const attested = req.headers["x-rights-attestation"] === "true";
    if (!url) return res.status(400).json({ error: "URL gerekli." });
    if (!attested) return res.status(412).json({ error: "İndirme hakkını onaylamalısın." });

    // Geçici klasör
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
    const outTpl = path.join(tmpDir, "%(uploader)s - %(title).80s [%(id)s].%(ext)s");

    // DÜZELTME: -S (sıralama) ve -f (format) ayrıldı
    const args = [
      url,
      "-o", outTpl,
      "-S", "res:1080,fps,codec:avc",
      "-f", "bv*+ba/best",
      "--no-playlist",
      "--merge-output-format", "mp4",
      "--ffmpeg-location", FFMPEG_BIN
    ];

    const p = spawn(YTDLP_BIN, args, { windowsHide: true });

    let stderr = "";
    p.stderr.on("data", d => { stderr += d.toString(); });

    p.on("close", code => {
      if (code !== 0) {
        console.error("yt-dlp hata:", stderr);
        return res.status(400).json({ error: "İndirme başarısız.", detail: stderr.slice(0, 500) });
      }
      const files = fs.readdirSync(tmpDir).filter(f => !f.endsWith(".part"));
      if (!files.length) return res.status(500).json({ error: "Çıktı dosyası bulunamadı." });
      const filePath = path.join(tmpDir, files[0]);

      const baseName = path.basename(filePath);
      const asciiName = safeFilename(baseName);
      const utf8Name = encodeURIComponent(baseName);

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition",
        `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`);

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on("close", () => {
        try { fs.unlinkSync(filePath); fs.rmdirSync(tmpDir); } catch {}
      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
});

// Sadece localhost dinle
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Downloader running on http://localhost:${PORT}`);
  console.log("İzinli alan adları:", ALLOWLIST.join(", "));
});
