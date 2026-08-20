# Gaya Darbar — Iron & Fuel House (Backend API Server)

Production-grade Express + TypeScript API server foundation for Gaya Darbar platform.

## 🏗️ Architecture

```
server/
├── src/
│   ├── config/          # Environment configuration & dotenv loaders
│   ├── controllers/     # API route controllers (health, v1 endpoints)
│   ├── middleware/      # Global error handling & CORS middleware
│   ├── routes/          # Express route definitions (/api/health, /api/v1)
│   ├── utils/           # Server logger and helper utilities
│   ├── app.ts           # Express application setup
│   └── server.ts        # Server entry point & graceful shutdown
├── .env.example         # Environment template with placeholder values
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Development Mode
Run the development server with live reload:
```bash
npm run dev
```

### 3. Build & Production Start
Compile TypeScript and start production server:
```bash
npm run build
npm run start
```

## 📡 API Endpoints

* **Health Check**: `GET /api/health`
* **API v1 Gateway**: `GET /api/v1`
