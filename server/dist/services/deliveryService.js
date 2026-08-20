import mongoose from 'mongoose';
import { Delivery } from '../models/Delivery.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
/**
 * Safe regex escaping helper
 */
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Generates unique delivery number (e.g. #GD-D-8492)
 */
async function generateDeliveryNumber() {
    let isUnique = false;
    let deliveryNumber = '';
    let attempts = 0;
    while (!isUnique && attempts < 10) {
        attempts++;
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        deliveryNumber = `#GD-D-${randomDigits}`;
        const existing = await Delivery.findOne({ deliveryNumber });
        if (!existing) {
            isUnique = true;
        }
    }
    if (!isUnique) {
        deliveryNumber = `#GD-D-${Date.now().toString().slice(-6)}`;
    }
    return deliveryNumber;
}
/**
 * Idempotently creates a Delivery record for an eligible delivery order.
 */
export async function createDeliveryForOrder(order) {
    if (order.orderType !== 'delivery' || !order.deliveryAddress) {
        return null; // Not eligible for delivery tracking
    }
    // Idempotency check
    const existing = await Delivery.findOne({ order: order._id });
    if (existing) {
        return existing;
    }
    const deliveryNumber = await generateDeliveryNumber();
    // Fetch customer details if possible
    const customerUser = await User.findById(order.user).select('name email');
    const customerSnapshot = {
        name: customerUser ? customerUser.name : order.deliveryAddress.fullName,
        email: customerUser ? customerUser.email : 'N/A',
        phone: order.deliveryAddress.phone,
    };
    const delivery = await Delivery.create({
        deliveryNumber,
        order: order._id,
        orderNumber: order.orderNumber,
        rider: null,
        status: 'unassigned',
        deliveryAddressSnapshot: order.deliveryAddress,
        customerSnapshot,
    });
    logger.info(`Created delivery record ${delivery.deliveryNumber} for order ${order.orderNumber}`);
    return delivery;
}
/**
 * Returns available active delivery riders for assignment.
 */
export async function getAvailableRiders() {
    return User.find({
        role: 'delivery_rider',
        isActive: true,
        isDeleted: { $ne: true },
    })
        .select('_id name email role')
        .sort({ name: 1 })
        .exec();
}
/**
 * Paginated delivery list for Admin/Manager Dispatch Dashboard.
 */
export async function getAdminDeliveries(params = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;
    const query = {};
    if (params.status) {
        query.status = params.status;
    }
    if (params.rider && mongoose.Types.ObjectId.isValid(params.rider)) {
        query.rider = params.rider;
    }
    // Date Range Filter
    if (params.dateFrom || params.dateTo) {
        const createdAtFilter = {};
        if (params.dateFrom) {
            const fromDate = new Date(params.dateFrom);
            if (!isNaN(fromDate.getTime()))
                createdAtFilter.$gte = fromDate;
        }
        if (params.dateTo) {
            const toDate = new Date(params.dateTo);
            if (!isNaN(toDate.getTime())) {
                toDate.setHours(23, 59, 59, 999);
                createdAtFilter.$lte = toDate;
            }
        }
        if (Object.keys(createdAtFilter).length > 0) {
            query.createdAt = createdAtFilter;
        }
    }
    // Search by deliveryNumber, orderNumber, customer name, customer email
    if (params.search && params.search.trim()) {
        const safePattern = escapeRegex(params.search.trim());
        const searchRegex = new RegExp(safePattern, 'i');
        query.$or = [
            { deliveryNumber: searchRegex },
            { orderNumber: searchRegex },
            { 'customerSnapshot.name': searchRegex },
            { 'customerSnapshot.email': searchRegex },
        ];
    }
    const total = await Delivery.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const deliveries = await Delivery.find(query)
        .populate('rider', 'name email role')
        .populate('order')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    return {
        deliveries,
        pagination: { page, limit, total, totalPages },
    };
}
/**
 * Fetch delivery by ID or deliveryNumber
 */
export async function getDeliveryById(deliveryIdentifier) {
    const query = {};
    if (mongoose.Types.ObjectId.isValid(deliveryIdentifier)) {
        query._id = deliveryIdentifier;
    }
    else {
        const cleanNum = deliveryIdentifier.trim().toUpperCase();
        query.$or = [
            { deliveryNumber: cleanNum.startsWith('#') ? cleanNum : `#${cleanNum}` },
            { orderNumber: cleanNum.startsWith('#') ? cleanNum : `#${cleanNum}` },
        ];
    }
    const delivery = await Delivery.findOne(query)
        .populate('rider', 'name email role')
        .populate('order')
        .exec();
    if (!delivery) {
        throw new AppError('Delivery record not found.', 404);
    }
    return delivery;
}
/**
 * Assigns a delivery rider to a delivery (Admin/Manager).
 */
export async function assignDeliveryRider(deliveryIdentifier, riderId) {
    if (!riderId || !mongoose.Types.ObjectId.isValid(riderId)) {
        throw new AppError('A valid rider ID is required.', 400);
    }
    const rider = await User.findById(riderId);
    if (!rider || !rider.isActive || rider.isDeleted || rider.role !== 'delivery_rider') {
        throw new AppError('Selected user is not an active delivery rider.', 400);
    }
    const delivery = await getDeliveryById(deliveryIdentifier);
    if (delivery.status === 'delivered' || delivery.status === 'cancelled') {
        throw new AppError(`Cannot assign rider to a ${delivery.status} delivery.`, 400);
    }
    const linkedOrder = await Order.findById(delivery.order);
    if (linkedOrder && linkedOrder.status === 'cancelled') {
        throw new AppError('Cannot assign rider to a cancelled order.', 400);
    }
    delivery.rider = rider._id;
    delivery.status = 'assigned';
    delivery.assignedAt = new Date();
    await delivery.save();
    logger.info(`Assigned rider ${rider.name} (${rider._id}) to delivery ${delivery.deliveryNumber}`);
    // Trigger DELIVERY_ASSIGNED Notification
    try {
        if (linkedOrder) {
            const { createOrderNotification } = await import('./notificationService.js');
            await createOrderNotification(linkedOrder.user, linkedOrder._id, linkedOrder.orderNumber, 'DELIVERY_ASSIGNED', 'Delivery Rider Assigned', `Rider ${rider.name} has been assigned to deliver order ${linkedOrder.orderNumber}.`);
        }
    }
    catch (notifErr) {
        logger.error(`Error triggering notification for delivery assignment ${delivery.deliveryNumber}:`, notifErr);
    }
    return getDeliveryById(delivery._id.toString());
}
/**
 * Reassigns a delivery rider (Admin/Manager).
 */
export async function reassignDeliveryRider(deliveryIdentifier, newRiderId) {
    return assignDeliveryRider(deliveryIdentifier, newRiderId);
}
/**
 * Cancels a delivery (Admin/Manager).
 */
export async function cancelDelivery(deliveryIdentifier) {
    const delivery = await getDeliveryById(deliveryIdentifier);
    if (delivery.status === 'delivered') {
        throw new AppError('Cannot cancel a delivered shipment.', 400);
    }
    delivery.status = 'cancelled';
    await delivery.save();
    logger.info(`Cancelled delivery ${delivery.deliveryNumber}`);
    return getDeliveryById(delivery._id.toString());
}
/**
 * Gets assigned deliveries for a specific rider.
 */
export async function getMyDeliveries(riderUserId, statusFilter) {
    const query = {
        rider: new mongoose.Types.ObjectId(riderUserId),
    };
    if (statusFilter) {
        query.status = statusFilter;
    }
    return Delivery.find(query)
        .populate('order')
        .sort({ createdAt: -1 })
        .exec();
}
/**
 * Gets a specific rider's delivery with strict ownership enforcement.
 */
export async function getMyDeliveryById(deliveryIdentifier, riderUserId) {
    const delivery = await getDeliveryById(deliveryIdentifier);
    if (!delivery.rider || delivery.rider._id.toString() !== riderUserId) {
        throw new AppError('Permission denied. You are not authorized to view this delivery.', 403);
    }
    return delivery;
}
/**
 * Updates delivery status by Rider following strict state machine & order sync.
 */
export async function updateRiderDeliveryStatus(deliveryIdentifier, riderUserId, newStatus, failureReason) {
    const delivery = await getMyDeliveryById(deliveryIdentifier, riderUserId);
    const currentStatus = delivery.status;
    if (currentStatus === newStatus) {
        return delivery;
    }
    // State Machine Validation
    const ALLOWED_RIDER_TRANSITIONS = {
        unassigned: [],
        assigned: ['picked_up', 'failed'],
        picked_up: ['out_for_delivery', 'failed'],
        out_for_delivery: ['delivered', 'failed'],
        delivered: [],
        failed: [],
        cancelled: [],
    };
    const allowedNext = ALLOWED_RIDER_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
        throw new AppError(`Invalid rider status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowedNext.join(', ') || 'none'}].`, 400);
    }
    if (newStatus === 'failed' && (!failureReason || !failureReason.trim())) {
        throw new AppError('A failure reason is required when marking a delivery as failed.', 400);
    }
    delivery.status = newStatus;
    const now = new Date();
    if (newStatus === 'picked_up') {
        delivery.pickedUpAt = now;
    }
    else if (newStatus === 'out_for_delivery') {
        delivery.outForDeliveryAt = now;
    }
    else if (newStatus === 'delivered') {
        delivery.deliveredAt = now;
    }
    else if (newStatus === 'failed') {
        delivery.failureReason = failureReason.trim();
    }
    await delivery.save();
    // Order Status Synchronization & Notification Triggers
    const linkedOrder = await Order.findById(delivery.order);
    if (linkedOrder) {
        if (newStatus === 'picked_up' || newStatus === 'out_for_delivery') {
            if (linkedOrder.status !== 'outForDelivery' && linkedOrder.status !== 'cancelled') {
                linkedOrder.status = 'outForDelivery';
                await linkedOrder.save();
                logger.info(`Synchronized Order ${linkedOrder.orderNumber} to 'outForDelivery'`);
            }
        }
        else if (newStatus === 'delivered') {
            if (linkedOrder.status !== 'delivered' && linkedOrder.status !== 'cancelled') {
                linkedOrder.status = 'delivered';
                await linkedOrder.save();
                logger.info(`Synchronized Order ${linkedOrder.orderNumber} to 'delivered'`);
            }
        }
        try {
            const { createOrderNotification } = await import('./notificationService.js');
            if (newStatus === 'picked_up') {
                await createOrderNotification(linkedOrder.user, linkedOrder._id, linkedOrder.orderNumber, 'DELIVERY_PICKED_UP', 'Order Picked Up', `Your order ${linkedOrder.orderNumber} was picked up by rider and is on its way!`);
            }
            else if (newStatus === 'out_for_delivery') {
                await createOrderNotification(linkedOrder.user, linkedOrder._id, linkedOrder.orderNumber, 'ORDER_OUT_FOR_DELIVERY', 'Out for Delivery', `Rider is out for delivery with order ${linkedOrder.orderNumber}.`);
            }
            else if (newStatus === 'delivered') {
                await createOrderNotification(linkedOrder.user, linkedOrder._id, linkedOrder.orderNumber, 'ORDER_DELIVERED', 'Order Delivered', `Order ${linkedOrder.orderNumber} has been delivered successfully. Enjoy!`);
            }
            else if (newStatus === 'failed') {
                await createOrderNotification(linkedOrder.user, linkedOrder._id, linkedOrder.orderNumber, 'DELIVERY_FAILED', 'Delivery Issue Reported', `Rider reported an issue delivering order ${linkedOrder.orderNumber}: ${failureReason}`);
            }
        }
        catch (notifErr) {
            logger.error(`Error triggering delivery notification for ${delivery.deliveryNumber}:`, notifErr);
        }
    }
    return getDeliveryById(delivery._id.toString());
}
