import { getAdminOrders, getAdminOrderById, updateAdminOrderStatus, cancelAdminOrder, } from '../services/adminOrderService.js';
export async function getAdminOrdersHandler(req, res, next) {
    try {
        const { page, limit, search, status, orderType, paymentStatus, dateFrom, dateTo, sort } = req.query;
        const result = await getAdminOrders({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            search: typeof search === 'string' ? search : undefined,
            status: typeof status === 'string' ? status : undefined,
            orderType: typeof orderType === 'string' ? orderType : undefined,
            paymentStatus: typeof paymentStatus === 'string' ? paymentStatus : undefined,
            dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
            dateTo: typeof dateTo === 'string' ? dateTo : undefined,
            sort: typeof sort === 'string' ? sort : undefined,
        });
        res.status(200).json({
            success: true,
            data: result.orders,
            pagination: result.pagination,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getAdminOrderByIdHandler(req, res, next) {
    try {
        const rawId = req.params.id;
        const orderId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const order = await getAdminOrderById(orderId);
        res.status(200).json({
            success: true,
            data: order,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function updateAdminOrderStatusHandler(req, res, next) {
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
        const updatedOrder = await updateAdminOrderStatus(orderId, status, {
            userId: req.user._id.toString(),
            role: req.user.role,
        });
        res.status(200).json({
            success: true,
            data: updatedOrder,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function cancelAdminOrderHandler(req, res, next) {
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
        const cancelledOrder = await cancelAdminOrder(orderId, {
            userId: req.user._id.toString(),
            role: req.user.role,
        });
        res.status(200).json({
            success: true,
            data: cancelledOrder,
            message: 'Order successfully cancelled.',
        });
    }
    catch (error) {
        next(error);
    }
}
