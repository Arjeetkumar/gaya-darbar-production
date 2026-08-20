import mongoose from 'mongoose';
import { Notification, INotification, NotificationType } from '../models/Notification.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface CreateNotificationInput {
  user: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  order?: string | mongoose.Types.ObjectId | null;
  orderNumber?: string | null;
}

/**
 * Creates a generic notification.
 */
export async function createNotification(input: CreateNotificationInput): Promise<INotification> {
  const notification = await Notification.create({
    user: new mongoose.Types.ObjectId(input.user),
    type: input.type,
    title: input.title.trim(),
    message: input.message.trim(),
    order: input.order ? new mongoose.Types.ObjectId(input.order) : null,
    orderNumber: input.orderNumber ? input.orderNumber.trim() : null,
    isRead: false,
  });

  logger.info(`Notification created [${notification.type}] for user ${notification.user}`);
  return notification;
}

/**
 * Idempotently creates an order-related notification.
 * Prevents duplicate notifications when a state transition is retried.
 */
export async function createOrderNotification(
  userId: string | mongoose.Types.ObjectId,
  orderId: string | mongoose.Types.ObjectId,
  orderNumber: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<INotification> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const orderObjectId = new mongoose.Types.ObjectId(orderId);

  // Duplicate Notification Check
  const existing = await Notification.findOne({
    user: userObjectId,
    order: orderObjectId,
    type,
  });

  if (existing) {
    return existing;
  }

  return createNotification({
    user: userObjectId,
    order: orderObjectId,
    orderNumber,
    type,
    title,
    message,
  });
}

/**
 * Retrieves notifications for an authenticated user with ownership check.
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20
): Promise<INotification[]> {
  const safeLimit = Math.min(50, Math.max(1, limit));

  return Notification.find({ user: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .exec();
}

/**
 * Retrieves count of unread notifications for an authenticated user.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return Notification.countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });
}

/**
 * Marks a single notification as read with strict user ownership enforcement.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<INotification> {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new AppError('Invalid notification ID format.', 400);
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!notification) {
    throw new AppError('Notification not found or access denied.', 404);
  }

  notification.isRead = true;
  await notification.save();
  return notification;
}

/**
 * Marks all notifications as read for an authenticated user.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<{ modifiedCount: number }> {
  const result = await Notification.updateMany(
    { user: new mongoose.Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true } }
  );

  return { modifiedCount: result.modifiedCount };
}
