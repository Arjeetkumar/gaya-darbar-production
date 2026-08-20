import { getAdminDeliveries, getAvailableRiders, getDeliveryById, assignDeliveryRider, reassignDeliveryRider, cancelDelivery, getMyDeliveries, getMyDeliveryById, updateRiderDeliveryStatus, } from '../services/deliveryService.js';
// ====================================================
// ADMIN & MANAGER CONTROLLERS
// ====================================================
export async function getAdminDeliveriesHandler(req, res, next) {
    try {
        const { page, limit, search, status, rider, dateFrom, dateTo } = req.query;
        const result = await getAdminDeliveries({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            search: typeof search === 'string' ? search : undefined,
            status: typeof status === 'string' ? status : undefined,
            rider: typeof rider === 'string' ? rider : undefined,
            dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
            dateTo: typeof dateTo === 'string' ? dateTo : undefined,
        });
        res.status(200).json({
            success: true,
            data: result.deliveries,
            pagination: result.pagination,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getAvailableRidersHandler(_req, res, next) {
    try {
        const riders = await getAvailableRiders();
        res.status(200).json({
            success: true,
            data: riders,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getAdminDeliveryByIdHandler(req, res, next) {
    try {
        const rawId = req.params.id;
        const deliveryId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const delivery = await getDeliveryById(deliveryId);
        res.status(200).json({
            success: true,
            data: delivery,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function assignDeliveryRiderHandler(req, res, next) {
    try {
        const rawId = req.params.id;
        const deliveryId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const { riderId } = req.body;
        if (!riderId || typeof riderId !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: 'Field riderId is required in request body.', statusCode: 400 },
            });
            return;
        }
        const updated = await assignDeliveryRider(deliveryId, riderId);
        res.status(200).json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function reassignDeliveryRiderHandler(req, res, next) {
    try {
        const rawId = req.params.id;
        const deliveryId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const { riderId } = req.body;
        if (!riderId || typeof riderId !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: 'Field riderId is required in request body.', statusCode: 400 },
            });
            return;
        }
        const updated = await reassignDeliveryRider(deliveryId, riderId);
        res.status(200).json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function cancelDeliveryHandler(req, res, next) {
    try {
        const rawId = req.params.id;
        const deliveryId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const cancelled = await cancelDelivery(deliveryId);
        res.status(200).json({
            success: true,
            data: cancelled,
        });
    }
    catch (error) {
        next(error);
    }
}
// ====================================================
// RIDER DASHBOARD CONTROLLERS
// ====================================================
export async function getMyDeliveriesHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const { status } = req.query;
        const deliveries = await getMyDeliveries(req.user._id.toString(), typeof status === 'string' ? status : undefined);
        res.status(200).json({
            success: true,
            data: deliveries,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getMyDeliveryByIdHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const rawId = req.params.id;
        const deliveryId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const delivery = await getMyDeliveryById(deliveryId, req.user._id.toString());
        res.status(200).json({
            success: true,
            data: delivery,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateMyDeliveryStatusHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const rawId = req.params.id;
        const deliveryId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const { status, failureReason } = req.body;
        if (!status || typeof status !== 'string') {
            res.status(400).json({
                success: false,
                error: { message: 'Field status is required in request body.', statusCode: 400 },
            });
            return;
        }
        const updated = await updateRiderDeliveryStatus(deliveryId, req.user._id.toString(), status, typeof failureReason === 'string' ? failureReason : undefined);
        res.status(200).json({
            success: true,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
