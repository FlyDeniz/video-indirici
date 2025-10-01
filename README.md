# 🎥 Video İndirici (Reklamsız)

TikTok ve Twitter (X) platformlarından reklamsız video indirmeyi sağlayan kullanıcı dostu bir web uygulaması.  
Backend tarafında **Node.js + Express**, frontend tarafında ise **Tailwind CSS** kullanılmıştır.  
Video indirme işlemleri için **yt-dlp** ve **FFmpeg** entegre edilmiştir.  

---

## ✨ Özellikler
- 🎨 Modern ve responsive arayüz (Tailwind CSS)  
- ⚡ Hızlı ve güvenilir indirme motoru (yt-dlp + FFmpeg)  
- 🔒 Güvenlik için whitelist, rate limiting ve güvenli dosya adlandırma  
- 📥 TikTok ve Twitter (X) videolarını reklamsız indirme desteği  

---

## 🛠 Kurulum

1. Bu repoyu bilgisayarına klonla:
   ```bash
   git clone https://github.com/FlyDeniz/video-indirici.git
   cd video-indirici
   npm install
.env dosyası oluştur ve aşağıdaki değerleri ekle:

PORT=3000
YTDLP_BIN=yt-dlp.exe
FFMPEG_BIN=bin/ffmpeg.exe

Sunucuyu başlat:

npm run start

Tarayıcıdan çalıştır:
👉 http://localhost:3000

📦 Gereksinimler

Node.js (v18+)

yt-dlp → repoya dahil edilmiştir

FFmpeg → boyut sınırı sebebiyle ayrıca indirilmeli:
🔗 FFmpeg Download

📸 Ekran Görüntüsü <img width="1599" height="816" alt="Screenshot_1" src="https://github.com/user-attachments/assets/1bd84b8d-c600-4c32-ab48-b3ff7c9ac587" />

📄 Lisans

Bu proje kişisel kullanım için geliştirilmiştir.
Herhangi bir ticari amaçla veya izinsiz içerik indirmek için kullanılmamalıdır.

✍️ Geliştiren: FlyDeniz

