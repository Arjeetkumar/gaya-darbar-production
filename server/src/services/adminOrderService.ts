import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus, OrderType, PaymentStatus } from '../models/Order.js';
import { User } from '../models/User.js';
import { KitchenTicket } from '../models/KitchenTicket.js';
import { updateOrderStatus } from './orderService.js';
import { UserRole } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface GetAdminOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  orderType?: OrderType;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}

export interface AdminOrdersPaginatedResult {
  orders: IOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Escapes special regex characters safely
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Retrieves paginated, filtered, and searched orders for Admin/Manager dashboard.
 */
export async function getAdminOrders(
  params: GetAdminOrdersParams = {}
): Promise<AdminOrdersPaginatedResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  // 1. Status Filter
  const validStatuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'outForDelivery',
    'delivered',
    'completed',
    'cancelled',
  ];
  if (params.status && validStatuses.includes(params.status)) {
    query.status = params.status;
  }

  // 2. Order Type Filter
  if (params.orderType && ['delivery', 'dineIn'].includes(params.orderType)) {
    query.orderType = params.orderType;
  }

  // 3. Payment Status Filter
  if (
    params.paymentStatus &&
    ['pending', 'paid', 'failed', 'refunded'].includes(params.paymentStatus)
  ) {
    query.paymentStatus = params.paymentStatus;
  }

  // 4. Date Range Filter (dateFrom, dateTo)
  if (params.dateFrom || params.dateTo) {
    const createdAtFilter: Record<string, Date> = {};
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      if (!isNaN(fromDate.getTime())) {
        createdAtFilter.$gte = fromDate;
      }
    }
    if (params.dateTo) {
      const toDate = new Date(params.dateTo);
      if (!isNaN(toDate.getTime())) {
        // Set to end of the day if dateTo has no time component
        toDate.setHours(23, 59, 59, 999);
        createdAtFilter.$lte = toDate;
      }
    }
    if (Object.keys(createdAtFilter).length > 0) {
      query.createdAt = createdAtFilter;
    }
  }

  // 5. Search (orderNumber, customer name, customer email)
  if (params.search && params.search.trim()) {
    const rawSearch = params.search.trim();
    const safePattern = escapeRegex(rawSearch);
    const searchRegex = new RegExp(safePattern, 'i');

    // Find customer IDs matching name or email
    const matchingUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select('_id');

    const matchingUserIds = matchingUsers.map((u) => u._id);

    const searchConditions: Array<Record<string, unknown>> = [
      { orderNumber: searchRegex },
      { user: { $in: matchingUserIds } },
    ];

    if (mongoose.Types.ObjectId.isValid(rawSearch)) {
      searchConditions.push({ _id: rawSearch });
    }

    query.$or = searchConditions;
  }

  // 6. Execute Count & Query
  const total = await Order.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const orders = await Order.find(query)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Retrieves a single order by ObjectId or orderNumber with populated customer info.
 */
export async function getAdminOrderById(orderIdentifier: string): Promise<IOrder> {
  const query: Record<string, unknown> = {};

  if (mongoose.Types.ObjectId.isValid(orderIdentifier)) {
    query._id = orderIdentifier;
  } else {
    const cleanNumber = orderIdentifier.trim().toUpperCase();
    query.orderNumber = cleanNumber.startsWith('#') ? cleanNumber : `#${cleanNumber}`;
  }

  const order = await Order.findOne(query).populate('user', 'name email role').exec();
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  return order;
}

/**
 * Updates order status using central orderService logic (preserves transitions and KDS sync).
 */
export async function updateAdminOrderStatus(
  orderIdentifier: string,
  newStatus: OrderStatus,
  actor: { userId: string; role: UserRole }
): Promise<IOrder> {
  const updatedOrder = await updateOrderStatus(orderIdentifier, newStatus, actor);
  return getAdminOrderById(updatedOrder._id.toString());
}

/**
 * Cancels an order cleanly, updating linked KitchenTicket and enforcing terminal checks.
 */
export async function cancelAdminOrder(
  orderIdentifier: string,
  actor: { userId: string; role: UserRole }
): Promise<IOrder> {
  const order = await getAdminOrderById(orderIdentifier);

  if (order.status === 'completed' || order.status === 'cancelled') {
    throw new AppError(
      `Order ${order.orderNumber} is already '${order.status}' and cannot be cancelled.`,
      400
    );
  }

  order.status = 'cancelled';
  await order.save();

  logger.info(
    `Order ${order.orderNumber} cancelled by ${actor.role} (${actor.userId})`
  );

  // Synchronize linked KitchenTicket
  const ticket = await KitchenTicket.findOne({ order: order._id });
  if (ticket && ticket.status !== 'cancelled') {
    ticket.status = 'cancelled';
    await ticket.save();
    logger.info(`Synchronized KitchenTicket ${ticket._id} to 'cancelled'.`);
  }

  return getAdminOrderById(order._id.toString());
}
