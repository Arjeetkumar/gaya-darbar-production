import { Request, Response, NextFunction } from 'express';
import {
  getKitchenTickets,
  getKitchenTicketById,
  updateKitchenTicketStatus,
  setKitchenTicketPriority,
} from '../services/kitchenTicketService.js';
import { KitchenTicketStatus, KitchenTicketPriority } from '../models/KitchenTicket.js';

export async function getKitchenTicketsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, priority, active } = req.query;

    const tickets = await getKitchenTickets({
      status: typeof status === 'string' ? (status as KitchenTicketStatus) : undefined,
      priority: typeof priority === 'string' ? (priority as KitchenTicketPriority) : undefined,
      activeOnly: active === 'true',
    });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
}

export async function getKitchenTicketByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawId = req.params.id;
    const ticketId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

    const ticket = await getKitchenTicketById(ticketId);

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateKitchenTicketStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawId = req.params.id;
    const ticketId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Field status is required in request body.', statusCode: 400 },
      });
      return;
    }

    const actorInfo = req.user
      ? { userId: req.user._id.toString(), role: req.user.role }
      : undefined;

    const updatedTicket = await updateKitchenTicketStatus(
      ticketId,
      status as KitchenTicketStatus,
      actorInfo
    );

    res.status(200).json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateKitchenTicketPriorityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawId = req.params.id;
    const ticketId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
    const { priority } = req.body;

    if (!priority || typeof priority !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Field priority is required in request body.', statusCode: 400 },
      });
      return;
    }

    const updatedTicket = await setKitchenTicketPriority(
      ticketId,
      priority as KitchenTicketPriority
    );

    res.status(200).json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
}
