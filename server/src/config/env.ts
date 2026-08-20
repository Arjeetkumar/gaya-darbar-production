import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  databaseUrl: string;
  isProduction: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL || 'mongodb://localhost:27017/gaya_darbar',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'gaya_darbar_iron_and_fuel_jwt_secret_key_2026_dev_mode',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

/**
 * Validates required environment variables at server boot.
 * Throws an error in production if critical keys are missing or using dev defaults.
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!config.databaseUrl) missing.push('DATABASE_URL');
  if (!config.jwtSecret || config.jwtSecret.includes('dev_mode')) missing.push('JWT_SECRET');
  if (!config.razorpayKeyId) missing.push('RAZORPAY_KEY_ID');
  if (!config.razorpayKeySecret) missing.push('RAZORPAY_KEY_SECRET');
  if (!config.razorpayWebhookSecret) missing.push('RAZORPAY_WEBHOOK_SECRET');

  if (config.isProduction && missing.length > 0) {
    throw new Error(
      `FATAL PRODUCTION ENVIRONMENT ERROR: Missing or insecure configuration for: [${missing.join(
        ', '
      )}]. Production process halted.`
    );
  }

  return { valid: missing.length === 0, missing };
}
