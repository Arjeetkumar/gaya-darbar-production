import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Helmet Security Headers Middleware
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Avoid breaking inline scripts / Vite asset loading
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Global API Rate Limiter
 * 1000 requests per 15-minute window per IP to accommodate real-time auto-polling across dashboards.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP. Please try again later.',
      statusCode: 429,
    },
  },
});

/**
 * Auth Endpoints Rate Limiter (Brute-force protection on /auth/login and /auth/register)
 * 15 attempts per 15-minute window per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      statusCode: 429,
    },
  },
});

/**
 * Payment Endpoints Rate Limiter
 * 50 payment order / verification attempts per 15-minute window per IP.
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many payment creation attempts. Please wait before retrying.',
      statusCode: 429,
    },
  },
});
