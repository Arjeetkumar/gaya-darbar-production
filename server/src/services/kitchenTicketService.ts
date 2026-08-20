import mongoose from 'mongoose';
import {
  KitchenTicket,
  IKitchenTicket,
  KitchenTicketStatus,
  KitchenTicketPriority,
  IKitchenItemSnapshot,
} from '../models/KitchenTicket.js';
import { Order, IOrder, OrderStatus } from '../models/Order.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Allowed Kitchen Ticket status transitions
 */
const ALLOWED_TRANSITIONS: Record<KitchenTicketStatus, KitchenTicketStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

/**
 * Map Kitchen Ticket status to corresponding Order status
 */
const TICKET_TO_ORDER_STATUS_MAP: Partial<Record<KitchenTicketStatus, OrderStatus>> = {
  preparing: 'preparing',
  ready: 'ready',
  completed: 'completed',
  cancelled: 'cancelled',
};

/**
 * Priority sorting order weight helper
 */
function getPriorityWeight(priority: KitchenTicketPriority): number {
  switch (priority) {
    case 'urgent':
      return 3;
    case 'high':
      return 2;
    case 'normal':
    default:
      return 1;
  }
}

/**
 * Creates a KitchenTicket snapshot from an existing persisted Order.
 * Safe against duplicate ticket creation for the same Order.
 */
export async function createKitchenTicketFromOrder(
  order: IOrder
): Promise<IKitchenTicket> {
  if (!order || !order._id) {
    throw new AppError('A valid persisted order is required to create a kitchen ticket.', 400);
  }

  // 1. Idempotency Check: prevent duplicate kitchen tickets for the same order
  const existingTicket = await KitchenTicket.findOne({ order: order._id });
  if (existingTicket) {
    logger.warn(`Kitchen ticket already exists for order ${order.orderNumber}`);
    return existingTicket;
  }

  // 2. Map Order items snapshot to Kitchen Item snapshots
  const kitchenItems: IKitchenItemSnapshot[] = order.items.map((item) => {
    const customOptionsSnapshot = item.customOptionsSnapshot
      ? item.customOptionsSnapshot.map((opt) => ({
          name: opt.name,
          category: opt.category,
          quantity: 1,
        }))
      : [];

    return {
      itemType: item.itemType,
      name: item.name,
      quantity: item.quantity,
      portionChoice: item.portionChoice || '',
      sauceChoice: item.sauceChoice || '',
      ...(customOptionsSnapshot.length > 0 ? { customOptionsSnapshot } : {}),
    };
  });

  // 3. Create Kitchen Ticket Document
  const ticket = await KitchenTicket.create({
    order: order._id,
    orderNumber: order.orderNumber,
    items: kitchenItems,
    status: 'pending',
    priority: 'normal',
    customerNotes: order.customerNotes || '',
    startedAt: null,
    readyAt: null,
    completedAt: null,
  });

  logger.info(`Created kitchen ticket ${ticket._id} for order ${order.orderNumber}`);
  return ticket;
}

export interface GetKitchenTicketsFilter {
  status?: KitchenTicketStatus;
  priority?: KitchenTicketPriority;
  activeOnly?: boolean;
}

/**
 * Retrieves kitchen tickets based on optional filters, sorted by priority (desc) and createdAt (asc).
 */
export async function getKitchenTickets(
  filters: GetKitchenTicketsFilter = {}
): Promise<IKitchenTicket[]> {
  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  } else if (filters.activeOnly) {
    query.status = { $in: ['pending', 'preparing', 'ready'] };
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  const tickets = await KitchenTicket.find(query).sort({ createdAt: 1 }).exec();

  // In-memory sort to ensure urgent/high priority tickets appear first, maintaining oldest-first within same priority
  return tickets.sort((a, b) => {
    const pDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (pDiff !== 0) return pDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Fetches non-terminal active kitchen tickets (pending, preparing, ready).
 */
export async function getActiveKitchenTickets(): Promise<IKitchenTicket[]> {
  return getKitchenTickets({ activeOnly: true });
}

/**
 * Retrieves a specific kitchen ticket by ID.
 */
export async function getKitchenTicketById(id: string): Promise<IKitchenTicket> {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid kitchen ticket ID format.', 400);
  }

  const ticket = await KitchenTicket.findById(id).exec();
  if (!ticket) {
    throw new AppError('Kitchen ticket not found.', 404);
  }

  return ticket;
}

/**
 * Updates a Kitchen Ticket's status following strict status transition rules.
 * Automatically synchronizes the corresponding Order status.
 */
export async function updateKitchenTicketStatus(
  id: string,
  newStatus: KitchenTicketStatus,
  actorInfo?: { userId?: string; role?: string }
): Promise<IKitchenTicket> {
  const validStatuses: KitchenTicketStatus[] = [
    'pending',
    'preparing',
    'ready',
    'completed',
    'cancelled',
  ];

  if (!newStatus || !validStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid status '${newStatus}'. Must be one of: ${validStatuses.join(', ')}.`,
      400
    );
  }

  const ticket = await getKitchenTicketById(id);
  const currentStatus = ticket.status;

  // No-op if status is identical
  if (currentStatus === newStatus) {
    return ticket;
  }

  // Validate Allowed Transitions
  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed next status(es): [${
        allowedNextStatuses.join(', ') || 'none'
      }].`,
      400
    );
  }

  // Update Status & Timestamps
  ticket.status = newStatus;
  const now = new Date();

  if (newStatus === 'preparing' && !ticket.startedAt) {
    ticket.startedAt = now;
  } else if (newStatus === 'ready' && !ticket.readyAt) {
    ticket.readyAt = now;
  } else if (newStatus === 'completed' && !ticket.completedAt) {
    ticket.completedAt = now;
  }

  await ticket.save();

  // Audit Hook Log Marker for Phase 6.2 preparation
  logger.info(
    `Kitchen ticket ${ticket._id} status transitioned: ${currentStatus} -> ${newStatus} by actor: ${
      actorInfo?.role || 'system'
    } (${actorInfo?.userId || 'system'})`
  );

  // Synchronize Order status
  const targetOrderStatus = TICKET_TO_ORDER_STATUS_MAP[newStatus];
  if (targetOrderStatus) {
    await Order.findByIdAndUpdate(ticket.order, { status: targetOrderStatus });
    logger.info(
      `Synchronized Order ${ticket.orderNumber} status to '${targetOrderStatus}' from kitchen ticket update.`
    );
  }

  // Trigger Notifications
  try {
    const linkedOrder = await Order.findById(ticket.order);
    if (linkedOrder) {
      const { createOrderNotification } = await import('./notificationService.js');
      if (newStatus === 'preparing') {
        await createOrderNotification(
          linkedOrder.user,
          linkedOrder._id,
          linkedOrder.orderNumber,
          'ORDER_PREPARING',
          'Kitchen Preparing',
          `Our chefs are now preparing order ${linkedOrder.orderNumber}.`
        );
      } else if (newStatus === 'ready') {
        await createOrderNotification(
          linkedOrder.user,
          linkedOrder._id,
          linkedOrder.orderNumber,
          'ORDER_READY',
          'Order Ready',
          `Order ${linkedOrder.orderNumber} is prepared and ready!`
        );
      }
    }
  } catch (notifErr) {
    logger.error(`Error triggering notification for kitchen ticket ${ticket._id}:`, notifErr);
  }

  return ticket;
}

/**
 * Updates priority of a kitchen ticket (normal, high, urgent).
 */
export async function setKitchenTicketPriority(
  id: string,
  priority: KitchenTicketPriority
): Promise<IKitchenTicket> {
  const validPriorities: KitchenTicketPriority[] = ['normal', 'high', 'urgent'];
  if (!priority || !validPriorities.includes(priority)) {
    throw new AppError(
      `Invalid priority '${priority}'. Must be one of: ${validPriorities.join(', ')}.`,
      400
    );
  }

  const ticket = await getKitchenTicketById(id);
  ticket.priority = priority;
  await ticket.save();

  logger.info(`Updated priority of kitchen ticket ${ticket._id} to '${priority}'`);
  return ticket;
}
