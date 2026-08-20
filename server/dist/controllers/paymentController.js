import { createRazorpayPaymentOrder, verifyPaymentSignature, processRazorpayWebhook, processAdminRefund, getAdminPaymentsList, } from '../services/paymentService.js';
export async function createPaymentOrderHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const { orderId } = req.body;
        if (!orderId) {
            res.status(400).json({
                success: false,
                error: { message: 'orderId is required.', statusCode: 400 },
            });
            return;
        }
        const result = await createRazorpayPaymentOrder(orderId, req.user._id.toString());
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function verifyPaymentHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const { orderId, razorpay_payment_id, razorpay_signature, razorpay_order_id } = req.body;
        const payment = await verifyPaymentSignature(req.user._id.toString(), {
            orderId,
            razorpay_payment_id,
            razorpay_signature,
            razorpay_order_id,
        });
        res.status(200).json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function handleWebhookHandler(req, res, next) {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const rawBuffer = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8');
        const result = await processRazorpayWebhook(rawBuffer, signature);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getAdminPaymentsHandler(req, res, next) {
    try {
        const { status, orderNumber, limit, page } = req.query;
        const data = await getAdminPaymentsList({
            status: typeof status === 'string' ? status : undefined,
            orderNumber: typeof orderNumber === 'string' ? orderNumber : undefined,
            limit: limit ? Number(limit) : undefined,
            page: page ? Number(page) : undefined,
        });
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function processAdminRefundHandler(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { message: 'Authentication required.', statusCode: 401 },
            });
            return;
        }
        const rawId = req.params.id;
        const paymentId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';
        const { amount, reason } = req.body;
        if (amount === undefined || amount === null) {
            res.status(400).json({
                success: false,
                error: { message: 'Refund amount is required.', statusCode: 400 },
            });
            return;
        }
        const updatedPayment = await processAdminRefund(paymentId, Number(amount), reason || 'Admin refund', { _id: req.user._id, name: req.user.name });
        res.status(200).json({
            success: true,
            data: updatedPayment,
        });
    }
    catch (error) {
        next(error);
    }
}
