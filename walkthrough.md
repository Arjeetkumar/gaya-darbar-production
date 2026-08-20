# Phase 10 — Production Deployment & Go-Live Walkthrough

## Summary of Completed Implementation

Phase 10 has been fully implemented and verified for **Gaya Darbar — Iron & Fuel House**. The frontend architecture has been configured with `API_BASE_URL` support via [`apiConfig.ts`](file:///c:/Users/Arjee/Desktop/GAYA-DARBAR/client/src/services/apiConfig.ts), removing development proxy dependencies while remaining 100% backward compatible. Environment variables have been documented across both client and server `.env.example` files, and all test suites and production builds have passed with 0 errors.

---

## 1. Automated Architecture Changes (Category A)

### Frontend Production API Configuration
- Created [`apiConfig.ts`](file:///c:/Users/Arjee/Desktop/GAYA-DARBAR/client/src/services/apiConfig.ts):
  - Exposes `API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''`.
  - Exposes `buildApiUrl(path: string)` helper.
- Updated all 10 frontend API service modules (`authService`, `orderService`, `paymentService`, `notificationService`, `kitchenService`, `deliveryService`, `adminOrderService`, `analyticsService`, `menuService`, `mealBuilderService`) to use `buildApiUrl`.

### Production Environment Checklists
- Created [`client/.env.example`](file:///c:/Users/Arjee/Desktop/GAYA-DARBAR/client/.env.example) documenting public frontend environment variables (`VITE_API_BASE_URL`, `VITE_RAZORPAY_KEY_ID`).
- Updated [`server/.env.example`](file:///c:/Users/Arjee/Desktop/GAYA-DARBAR/server/.env.example) documenting backend secrets (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`).

---

## 2. External Dashboard Deployment Instructions (Category B)

### 1. Backend Host (Render / Railway / AWS / DigitalOcean)
- **Build Command**: `npm run build`
- **Start Command**: `npm start` (`node dist/server.js`)
- **Environment Variables**:
  ```env
  NODE_ENV=production
  PORT=5000
  DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/gaya_darbar
  JWT_SECRET=<strong-random-256-bit-secret>
  JWT_EXPIRES_IN=7d
  CLIENT_URL=https://<your-frontend-domain>
  RAZORPAY_KEY_ID=rzp_live_<your-live-key-id>
  RAZORPAY_KEY_SECRET=<your-live-key-secret>
  RAZORPAY_WEBHOOK_SECRET=<your-live-webhook-secret>
  ```

### 2. Frontend Host (Vercel / Netlify / Cloudflare Pages)
- **Build Command**: `npm run build` (`tsc -b && vite build`)
- **Output Directory**: `dist`
- **Environment Variables**:
  ```env
  VITE_API_BASE_URL=https://<your-backend-domain>
  VITE_RAZORPAY_KEY_ID=rzp_live_<your-live-key-id>
  ```

### 3. Razorpay Dashboard
- **Switch to Live Mode**.
- **Webhook Endpoint**: `https://<your-backend-domain>/api/v1/payments/webhook`
- **Subscribed Events**: `payment.captured`, `payment.failed`, `refund.processed`
- **Copy Webhook Secret** into backend `RAZORPAY_WEBHOOK_SECRET`.

---

## 3. Final Verification Baseline

1. **Phase 9 Production Suite (`npx tsx src/testPhase9Production.ts`)**:
   - `🎉 ALL 35 PHASE 9 PRODUCTION VERIFICATION TESTS PASSED SUCCESSFULLY!`
2. **Phase 8 Payment Suite (`npx tsx src/testPayments.ts`)**:
   - `🎉 ALL 38 PHASE 8 VERIFICATION TESTS PASSED SUCCESSFULLY!`
3. **Phase 7 Notification Suite (`npx tsx src/testNotifications.ts`)**:
   - `🎉 ALL 25 PHASE 7 VERIFICATION TESTS PASSED SUCCESSFULLY!`
4. **Backend Server Build**: `npm run build` in `server/` $\rightarrow$ `0 errors`
5. **Frontend Client Build**: `npm run build` in `client/` $\rightarrow$ `0 errors (Vite production build successful)`
