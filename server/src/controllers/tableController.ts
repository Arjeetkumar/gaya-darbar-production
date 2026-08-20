import { Request, Response, NextFunction } from 'express';
import { getTableByQrIdentifier } from '../services/tableService.js';

export async function getTableByQrHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawQr = req.params.qrCodeIdentifier;
    const qrCodeIdentifier = typeof rawQr === 'string' ? rawQr : Array.isArray(rawQr) ? rawQr[0] : '';

    if (!qrCodeIdentifier) {
      res.status(400).json({
        success: false,
        error: { message: 'QR code identifier parameter is required.', statusCode: 400 },
      });
      return;
    }

    const table = await getTableByQrIdentifier(qrCodeIdentifier);

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error) {
    next(error);
  }
}
