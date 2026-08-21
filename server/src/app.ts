import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config, validateEnv } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import v1Routes from './routes/v1/index.js';
import { handleWebhookHandler } from './controllers/paymentController.js';
import {
  securityHeaders,
  globalRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
} from './middleware/securityMiddleware.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

export function createApp(): express.Application {
  // Validate startup environment variables
  validateEnv();

  const app = express();

  // Helmet Security HTTP Headers
  app.use(securityHeaders);

  // Development vs Production CORS Configuration
  const rawClientUrls = config.clientUrl
    ? config.clientUrl.split(',').map((u) => u.trim().replace(/\/$/, ''))
    : [];

  const defaultAllowedOrigins = [
    'https://gaya-darbar.vercel.app',
    'https://gayadarbar.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:5000',
  ];

  const allowedOriginsSet = new Set([...rawClientUrls, ...defaultAllowedOrigins]);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, server-to-server, curl, or Postman)
        if (!origin) {
          return callback(null, true);
        }
        const cleanOrigin = origin.replace(/\/$/, '');

        const isExactMatch = allowedOriginsSet.has(cleanOrigin);
        const isVercelSubdomain = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/i.test(cleanOrigin);

        if (isExactMatch || isVercelSubdomain) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
      credentials: true,
    })
  );

  // Global Rate Limiter
  app.use(globalRateLimiter);

  // Auth Endpoints Rate Limiting (brute-force protection)
  app.use('/api/v1/auth/login', authRateLimiter);
  app.use('/api/v1/auth/register', authRateLimiter);

  // Payment Endpoints Rate Limiting
  app.use('/api/v1/payments/create-order', paymentRateLimiter);
  app.use('/api/v1/payments/verify', paymentRateLimiter);

  // Webhook raw body buffer parsing BEFORE global express.json()
  app.post(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json' }),
    handleWebhookHandler
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Root Service Status Endpoints (Render Ping & Health Probes)
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      service: 'gaya-darbar-api',
      status: 'online',
      environment: config.nodeEnv,
      message: 'Gaya Darbar API is running',
    });
  });

  app.head('/', (_req, res) => {
    res.status(200).end();
  });

  // Health & Readiness Routes (mounted on both /api and /api/v1)
  app.use('/api', healthRoutes);
  app.use('/api/v1', healthRoutes);

  // v1 Gateway Router
  app.use('/api/v1', v1Routes);

  // Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

export default createApp();
