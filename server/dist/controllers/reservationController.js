import { createReservation, getUserReservations, getUserReservationById, cancelUserReservation, checkReservationAvailability, } from '../services/reservationService.js';
export async function checkAvailabilityHandler(req, res, next) {
    try {
        const date = req.query.date;
        const timeSlot = req.query.timeSlot;
        const partySize = parseInt(req.query.partySize, 10) || 2;
        if (!date || !timeSlot) {
            res.status(400).json({
                success: false,
                error: { message: 'Query parameters date and timeSlot are required.', statusCode: 400 },
            });
            return;
        }
        const availability = await checkReservationAvailability(date, timeSlot, partySize);
        res.status(200).json({
            success: true,
            data: availability,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function createReservationHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const reservation = await createReservation(req.user._id.toString(), req.body);
        res.status(201).json({
            success: true,
            data: reservation,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getUserReservationsHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const reservations = await getUserReservations(req.user._id.toString());
        res.status(200).json({
            success: true,
            data: reservations,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getUserReservationByIdHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const rawId = req.params.id;
        const reservationId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        if (!reservationId) {
            res.status(400).json({
                success: false,
                error: { message: 'Reservation ID parameter is required.', statusCode: 400 },
            });
            return;
        }
        const reservation = await getUserReservationById(req.user._id.toString(), reservationId);
        res.status(200).json({
            success: true,
            data: reservation,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function cancelUserReservationHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const rawId = req.params.id;
        const reservationId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        if (!reservationId) {
            res.status(400).json({
                success: false,
                error: { message: 'Reservation ID parameter is required.', statusCode: 400 },
            });
            return;
        }
        const updated = await cancelUserReservation(req.user._id.toString(), reservationId);
        res.status(200).json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
