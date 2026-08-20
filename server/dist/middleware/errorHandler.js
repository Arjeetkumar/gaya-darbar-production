import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
export class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
/**
 * 404 Handler for undefined API routes.
 */
export function notFoundHandler(req, res, next) {
    const error = new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found.`, 404);
    next(error);
}
/**
 * Centralized Global Error Handler Middleware.
 * Production mode sanitizes 500 internal errors and redacts stack traces, database URIs, and file paths.
 */
export function globalErrorHandler(err, _req, res, _next) {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    // Internal 500 errors in production are sanitized to prevent leaking sensitive system details
    let message = err.message || 'Internal Server Error';
    if (config.isProduction && statusCode === 500 && !(err instanceof AppError)) {
        message = 'Internal Server Error. An unexpected error occurred.';
    }
    // Log full error details on backend server
    logger.error(`API Error ${statusCode}: ${err.message || 'Internal Exception'}`, err);
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            ...(!config.isProduction && err.stack ? { stack: err.stack } : {}),
        },
    });
}
