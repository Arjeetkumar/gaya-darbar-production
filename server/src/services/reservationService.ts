import mongoose from 'mongoose';
import { Reservation, IReservation } from '../models/Reservation.js';
import { Table, ITable } from '../models/Table.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateReservationInput {
  reservationDate: string; // YYYY-MM-DD
  timeSlot: string;
  partySize: number;
  customerNotes?: string;
  tableId?: string;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  availableTablesCount: number;
  matchingTables: ITable[];
}

/**
 * Checks table availability for a specific date, time slot, and party size
 */
export async function checkReservationAvailability(
  reservationDate: string,
  timeSlot: string,
  partySize: number
): Promise<AvailabilityResult> {
  if (!reservationDate || !timeSlot || partySize < 1) {
    throw new AppError('Date, time slot, and valid party size (min 1) are required.', 400);
  }

  // Find active reservations for this date & slot
  const activeReservations = await Reservation.find({
    reservationDate,
    timeSlot,
    status: { $in: ['pending', 'confirmed', 'seated'] },
  }).exec();

  const reservedTableIds = activeReservations
    .map((r) => r.table?.toString())
    .filter(Boolean);

  // Query candidate tables matching capacity requirement that are not already booked
  const matchingTables = await Table.find({
    capacity: { $gte: partySize },
    isActive: true,
    isDeleted: { $ne: true },
    _id: { $nin: reservedTableIds },
  })
    .sort({ capacity: 1 })
    .exec();

  return {
    isAvailable: matchingTables.length > 0,
    availableTablesCount: matchingTables.length,
    matchingTables,
  };
}

export async function createReservation(
  userId: string,
  input: CreateReservationInput
): Promise<IReservation> {
  const { reservationDate, timeSlot, partySize, customerNotes, tableId } = input;

  if (!reservationDate || !timeSlot || !partySize) {
    throw new AppError('Date, time slot, and party size are required.', 400);
  }

  if (partySize < 1 || partySize > 20) {
    throw new AppError('Party size must be between 1 and 20 guests.', 400);
  }

  // Check date is not in the past
  const todayStr = new Date().toISOString().split('T')[0];
  if (reservationDate < todayStr) {
    throw new AppError('Reservation date cannot be in the past.', 400);
  }

  // Check availability & assign table
  const availability = await checkReservationAvailability(
    reservationDate,
    timeSlot,
    partySize
  );

  if (!availability.isAvailable) {
    throw new AppError(
      `No table available for ${partySize} guests at ${timeSlot} on ${reservationDate}. Please select another time slot.`,
      400
    );
  }

  let assignedTable: ITable | undefined = availability.matchingTables[0];

  if (tableId && mongoose.Types.ObjectId.isValid(tableId)) {
    const requestedTable = availability.matchingTables.find(
      (t) => t._id.toString() === tableId
    );
    if (requestedTable) {
      assignedTable = requestedTable;
    }
  }

  const reservation = await Reservation.create({
    user: new mongoose.Types.ObjectId(userId),
    table: assignedTable ? assignedTable._id : null,
    reservationDate,
    timeSlot,
    partySize,
    status: 'confirmed',
    customerNotes: customerNotes ? customerNotes.trim() : '',
  });

  return reservation.populate('table');
}

export async function getUserReservations(userId: string): Promise<IReservation[]> {
  return Reservation.find({ user: new mongoose.Types.ObjectId(userId) })
    .populate('table')
    .sort({ reservationDate: -1, createdAt: -1 })
    .exec();
}

export async function getUserReservationById(
  userId: string,
  reservationId: string
): Promise<IReservation> {
  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    throw new AppError('Invalid reservation ID format.', 400);
  }

  const reservation = await Reservation.findById(reservationId)
    .populate('table')
    .exec();

  if (!reservation) {
    throw new AppError('Reservation not found.', 404);
  }

  // Strict IDOR Authorization Check
  if (reservation.user.toString() !== userId) {
    throw new AppError('Permission denied. You cannot access another user\'s reservation.', 403);
  }

  return reservation;
}

export async function cancelUserReservation(
  userId: string,
  reservationId: string
): Promise<IReservation> {
  const reservation = await getUserReservationById(userId, reservationId);

  if (['cancelled', 'completed'].includes(reservation.status)) {
    throw new AppError(`Reservation is already ${reservation.status}.`, 400);
  }

  reservation.status = 'cancelled';
  await reservation.save();

  return reservation;
}
