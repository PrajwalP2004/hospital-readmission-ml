# 🏥 MedPredict — Clinical Decision Support Dashboard

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

MedPredict is a professional, production-ready Clinical Decision Support (CDS) dashboard built for healthcare providers. It integrates with an AI-powered readmission risk engine to help clinicians identify high-risk patients and optimize discharge planning.

---

## ✨ Features

- **🚀 Real-time Diagnostics**: Integration with Random Forest ML models for instant readmission scoring.
- **💬 Clinical AI Chat**: Context-aware clinical suggestions grounded in CDC and WHO standards.
- **📊 Population Analytics**: High-level metrics for ward-wide patient safety monitoring.
- **📋 Patient Registry**: Searchable and filterable registry with clinical risk history.
- **🎨 Glassmorphism UI**: High-fidelity, responsive interface designed for medical environments.

---

## 🏗️ Technical Architecture

The frontend follows a domain-driven architectural pattern:

```text
src/
├── api/          # Axios configuration and mock data layers
├── services/     # Domain logic (Prediction, Patient services)
├── hooks/        # Reusable API and state logic (useApi)
├── components/   # Atomic UI primitives and shared components
├── layouts/      # Main application shells (Sidebar, Header)
├── pages/        # Feature containers (Dashboard, Predictions, etc.)
└── styles/       # Tailwind configuration and global tokens
```

---

## 🚀 Getting Started

### 1. Installation
```bash
git clone https://github.com/PrajwalP2004/hospital-readmission-ml.git
cd hospital-readmission-ml
npm install
```

### 2. Configuration
Create a `.env` file in the root:
```bash
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Development
```bash
npm run dev
```

---

## 🚢 Deployment

### Production Build
```bash
npm run build
```
The optimized bundle will be generated in the `dist/` directory.

### Hosting
- **Vercel/Netlify**: Connect your GitHub repository and set `VITE_API_BASE_URL` in environment variables.
- **Docker**: A professional `Dockerfile` can be added to containerize the Vite build.

---

## 🧪 Testing

- **Linting**: `npm run lint`
- **Manual Verification**: Use the **Analytics** page to verify the ML threshold settings.

---

## 📜 License
Licensed under the [MIT License](LICENSE).
