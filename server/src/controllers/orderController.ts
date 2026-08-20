import { Request, Response, NextFunction } from 'express';
import {
  createOrder,
  getUserOrders,
  getUserOrderById,
  updateOrderStatus,
} from '../services/orderService.js';
import { OrderStatus } from '../models/Order.js';

export async function createOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', statusCode: 401 },
      });
      return;
    }

    const order = await createOrder(req.user._id.toString(), req.body);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', statusCode: 401 },
      });
      return;
    }

    const orders = await getUserOrders(req.user._id.toString());

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserOrderByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', statusCode: 401 },
      });
      return;
    }

    const rawId = req.params.id;
    const orderId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: { message: 'Order ID or orderNumber parameter is required.', statusCode: 400 },
      });
      return;
    }

    const order = await getUserOrderById(req.user._id.toString(), orderId);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required.', statusCode: 401 },
      });
      return;
    }

    const rawId = req.params.id;
    const orderId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Field status is required in request body.', statusCode: 400 },
      });
      return;
    }

    const updatedOrder = await updateOrderStatus(orderId, status as OrderStatus, {
      userId: req.user._id.toString(),
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
}
