import { Request, Response, NextFunction } from 'express';
import { getCustomerOrderTracking } from '../services/customerOrderTrackingService.js';

export async function getCustomerOrderTrackingHandler(
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
    const orderIdentifier = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

    const trackingData = await getCustomerOrderTracking(
      orderIdentifier,
      req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    next(error);
  }
}
