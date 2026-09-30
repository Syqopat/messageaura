# 💬 messageaura (Full-Stack Bot Client Management System)

![Status](https://img.shields.io/badge/Status-Working%20%2F%20Stable-brightgreen?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)
![CI](https://img.shields.io/badge/CI%2FCD-Active-success?style=for-the-badge)

**messageaura** is a full-stack platform featuring a React frontend and Express backend designed for managing bot clients, monitoring connection status, and triggering live messaging scenarios.

---

## 📌 Project Status

- **Status:** 🟢 **Working / Stable**
- **CI/CD:** Automated GitHub Actions build workflow active.
- **Configuration:** Ports and reconnect parameters managed via `config.json`.

---

## 🚀 Architecture & Features

- **Backend:** Express & Socket.io bot state manager (`BotManager.js`).
- **Frontend:** Modern React web interface.
- **Texture & Model Application:** Dynamic skin and texture loader (`apply_textures.js`).

---

## 🛠️ Installation & Execution

### Backend:
```bash
cd backend
npm install
npm start
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📄 License

Licensed under the MIT License.
