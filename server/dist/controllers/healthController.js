import { config } from '../config/env.js';
import { getDatabaseStatus } from '../config/database.js';
/**
 * Health check endpoint reporting service status and database dependency state.
 */
export function getHealthCheck(_req, res) {
    const dbStatus = getDatabaseStatus();
    const isHealthy = dbStatus === 'connected';
    res.status(200).json({
        success: true,
        service: 'gaya-darbar-api',
        status: isHealthy ? 'healthy' : 'degraded',
        database: dbStatus,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
    });
}
/**
 * Readiness probe endpoint for orchestrators / load balancers.
 * Returns HTTP 503 Service Unavailable if database dependency is unavailable.
 */
export function getReadinessCheck(_req, res) {
    const dbStatus = getDatabaseStatus();
    const isReady = dbStatus === 'connected';
    if (!isReady) {
        res.status(503).json({
            success: false,
            ready: false,
            service: 'gaya-darbar-api',
            database: dbStatus,
            message: 'Service Unavailable: MongoDB database dependency is not connected.',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    res.status(200).json({
        success: true,
        ready: true,
        service: 'gaya-darbar-api',
        database: dbStatus,
        timestamp: new Date().toISOString(),
    });
}
