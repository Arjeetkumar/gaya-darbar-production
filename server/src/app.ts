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
  const allowedOrigins = config.isProduction
    ? [config.clientUrl]
    : [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman) in dev/tests
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else if (!config.isProduction) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed.`));
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

  // Health & Readiness Routes
  app.use('/api', healthRoutes);

  // v1 Gateway Router
  app.use('/api/v1', v1Routes);

  // Error Handling
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

export default createApp();
