import mongoose from 'mongoose';
import { Order, IOrder } from '../models/Order.js';
import { KitchenTicket } from '../models/KitchenTicket.js';
import { Delivery } from '../models/Delivery.js';
import { AppError } from '../middleware/errorHandler.js';

export interface TimelineStep {
  type: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'cancelled';
  timestamp?: Date | null;
}

export interface CustomerOrderTrackingResult {
  order: IOrder;
  kitchenStatus: string | null;
  deliveryStatus: string | null;
  deliveryRider: { name: string } | null;
  timeline: TimelineStep[];
}

/**
 * Retrieves live customer order tracking details with strict IDOR ownership enforcement.
 */
export async function getCustomerOrderTracking(
  orderIdentifier: string,
  userId: string
): Promise<CustomerOrderTrackingResult> {
  const query: Record<string, unknown> = {};

  if (mongoose.Types.ObjectId.isValid(orderIdentifier)) {
    query._id = orderIdentifier;
  } else {
    const cleanNum = orderIdentifier.trim().toUpperCase();
    query.orderNumber = cleanNum.startsWith('#') ? cleanNum : `#${cleanNum}`;
  }

  const order = await Order.findOne(query).exec();

  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  // Strict IDOR Protection: Order must belong to authenticated customer
  if (order.user.toString() !== userId) {
    throw new AppError('Access denied. You do not own this order.', 403);
  }

  const kitchenTicket = await KitchenTicket.findOne({ order: order._id }).exec();
  const delivery = await Delivery.findOne({ order: order._id })
    .populate('rider', 'name email')
    .exec();

  const riderObj =
    delivery && delivery.rider && typeof (delivery.rider as any).name === 'string'
      ? (delivery.rider as any)
      : null;

  // Build Structured Step Timeline
  const timeline: TimelineStep[] = [];
  const currentStatus = order.status;

  if (currentStatus === 'cancelled') {
    timeline.push(
      { type: 'ORDER_PLACED', label: 'Fuel Order Placed', status: 'completed', timestamp: order.createdAt },
      { type: 'ORDER_CANCELLED', label: 'Order Cancelled', status: 'cancelled', timestamp: order.updatedAt }
    );
  } else if (order.orderType === 'delivery') {
    const statusSequence: string[] = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'outForDelivery',
      'delivered',
      'completed',
    ];

    const currentIdx = statusSequence.indexOf(currentStatus);

    timeline.push({
      type: 'ORDER_PLACED',
      label: 'Fuel Order Placed',
      status: 'completed',
      timestamp: order.createdAt,
    });

    timeline.push({
      type: 'ORDER_CONFIRMED',
      label: 'Order Confirmed',
      status: currentIdx >= 1 ? (currentIdx === 1 ? 'current' : 'completed') : 'upcoming',
      timestamp: currentIdx >= 1 ? order.updatedAt : null,
    });

    const isPrep = currentIdx >= 2 || (kitchenTicket && ['preparing', 'ready', 'completed'].includes(kitchenTicket.status));
    timeline.push({
      type: 'ORDER_PREPARING',
      label: 'Kitchen Prep',
      status: isPrep ? (currentStatus === 'preparing' ? 'current' : 'completed') : 'upcoming',
      timestamp: kitchenTicket?.startedAt || null,
    });

    const isReady = currentIdx >= 3 || (kitchenTicket && ['ready', 'completed'].includes(kitchenTicket.status));
    timeline.push({
      type: 'ORDER_READY',
      label: 'Kitchen Ready',
      status: isReady ? (currentStatus === 'ready' ? 'current' : 'completed') : 'upcoming',
      timestamp: kitchenTicket?.readyAt || null,
    });

    const isOut = currentIdx >= 4 || (delivery && ['out_for_delivery', 'delivered'].includes(delivery.status));
    timeline.push({
      type: 'OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      status: isOut ? (currentStatus === 'outForDelivery' ? 'current' : 'completed') : 'upcoming',
      timestamp: delivery?.outForDeliveryAt || delivery?.pickedUpAt || null,
    });

    const isDelivered = currentIdx >= 5 || (delivery && delivery.status === 'delivered');
    timeline.push({
      type: 'DELIVERED',
      label: 'Delivered to Customer',
      status: isDelivered ? 'completed' : 'upcoming',
      timestamp: delivery?.deliveredAt || null,
    });
  } else {
    // Dine-In Order Timeline
    const statusSequence: string[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const currentIdx = statusSequence.indexOf(currentStatus);

    timeline.push({
      type: 'ORDER_PLACED',
      label: 'Fuel Order Placed',
      status: 'completed',
      timestamp: order.createdAt,
    });

    timeline.push({
      type: 'ORDER_CONFIRMED',
      label: 'Order Confirmed',
      status: currentIdx >= 1 ? (currentIdx === 1 ? 'current' : 'completed') : 'upcoming',
      timestamp: currentIdx >= 1 ? order.updatedAt : null,
    });

    timeline.push({
      type: 'ORDER_PREPARING',
      label: 'Kitchen Prep',
      status: currentIdx >= 2 ? (currentIdx === 2 ? 'current' : 'completed') : 'upcoming',
      timestamp: kitchenTicket?.startedAt || null,
    });

    timeline.push({
      type: 'ORDER_READY',
      label: 'Ready at Table',
      status: currentIdx >= 3 ? (currentIdx === 3 ? 'current' : 'completed') : 'upcoming',
      timestamp: kitchenTicket?.readyAt || null,
    });

    timeline.push({
      type: 'COMPLETED',
      label: 'Order Completed',
      status: currentIdx >= 4 ? 'completed' : 'upcoming',
      timestamp: currentIdx >= 4 ? order.updatedAt : null,
    });
  }

  return {
    order,
    kitchenStatus: kitchenTicket ? kitchenTicket.status : null,
    deliveryStatus: delivery ? delivery.status : null,
    deliveryRider: riderObj ? { name: riderObj.name } : null,
    timeline,
  };
}
