import mongoose from 'mongoose';
import { Order, IOrder, OrderType, OrderStatus, IOrderItemSnapshot, IDeliveryAddressSnapshot, ICustomOptionSnapshot } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { MealBuilderOption } from '../models/MealBuilderOption.js';
import { KitchenTicket, KitchenTicketStatus } from '../models/KitchenTicket.js';
import { createKitchenTicketFromOrder } from './kitchenTicketService.js';
import { validateTableForDineIn } from './tableService.js';
import { UserRole } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface CreateOrderPayloadItem {
  itemType: 'STANDARD_ITEM' | 'CUSTOM_MEAL';
  menuItemId?: string;
  slug?: string;
  name?: string;
  quantity: number;
  portionChoice?: string;
  sauceChoice?: string;
  // For Custom Meals
  customMealSelection?: {
    baseId?: string;
    proteinId?: string;
    carbId?: string;
    vegetableIds?: string[];
    sauceIds?: string[];
    extraIds?: string[];
  };
}

export interface CreateOrderInput {
  orderType: OrderType;
  items: CreateOrderPayloadItem[];
  deliveryAddress?: IDeliveryAddressSnapshot | null;
  table?: string | null;
  customerNotes?: string;
}

/**
 * Allowed Order status transitions matrix
 */
const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['outForDelivery', 'delivered', 'completed', 'cancelled'],
  outForDelivery: ['delivered', 'completed', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

/**
 * Statuses that kitchen_staff are authorized to transition orders into
 */
const KITCHEN_STAFF_ALLOWED_ORDER_STATUSES: OrderStatus[] = [
  'confirmed',
  'preparing',
  'ready',
  'completed',
];

/**
 * Server-Side Deterministic Fuel Score Calculation Algorithm
 */
export function calculateServerFuelScore(
  protein: number,
  calories: number,
  fats: number,
  hasBase: boolean,
  hasProtein: boolean,
  vegCount: number
): number {
  let score = 65;

  if (!hasBase || !hasProtein) {
    score -= 25;
  }

  const proteinBonus = Math.min(25, protein * 0.5);
  score += proteinBonus;

  if (protein >= 30 && calories <= 650) {
    score += 5;
  }

  const vegBonus = Math.min(9, vegCount * 3);
  score += vegBonus;

  if (fats >= 8 && fats <= 22) {
    score += 4;
  }
  if (fats > 35) {
    score -= 6;
  }
  if (calories > 800) {
    score -= 5;
  }

  return Math.max(1, Math.min(100, Math.round(score)));
}

/**
 * Generates a unique collision-safe Gaya Darbar order number (e.g. #GD-8492)
 */
async function generateOrderNumber(): Promise<string> {
  let isUnique = false;
  let orderNumber = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    orderNumber = `#GD-${randomDigits}`;
    const existing = await Order.findOne({ orderNumber });
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    orderNumber = `#GD-${Date.now().toString().slice(-6)}`;
  }

  return orderNumber;
}

export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<IOrder> {
  const { orderType, items, deliveryAddress, table, customerNotes } = input;

  // 1. Validate Order Type
  if (!orderType || !['delivery', 'dineIn'].includes(orderType)) {
    throw new AppError("Invalid orderType. Must be 'delivery' or 'dineIn'.", 400);
  }

  // 2. Validate Items Array
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one item.', 400);
  }

  // 3. Validate Delivery Address or Dine-In Table
  let sanitizedAddress: IDeliveryAddressSnapshot | null = null;
  let validatedTableIdentifier: string | null = null;

  if (orderType === 'delivery') {
    if (!deliveryAddress) {
      throw new AppError('A valid delivery address is required for delivery orders.', 400);
    }
    const { fullName, phone, addressLine1, city, state, postalCode } = deliveryAddress;
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      throw new AppError(
        'Delivery address requires fullName, phone, addressLine1, city, state, and postalCode.',
        400
      );
    }
    sanitizedAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: deliveryAddress.addressLine2 ? deliveryAddress.addressLine2.trim() : '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      landmark: deliveryAddress.landmark ? deliveryAddress.landmark.trim() : '',
    };
  } else if (orderType === 'dineIn') {
    if (!table) {
      throw new AppError('A valid table identifier is required for dine-in orders.', 400);
    }
    const validatedTableDoc = await validateTableForDineIn(table);
    validatedTableIdentifier = validatedTableDoc.tableNumber;
  }

  // 4. Process & Recalculate Items Server-Side
  const processedSnapshots: IOrderItemSnapshot[] = [];

  for (const rawItem of items) {
    const quantity = Math.max(1, Math.floor(rawItem.quantity || 1));

    if (rawItem.itemType === 'STANDARD_ITEM') {
      let menuItemDoc = null;
      if (rawItem.menuItemId && mongoose.Types.ObjectId.isValid(rawItem.menuItemId)) {
        menuItemDoc = await MenuItem.findById(rawItem.menuItemId);
      } else if (rawItem.slug) {
        menuItemDoc = await MenuItem.findOne({ slug: rawItem.slug });
      }

      if (!menuItemDoc || menuItemDoc.isDeleted) {
        throw new AppError(
          `Requested menu item '${rawItem.name || rawItem.menuItemId || rawItem.slug}' is invalid or no longer available.`,
          400
        );
      }

      if (!menuItemDoc.isAvailable) {
        throw new AppError(
          `Menu item '${menuItemDoc.name}' is currently out of stock.`,
          400
        );
      }

      const unitPrice = menuItemDoc.price;
      const totalPrice = unitPrice * quantity;

      processedSnapshots.push({
        itemType: 'STANDARD_ITEM',
        menuItemId: menuItemDoc._id as unknown as mongoose.Types.ObjectId,
        name: menuItemDoc.name,
        image: menuItemDoc.image || '',
        quantity,
        unitPrice,
        totalPrice,
        portionChoice: rawItem.portionChoice || '',
        sauceChoice: rawItem.sauceChoice || '',
        nutritionSnapshot: {
          calories: menuItemDoc.macros.calories,
          protein: menuItemDoc.macros.protein,
          carbs: menuItemDoc.macros.carbs,
          fats: menuItemDoc.macros.fats,
        },
        fuelScore: menuItemDoc.fuelScore,
      });
    } else if (rawItem.itemType === 'CUSTOM_MEAL') {
      const sel = rawItem.customMealSelection;
      if (!sel || !sel.baseId || !sel.proteinId) {
        throw new AppError('Custom meal requires a valid Base and Protein selection.', 400);
      }

      const selectedIds: string[] = [
        sel.baseId,
        sel.proteinId,
        ...(sel.carbId ? [sel.carbId] : []),
        ...(Array.isArray(sel.vegetableIds) ? sel.vegetableIds : []),
        ...(Array.isArray(sel.sauceIds) ? sel.sauceIds : []),
        ...(Array.isArray(sel.extraIds) ? sel.extraIds : []),
      ];

      const optionDocs = await MealBuilderOption.find({
        _id: { $in: selectedIds },
        isDeleted: { $ne: true },
      });

      if (optionDocs.length !== selectedIds.length) {
        throw new AppError('One or more selected custom meal options were not found.', 400);
      }

      for (const optDoc of optionDocs) {
        if (!optDoc.isAvailable) {
          throw new AppError(`Custom option '${optDoc.name}' is currently out of stock.`, 400);
        }
      }

      const customOptionsSnapshot: ICustomOptionSnapshot[] = optionDocs.map((optDoc) => ({
        optionId: String((optDoc as any)._id),
        name: optDoc.name,
        category: optDoc.category,
        price: optDoc.price,
        nutrition: {
          calories: optDoc.calories,
          protein: optDoc.protein,
          carbs: optDoc.carbs,
          fats: optDoc.fats,
        },
        dietaryPreference: optDoc.dietaryPreference,
      }));

      // Server-Side Recalculations
      const unitPrice = optionDocs.reduce((sum, opt) => sum + opt.price, 0);
      const totalPrice = unitPrice * quantity;

      const calories = optionDocs.reduce((sum, opt) => sum + opt.calories, 0);
      const protein = optionDocs.reduce((sum, opt) => sum + opt.protein, 0);
      const carbs = optionDocs.reduce((sum, opt) => sum + opt.carbs, 0);
      const fats = optionDocs.reduce((sum, opt) => sum + opt.fats, 0);

      const hasBase = optionDocs.some((opt) => opt.category === 'base');
      const hasProtein = optionDocs.some((opt) => opt.category === 'protein');
      const vegCount = optionDocs.filter((opt) => opt.category === 'vegetables').length;

      const fuelScore = calculateServerFuelScore(
        protein,
        calories,
        fats,
        hasBase,
        hasProtein,
        vegCount
      );

      processedSnapshots.push({
        itemType: 'CUSTOM_MEAL',
        menuItemId: null,
        name: 'Custom Fuel Bowl',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        quantity,
        unitPrice,
        totalPrice,
        nutritionSnapshot: { calories, protein, carbs, fats },
        fuelScore,
        customOptionsSnapshot,
      });
    }
  }

  // 5. Calculate Financial Totals
  const subtotal = processedSnapshots.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = orderType === 'delivery' ? 40 : 0;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const discount = 0;
  const total = subtotal + deliveryFee + tax - discount;

  // 6. Generate Order Number & Save Order Document
  const orderNumber = await generateOrderNumber();

  const newOrder = await Order.create({
    orderNumber,
    user: new mongoose.Types.ObjectId(userId),
    orderType,
    items: processedSnapshots,
    subtotal,
    deliveryFee,
    tax,
    discount,
    total,
    currency: 'INR',
    deliveryAddress: sanitizedAddress,
    table: validatedTableIdentifier,
    status: 'pending',
    paymentStatus: 'pending',
    customerNotes: customerNotes ? customerNotes.trim() : '',
  });

  // 7. Automatic Kitchen Ticket & Delivery Record Creation Workflow
  try {
    await createKitchenTicketFromOrder(newOrder);
  } catch (ticketError) {
    logger.error(`Error automatically creating kitchen ticket for order ${newOrder.orderNumber}:`, ticketError);
  }

  if (newOrder.orderType === 'delivery') {
    try {
      const { createDeliveryForOrder } = await import('./deliveryService.js');
      await createDeliveryForOrder(newOrder);
    } catch (deliveryErr) {
      logger.error(`Error automatically creating delivery record for order ${newOrder.orderNumber}:`, deliveryErr);
    }
  }

  // 8. Order Placed Notification Trigger
  try {
    const { createOrderNotification } = await import('./notificationService.js');
    await createOrderNotification(
      newOrder.user,
      newOrder._id,
      newOrder.orderNumber,
      'ORDER_PLACED',
      'Fuel Order Placed',
      `Your order ${newOrder.orderNumber} has been placed successfully.`
    );
  } catch (notifErr) {
    logger.error(`Error creating order placed notification for ${newOrder.orderNumber}:`, notifErr);
  }

  return newOrder;
}

export async function getUserOrders(userId: string): Promise<IOrder[]> {
  return Order.find({ user: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .exec();
}

export async function getUserOrderById(
  userId: string,
  orderIdentifier: string
): Promise<IOrder> {
  const query: Record<string, unknown> = {};

  if (mongoose.Types.ObjectId.isValid(orderIdentifier)) {
    query._id = orderIdentifier;
  } else {
    query.orderNumber = orderIdentifier.toUpperCase().startsWith('#')
      ? orderIdentifier.toUpperCase()
      : `#${orderIdentifier.toUpperCase()}`;
  }

  const order = await Order.findOne(query).exec();

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  // Strict IDOR Authorization Enforcement: Customer can only access their own order
  if (order.user.toString() !== userId) {
    throw new AppError('Permission denied. You do not have authorization to view this order.', 403);
  }

  return order;
}

/**
 * Controlled Order status management by staff (admin, manager, kitchen_staff).
 * Synchronizes linked KitchenTicket status where appropriate.
 */
export async function updateOrderStatus(
  orderIdentifier: string,
  newStatus: OrderStatus,
  actor: { userId: string; role: UserRole }
): Promise<IOrder> {
  const validOrderStatuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'outForDelivery',
    'delivered',
    'completed',
    'cancelled',
  ];

  if (!newStatus || !validOrderStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid order status '${newStatus}'. Must be one of: ${validOrderStatuses.join(', ')}.`,
      400
    );
  }

  // Role Permissions Check
  if (actor.role === 'kitchen_staff' && !KITCHEN_STAFF_ALLOWED_ORDER_STATUSES.includes(newStatus)) {
    throw new AppError(
      `Role 'kitchen_staff' is not authorized to set order status to '${newStatus}'.`,
      403
    );
  }

  // Find Order
  const query: Record<string, unknown> = {};
  if (mongoose.Types.ObjectId.isValid(orderIdentifier)) {
    query._id = orderIdentifier;
  } else {
    query.orderNumber = orderIdentifier.toUpperCase().startsWith('#')
      ? orderIdentifier.toUpperCase()
      : `#${orderIdentifier.toUpperCase()}`;
  }

  const order = await Order.findOne(query).exec();
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  const currentStatus = order.status;
  if (currentStatus === newStatus) {
    return order;
  }

  // Validate Transition
  const allowedTransitions = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new AppError(
      `Invalid order status transition from '${currentStatus}' to '${newStatus}'. Allowed next status(es): [${
        allowedTransitions.join(', ') || 'none'
      }].`,
      400
    );
  }

  // Apply update
  order.status = newStatus;
  await order.save();

  logger.info(
    `Order ${order.orderNumber} status transitioned: ${currentStatus} -> ${newStatus} by ${actor.role} (${actor.userId})`
  );

  // Synchronize corresponding KitchenTicket if present
  const validKitchenStatuses: KitchenTicketStatus[] = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
  if (validKitchenStatuses.includes(newStatus as KitchenTicketStatus)) {
    const targetKitchenStatus = newStatus as KitchenTicketStatus;
    const ticket = await KitchenTicket.findOne({ order: order._id });
    if (ticket && ticket.status !== targetKitchenStatus) {
      ticket.status = targetKitchenStatus;
      const now = new Date();
      if (targetKitchenStatus === 'preparing' && !ticket.startedAt) ticket.startedAt = now;
      if (targetKitchenStatus === 'ready' && !ticket.readyAt) ticket.readyAt = now;
      if (targetKitchenStatus === 'completed' && !ticket.completedAt) ticket.completedAt = now;
      await ticket.save();
      logger.info(
        `Synchronized KitchenTicket ${ticket._id} status to '${targetKitchenStatus}' from direct Order update.`
      );
    }
  }

  // Notification Event Triggers
  try {
    const { createOrderNotification } = await import('./notificationService.js');
    const notificationMap: Partial<Record<OrderStatus, { type: any; title: string; message: string }>> = {
      confirmed: { type: 'ORDER_CONFIRMED', title: 'Order Confirmed', message: `Order ${order.orderNumber} has been confirmed by restaurant.` },
      preparing: { type: 'ORDER_PREPARING', title: 'Kitchen Preparing', message: `Our chefs are now preparing order ${order.orderNumber}.` },
      ready: { type: 'ORDER_READY', title: 'Order Ready', message: `Order ${order.orderNumber} is prepared and ready!` },
      outForDelivery: { type: 'ORDER_OUT_FOR_DELIVERY', title: 'Out for Delivery', message: `Order ${order.orderNumber} is out for delivery!` },
      delivered: { type: 'ORDER_DELIVERED', title: 'Order Delivered', message: `Order ${order.orderNumber} has been delivered. Enjoy your meal!` },
      cancelled: { type: 'ORDER_CANCELLED', title: 'Order Cancelled', message: `Order ${order.orderNumber} was cancelled.` },
    };

    const notifConfig = notificationMap[newStatus];
    if (notifConfig) {
      await createOrderNotification(
        order.user,
        order._id,
        order.orderNumber,
        notifConfig.type,
        notifConfig.title,
        notifConfig.message
      );
    }
  } catch (notifErr) {
    logger.error(`Error triggering notification for order ${order.orderNumber}:`, notifErr);
  }

  return order;
}
