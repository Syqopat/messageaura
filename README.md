# 💬 messageaura (Full-Stack Bot Client Management System)

![Status](https://img.shields.io/badge/Durum-%C3%87al%C4%B1%C5%9F%C4%B1yor%20%2F%20Working-brightgreen?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)
![CI](https://img.shields.io/badge/CI%2FCD-Active-success?style=for-the-badge)

**messageaura**, React ön yüzü ve Express arka yüzü ile çalışan, bot istemcilerini yönetme ve otomatik mesajlaşma senaryolarını canlı olarak izleme platformudur.

---

## 📌 Proje Durumu (Project Status)

- **Durum:** 🟢 **Çalışıyor (Working / Stable)**
- **Test & CI/CD:** GitHub Actions CI/CD otomasyonu aktif.
- **Konfigürasyon:** `config.json` ile sunucu ve istemci portları yapılandırılabilir.

---

## 🚀 Mimarisi ve Özellikleri

- **Backend:** Express & Socket.io tabanlı bot yöneticisi (`BotManager.js`).
- **Frontend:** Modern React web kullanıcı arayüzü.
- **Doku & Model Yönetimi:** İstemci kaplamalarını dinamik uygulama (`apply_textures.js`).

---

## 🛠️ Kurulum ve Çalıştırma

### Arka Yüz (Backend):
```bash
cd backend
npm install
npm start
```

### Ön Yüz (Frontend):
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 Lisans

MIT License
