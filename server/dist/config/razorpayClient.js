import Razorpay from 'razorpay';
import { config } from './env.js';
import { AppError } from '../middleware/errorHandler.js';
let razorpayInstance = null;
if (config.razorpayKeyId && config.razorpayKeySecret) {
    razorpayInstance = new Razorpay({
        key_id: config.razorpayKeyId,
        key_secret: config.razorpayKeySecret,
    });
}
/**
 * Returns the initialized Razorpay instance or throws 500 error if unconfigured.
 * Production code MUST fail safely when credentials are missing.
 */
export function getRazorpayInstance() {
    if (!razorpayInstance) {
        // Attempt re-read in case env variables were populated dynamically
        if (config.razorpayKeyId && config.razorpayKeySecret) {
            razorpayInstance = new Razorpay({
                key_id: config.razorpayKeyId,
                key_secret: config.razorpayKeySecret,
            });
            return razorpayInstance;
        }
        throw new AppError('Razorpay payment gateway is not configured on server. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.', 500);
    }
    return razorpayInstance;
}
