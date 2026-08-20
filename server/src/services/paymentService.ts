import crypto from 'crypto';
import mongoose from 'mongoose';
import { Payment, IPayment, PaymentStatus } from '../models/Payment.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Order } from '../models/Order.js';
import { config } from '../config/env.js';
import { getRazorpayInstance } from '../config/razorpayClient.js';
import { createOrderNotification } from './notificationService.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

export interface CreatePaymentOrderResult {
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id?: string;
}

/**
 * Creates or reuses a Razorpay Payment Order safely and idempotently.
 * Authoritative amount comes strictly from MongoDB Order.total.
 */
export async function createRazorpayPaymentOrder(
  orderId: string,
  userId: string
): Promise<CreatePaymentOrderResult> {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError('Invalid order ID format.', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  // Strict Ownership Enforcement
  if (order.user.toString() !== userId) {
    throw new AppError('Access denied. You do not own this order.', 403);
  }

  if (order.status === 'cancelled') {
    throw new AppError('Cannot create payment for a cancelled order.', 400);
  }

  if (order.paymentStatus === 'paid') {
    throw new AppError('This order has already been paid for.', 400);
  }

  // Check for an existing active pending Payment attempt to prevent duplicate Razorpay orders
  const existingPendingPayment = await Payment.findOne({
    order: order._id,
    status: 'pending',
    isPending: true,
  });

  if (existingPendingPayment) {
    return {
      keyId: config.razorpayKeyId,
      providerOrderId: existingPendingPayment.providerOrderId,
      amount: order.total,
      currency: 'INR',
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    };
  }

  // Authoritative server-side amount calculation in paise
  const amountInPaise = Math.round(order.total * 100);
  const razorpay = getRazorpayInstance();

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId,
      },
    });
  } catch (err: any) {
    logger.error(`Razorpay order creation failed for order ${order.orderNumber}:`, err);
    throw new AppError(`Razorpay payment creation failed: ${err.message || 'Gateway error'}`, 500);
  }

  // Save new Payment record with partial unique index guard
  try {
    const payment = await Payment.create({
      order: order._id,
      user: order.user,
      orderNumber: order.orderNumber,
      provider: 'razorpay',
      providerOrderId: razorpayOrder.id,
      amount: order.total,
      amountInPaise,
      currency: 'INR',
      status: 'pending',
      isPending: true,
    });

    return {
      keyId: config.razorpayKeyId,
      providerOrderId: payment.providerOrderId,
      amount: order.total,
      currency: 'INR',
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    };
  } catch (dbErr: any) {
    // Check if partial unique index prevented duplicate concurrent creation
    if (dbErr.code === 11000) {
      const activePayment = await Payment.findOne({ order: order._id, isPending: true });
      if (activePayment) {
        return {
          keyId: config.razorpayKeyId,
          providerOrderId: activePayment.providerOrderId,
          amount: order.total,
          currency: 'INR',
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        };
      }
    }
    throw dbErr;
  }
}

/**
 * Verifies Razorpay payment signature using server-stored providerOrderId.
 */
export async function verifyPaymentSignature(
  userId: string,
  payload: VerifyPaymentPayload
): Promise<IPayment> {
  const { orderId, razorpay_payment_id, razorpay_signature, razorpay_order_id } = payload;

  if (!orderId || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError('Missing required verification fields.', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }

  if (order.user.toString() !== userId) {
    throw new AppError('Access denied. You do not own this order.', 403);
  }

  const payment = await Payment.findOne({ order: order._id }).sort({ createdAt: -1 });
  if (!payment) {
    throw new AppError('Payment record not found for this order.', 404);
  }

  // Idempotency Guard: If already marked paid, return payment record immediately
  if (payment.status === 'paid') {
    return payment;
  }

  const storedProviderOrderId = payment.providerOrderId;

  if (razorpay_order_id && razorpay_order_id !== storedProviderOrderId) {
    throw new AppError('Client provider order ID mismatch with server database record.', 400);
  }

  // Cryptographic HMAC SHA256 Signature Verification
  const expectedSig = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${storedProviderOrderId}|${razorpay_payment_id}`)
    .digest('hex');

  const sigBuffer = Buffer.from(razorpay_signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSig, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    // Mark payment failed
    payment.status = 'failed';
    payment.isPending = false;
    payment.failureReason = 'Invalid payment signature';
    await payment.save();

    order.paymentStatus = 'failed';
    await order.save();

    try {
      await createOrderNotification(
        order.user,
        order._id,
        order.orderNumber,
        'PAYMENT_FAILED',
        'Payment Failed',
        `Payment verification failed for order ${order.orderNumber}.`
      );
    } catch (notifErr) {
      logger.error('Notification error on failed signature:', notifErr);
    }

    throw new AppError('Invalid payment signature. Verification failed.', 400);
  }

  // Signature valid: Transition payment & order status atomically
  payment.status = 'paid';
  payment.isPending = false;
  payment.providerPaymentId = razorpay_payment_id;
  payment.providerSignature = razorpay_signature;
  await payment.save();

  order.paymentStatus = 'paid';
  await order.save();

  try {
    await createOrderNotification(
      order.user,
      order._id,
      order.orderNumber,
      'PAYMENT_SUCCESS',
      'Payment Successful',
      `Your payment of ₹${order.total.toFixed(2)} for order ${order.orderNumber} was successful!`
    );
  } catch (notifErr) {
    logger.error('Notification error on successful payment:', notifErr);
  }

  logger.info(`Payment verified successfully for order ${order.orderNumber} [${razorpay_payment_id}]`);
  return payment;
}

/**
 * Handles Razorpay webhook events using raw body buffer verification and event idempotency.
 */
export async function processRazorpayWebhook(
  rawBuffer: Buffer,
  signatureHeader: string
): Promise<{ success: boolean; message: string }> {
  if (!signatureHeader || !config.razorpayWebhookSecret) {
    throw new AppError('Webhook signature header or secret missing.', 400);
  }

  // HMAC verification against exact raw Buffer
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayWebhookSecret)
    .update(rawBuffer)
    .digest('hex');

  const sigBuf = Buffer.from(signatureHeader, 'utf8');
  const expBuf = Buffer.from(expectedSignature, 'utf8');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new AppError('Webhook signature verification failed.', 400);
  }

  const payload = JSON.parse(rawBuffer.toString('utf8'));
  const eventId = payload.event_id || payload.id;
  const eventType = payload.event;

  if (!eventId || !eventType) {
    throw new AppError('Invalid webhook payload format.', 400);
  }

  // Idempotency Check
  const existingEvent = await WebhookEvent.findOne({ eventId });
  if (existingEvent) {
    return { success: true, message: 'Webhook event already processed.' };
  }

  const paymentEntity = payload.payload?.payment?.entity;
  const providerOrderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
  const providerPaymentId = paymentEntity?.id;

  // Record Webhook Event
  await WebhookEvent.create({
    eventId,
    eventType,
    providerOrderId,
    providerPaymentId,
  });

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    if (providerOrderId) {
      const payment = await Payment.findOne({ providerOrderId });
      if (payment && payment.status !== 'paid') {
        payment.status = 'paid';
        payment.isPending = false;
        if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          await order.save();

          await createOrderNotification(
            order.user,
            order._id,
            order.orderNumber,
            'PAYMENT_SUCCESS',
            'Payment Confirmed',
            `Payment of ₹${order.total.toFixed(2)} for order ${order.orderNumber} confirmed via gateway.`
          );
        }
      }
    }
  } else if (eventType === 'payment.failed') {
    if (providerOrderId) {
      const payment = await Payment.findOne({ providerOrderId });
      if (payment && payment.status === 'pending') {
        payment.status = 'failed';
        payment.isPending = false;
        payment.failureReason = paymentEntity?.error_description || 'Payment failed on gateway';
        await payment.save();

        const order = await Order.findById(payment.order);
        if (order && order.paymentStatus === 'pending') {
          order.paymentStatus = 'failed';
          await order.save();

          await createOrderNotification(
            order.user,
            order._id,
            order.orderNumber,
            'PAYMENT_FAILED',
            'Payment Failed',
            `Gateway payment failed for order ${order.orderNumber}.`
          );
        }
      }
    }
  }

  return { success: true, message: `Event ${eventType} processed successfully.` };
}

/**
 * Executes refund with concurrency-safe optimistic locking.
 */
export async function processAdminRefund(
  paymentId: string,
  requestedAmount: number,
  reason: string,
  adminUser: { _id: mongoose.Types.ObjectId; name: string }
): Promise<IPayment> {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new AppError('Invalid payment ID format.', 400);
  }

  if (requestedAmount <= 0) {
    throw new AppError('Refund amount must be greater than 0.', 400);
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError('Payment record not found.', 404);
  }

  if (payment.status !== 'paid' && payment.status !== 'partially_refunded') {
    throw new AppError(`Cannot refund a payment with status '${payment.status}'. Must be paid or partially_refunded.`, 400);
  }

  if (!payment.providerPaymentId) {
    throw new AppError('Payment missing provider transaction ID.', 400);
  }

  const remainingRefundable = Number((payment.amount - payment.refundedAmount).toFixed(2));
  if (requestedAmount > remainingRefundable) {
    throw new AppError(
      `Requested refund amount ₹${requestedAmount} exceeds remaining refundable balance of ₹${remainingRefundable}.`,
      400
    );
  }

  // Trigger REFUND_INITIATED notification
  const order = await Order.findById(payment.order);
  if (order) {
    try {
      await createOrderNotification(
        order.user,
        order._id,
        order.orderNumber,
        'REFUND_INITIATED',
        'Refund Initiated',
        `A refund of ₹${requestedAmount.toFixed(2)} has been initiated for order ${order.orderNumber}.`
      );
    } catch (err) {
      logger.error('Notification error on refund initiation:', err);
    }
  }

  // Optimistic Locking Concurrency Guard
  const currentRefunded = payment.refundedAmount;
  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, refundedAmount: currentRefunded },
    { $inc: { refundedAmount: requestedAmount } },
    { new: true }
  );

  if (!updatedPayment) {
    throw new AppError('Concurrent refund modification detected. Please retry.', 409);
  }

  const razorpay = getRazorpayInstance();
  let refundRes;

  try {
    refundRes = await razorpay.payments.refund(payment.providerPaymentId, {
      amount: Math.round(requestedAmount * 100),
      notes: {
        reason: reason || 'Customer refund',
        adminId: adminUser._id.toString(),
      },
    });
  } catch (razorErr: any) {
    // Revert refundedAmount increment on error
    await Payment.findByIdAndUpdate(payment._id, { $inc: { refundedAmount: -requestedAmount } });

    if (order) {
      try {
        await createOrderNotification(
          order.user,
          order._id,
          order.orderNumber,
          'REFUND_FAILED',
          'Refund Failed',
          `Refund attempt of ₹${requestedAmount.toFixed(2)} failed: ${razorErr.message || 'Gateway error'}`
        );
      } catch (err) {
        logger.error('Notification error on refund failure:', err);
      }
    }

    throw new AppError(`Razorpay refund failed: ${razorErr.message || 'Gateway error'}`, 500);
  }

  const newRefundedTotal = updatedPayment.refundedAmount;
  const isFullyRefunded = newRefundedTotal >= payment.amount;
  const newStatus: PaymentStatus = isFullyRefunded ? 'refunded' : 'partially_refunded';

  updatedPayment.status = newStatus;
  updatedPayment.refundId = refundRes.id;
  updatedPayment.refundsList.push({
    refundId: refundRes.id,
    amount: requestedAmount,
    reason: reason || 'Admin issue refund',
    status: 'processed',
    createdAt: new Date(),
    createdBy: adminUser._id,
  });

  await updatedPayment.save();

  // Order Alignment: Update Order.paymentStatus ONLY when fully refunded
  if (order) {
    if (isFullyRefunded) {
      order.paymentStatus = 'refunded';
      await order.save();
    }

    try {
      await createOrderNotification(
        order.user,
        order._id,
        order.orderNumber,
        'REFUND_COMPLETED',
        'Refund Completed',
        `Refund of ₹${requestedAmount.toFixed(2)} completed for order ${order.orderNumber}.`
      );
    } catch (err) {
      logger.error('Notification error on refund completion:', err);
    }
  }

  logger.info(`Processed ${newStatus} of ₹${requestedAmount} for payment ${payment._id} [Refund ID: ${refundRes.id}]`);
  return updatedPayment;
}

/**
 * Retrieves paginated payment list for Admin/Manager dashboard.
 */
export async function getAdminPaymentsList(queryFilter: {
  status?: string;
  orderNumber?: string;
  limit?: number;
  page?: number;
}): Promise<{ payments: IPayment[]; total: number; page: number; pages: number }> {
  const query: Record<string, unknown> = {};

  if (queryFilter.status) {
    query.status = queryFilter.status;
  }

  if (queryFilter.orderNumber) {
    const clean = queryFilter.orderNumber.trim().toUpperCase();
    query.orderNumber = clean.startsWith('#') ? clean : `#${clean}`;
  }

  const limit = Math.min(100, Math.max(1, queryFilter.limit || 20));
  const page = Math.max(1, queryFilter.page || 1);
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('user', 'name email role')
      .populate('order', 'orderNumber status orderType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
  };
}
