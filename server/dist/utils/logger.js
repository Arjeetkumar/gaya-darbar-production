import { config } from '../config/env.js';
/**
 * Utility to redact sensitive values (passwords, tokens, database URIs, API keys, card numbers) from log outputs.
 */
function sanitizeMeta(meta) {
    return meta.map((item) => {
        if (typeof item === 'string') {
            return item
                .replace(/\/\/(.*):(.*)@/, '//***:***@')
                .replace(/rzp_(live|test)_[A-Za-z0-9]+/g, '[REDACTED_RAZORPAY_KEY]')
                .replace(/("password"|"passwordHash"|"token"|"jwt"|"secret")\s*:\s*"[^"]+"/gi, '$1:"[REDACTED]"');
        }
        if (item && typeof item === 'object') {
            try {
                const str = JSON.stringify(item);
                const sanitized = str
                    .replace(/\/\/(.*):(.*)@/, '//***:***@')
                    .replace(/rzp_(live|test)_[A-Za-z0-9]+/g, '[REDACTED_RAZORPAY_KEY]')
                    .replace(/("password"|"passwordHash"|"token"|"jwt"|"secret")\s*:\s*"[^"]+"/gi, '$1:"[REDACTED]"');
                return JSON.parse(sanitized);
            }
            catch {
                return item;
            }
        }
        return item;
    });
}
export const logger = {
    info: (message, ...meta) => {
        const cleanMeta = sanitizeMeta(meta);
        console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...cleanMeta);
    },
    warn: (message, ...meta) => {
        const cleanMeta = sanitizeMeta(meta);
        console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...cleanMeta);
    },
    error: (message, error) => {
        console.error(`[ERROR] [${new Date().toISOString()}] ${message}`);
        if (error && !config.isProduction) {
            const cleanError = sanitizeMeta([error])[0];
            console.error(cleanError);
        }
    },
};
