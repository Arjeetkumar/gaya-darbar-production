import { Request, Response, NextFunction } from 'express';
import {
  getOverviewAnalytics,
  getOrderAnalytics,
  getRevenueAnalytics,
  getKitchenAnalytics,
  getDeliveryAnalytics,
  getRiderAnalytics,
  getMenuPerformanceAnalytics,
  getCustomerAnalytics,
  getNutritionAnalytics,
} from '../services/analyticsService.js';

export async function getOverviewAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getOverviewAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getOrderAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getOrderAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getRevenueAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getKitchenAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getKitchenAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getDeliveryAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getRiderAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getRiderAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getMenuAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getMenuPerformanceAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getCustomerAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getNutritionAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { dateFrom, dateTo } = req.query;
    const data = await getNutritionAnalytics(
      typeof dateFrom === 'string' ? dateFrom : undefined,
      typeof dateTo === 'string' ? dateTo : undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
