import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection lost. Connection state: disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB connection successfully restored.');
  });
}

export async function connectDatabase(): Promise<boolean> {
  try {
    attachConnectionListeners();

    // Sanitize URI for startup logging (masks credentials if present)
    const sanitizedUri = config.databaseUrl.replace(
      /\/\/(.*):(.*)@/,
      '//***:***@'
    );
    logger.info(`Connecting to MongoDB target: ${sanitizedUri}`);

    await mongoose.connect(config.databaseUrl, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    logger.info('Successfully connected to MongoDB database.');
    return true;
  } catch (error) {
    logger.error('Failed to establish MongoDB database connection.', error);
    if (config.isProduction) {
      throw error;
    }
    logger.warn(
      'Development Warning: Server starting without MongoDB connection. APIs dependent on database will operate in degraded mode until MongoDB is running.'
    );
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB database.');
  }
}

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' | 'disconnecting' {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
}
