import { Order } from '../models/Order.js';
import { KitchenTicket } from '../models/KitchenTicket.js';
import { Delivery } from '../models/Delivery.js';
import { User } from '../models/User.js';
import { Payment } from '../models/Payment.js';
import { AppError } from '../middleware/errorHandler.js';
/**
 * Validates and parses date range string parameters.
 * Defaults to last 30 days if unspecified.
 */
export function parseDateRange(dateFromStr, dateToStr) {
    const now = new Date();
    let dateTo = new Date(now);
    dateTo.setHours(23, 59, 59, 999);
    if (dateToStr) {
        const rawTo = new Date(dateToStr);
        if (isNaN(rawTo.getTime())) {
            throw new AppError('Invalid dateTo parameter. Must be a valid date string.', 400);
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateToStr.trim())) {
            const [y, m, d] = dateToStr.trim().split('-').map(Number);
            dateTo = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
        }
        else {
            dateTo = new Date(rawTo.getTime());
            dateTo.setHours(23, 59, 59, 999);
        }
    }
    let dateFrom = new Date(dateTo);
    dateFrom.setDate(dateFrom.getDate() - 30);
    dateFrom.setHours(0, 0, 0, 0);
    if (dateFromStr) {
        const rawFrom = new Date(dateFromStr);
        if (isNaN(rawFrom.getTime())) {
            throw new AppError('Invalid dateFrom parameter. Must be a valid date string.', 400);
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateFromStr.trim())) {
            const [y, m, d] = dateFromStr.trim().split('-').map(Number);
            dateFrom = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
        }
        else {
            dateFrom = new Date(rawFrom.getTime());
            dateFrom.setHours(0, 0, 0, 0);
        }
    }
    if (dateFrom > dateTo) {
        throw new AppError('dateFrom parameter cannot be after dateTo parameter.', 400);
    }
    return { dateFrom, dateTo };
}
/**
 * 1. Overview KPI Analytics
 */
export async function getOverviewAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const orderStats = await Order.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                cancelledOrders: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                totalRevenue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] } },
                validOrdersCount: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] } },
            },
        },
    ]);
    const stats = orderStats[0] || {
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        validOrdersCount: 0,
    };
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const newCustomers = await User.countDocuments({
        role: 'customer',
        createdAt: { $gte: dateFrom, $lte: dateTo },
    });
    const averageOrderValue = stats.validOrdersCount > 0 ? Math.round(stats.totalRevenue / stats.validOrdersCount) : 0;
    return {
        totalOrders: stats.totalOrders,
        completedOrders: stats.completedOrders,
        cancelledOrders: stats.cancelledOrders,
        totalRevenue: stats.totalRevenue,
        averageOrderValue,
        totalCustomers,
        newCustomers,
    };
}
/**
 * 2. Order Analytics Breakdown
 */
export async function getOrderAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    // Daily Orders Breakdown
    const dailyOrders = await Order.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: { $sum: 1 },
                revenue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] } },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                orders: 1,
                revenue: 1,
            },
        },
    ]);
    // By Status Breakdown
    const byStatus = await Order.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1,
            },
        },
    ]);
    // By Order Type Breakdown
    const byOrderType = await Order.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: '$orderType',
                count: { $sum: 1 },
                revenue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$total', 0] } },
            },
        },
        {
            $project: {
                _id: 0,
                orderType: '$_id',
                count: 1,
                revenue: 1,
            },
        },
    ]);
    return {
        dailyOrders,
        byStatus,
        byOrderType,
    };
}
/**
 * 3. Revenue Analytics Breakdown
 */
export async function getRevenueAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const revenueSummary = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                validOrderCount: { $sum: 1 },
            },
        },
    ]);
    const totalRevenue = revenueSummary[0]?.totalRevenue || 0;
    const validOrderCount = revenueSummary[0]?.validOrderCount || 0;
    const averageOrderValue = validOrderCount > 0 ? Math.round(totalRevenue / validOrderCount) : 0;
    // Revenue by Order Type
    const revenueByOrderType = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: '$orderType',
                revenue: { $sum: '$total' },
                orders: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                orderType: '$_id',
                revenue: 1,
                orders: 1,
            },
        },
    ]);
    // Revenue Trend (Daily)
    const revenueTrend = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                revenue: { $sum: '$total' },
                orders: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id',
                revenue: 1,
                orders: 1,
            },
        },
    ]);
    return {
        totalRevenue,
        averageOrderValue,
        currency: 'INR',
        revenueByOrderType,
        revenueTrend,
    };
}
/**
 * Payment Analytics Breakdown (Gross Volume, Refunded Amount, Net Collected, Success Rate)
 */
export async function getPaymentAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const paymentAggregation = await Payment.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                successfulCount: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['paid', 'partially_refunded', 'refunded']] }, 1, 0],
                    },
                },
                failedCount: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
                    },
                },
                grossPaymentVolume: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['paid', 'partially_refunded', 'refunded']] }, '$amount', 0],
                    },
                },
                refundedAmount: {
                    $sum: '$refundedAmount',
                },
            },
        },
    ]);
    const stats = paymentAggregation[0] || {
        totalPayments: 0,
        successfulCount: 0,
        failedCount: 0,
        grossPaymentVolume: 0,
        refundedAmount: 0,
    };
    const grossPaymentVolume = stats.grossPaymentVolume;
    const refundedAmount = stats.refundedAmount;
    const netCollected = Math.max(0, grossPaymentVolume - refundedAmount);
    const successRate = stats.totalPayments > 0
        ? Math.round((stats.successfulCount / stats.totalPayments) * 100)
        : 0;
    return {
        totalPayments: stats.totalPayments,
        successfulCount: stats.successfulCount,
        failedCount: stats.failedCount,
        grossPaymentVolume,
        refundedAmount,
        netCollected,
        successRate,
    };
}
/**
 * 4. Kitchen Performance Analytics
 */
export async function getKitchenAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const ticketStats = await KitchenTicket.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: null,
                totalTickets: { $sum: 1 },
                completedTickets: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                cancelledTickets: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                pendingTickets: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            },
        },
    ]);
    const stats = ticketStats[0] || {
        totalTickets: 0,
        completedTickets: 0,
        cancelledTickets: 0,
        pendingTickets: 0,
    };
    // Status Distribution
    const statusDistribution = await KitchenTicket.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1,
            },
        },
    ]);
    // Prep duration calculation (startedAt -> readyAt)
    const prepDurationCalc = await KitchenTicket.aggregate([
        {
            $match: {
                createdAt: { $gte: dateFrom, $lte: dateTo },
                startedAt: { $ne: null },
                readyAt: { $ne: null },
            },
        },
        {
            $project: {
                durationMinutes: {
                    $divide: [{ $subtract: ['$readyAt', '$startedAt'] }, 60000],
                },
            },
        },
        {
            $group: {
                _id: null,
                avgDurationMinutes: { $avg: '$durationMinutes' },
            },
        },
    ]);
    const averagePreparationMinutes = prepDurationCalc[0]?.avgDurationMinutes
        ? Math.round(prepDurationCalc[0].avgDurationMinutes * 10) / 10
        : null;
    return {
        totalTickets: stats.totalTickets,
        completedTickets: stats.completedTickets,
        cancelledTickets: stats.cancelledTickets,
        pendingTickets: stats.pendingTickets,
        averagePreparationMinutes,
        statusDistribution,
    };
}
/**
 * 5. Delivery Operations Analytics
 */
export async function getDeliveryAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const deliveryStats = await Delivery.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: null,
                totalDeliveries: { $sum: 1 },
                delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                active: {
                    $sum: {
                        $cond: [
                            { $in: ['$status', ['assigned', 'picked_up', 'out_for_delivery']] },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
    ]);
    const stats = deliveryStats[0] || {
        totalDeliveries: 0,
        delivered: 0,
        failed: 0,
        cancelled: 0,
        active: 0,
    };
    // Status Distribution
    const statusDistribution = await Delivery.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1,
            },
        },
    ]);
    // Delivery Duration Calculation (pickedUpAt -> deliveredAt)
    const durationCalc = await Delivery.aggregate([
        {
            $match: {
                createdAt: { $gte: dateFrom, $lte: dateTo },
                pickedUpAt: { $ne: null },
                deliveredAt: { $ne: null },
            },
        },
        {
            $project: {
                durationMinutes: {
                    $divide: [{ $subtract: ['$deliveredAt', '$pickedUpAt'] }, 60000],
                },
            },
        },
        {
            $group: {
                _id: null,
                avgDurationMinutes: { $avg: '$durationMinutes' },
            },
        },
    ]);
    const averageDeliveryMinutes = durationCalc[0]?.avgDurationMinutes
        ? Math.round(durationCalc[0].avgDurationMinutes * 10) / 10
        : null;
    return {
        totalDeliveries: stats.totalDeliveries,
        delivered: stats.delivered,
        failed: stats.failed,
        cancelled: stats.cancelled,
        active: stats.active,
        averageDeliveryMinutes,
        statusDistribution,
    };
}
/**
 * 6. Rider Performance Analytics
 */
export async function getRiderAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const riderStats = await Delivery.aggregate([
        {
            $match: {
                rider: { $ne: null },
                createdAt: { $gte: dateFrom, $lte: dateTo },
            },
        },
        {
            $group: {
                _id: '$rider',
                assignedDeliveries: { $sum: 1 },
                completedDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                failedDeliveries: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                avgDurationMinutes: {
                    $avg: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ['$pickedUpAt', null] },
                                    { $ne: ['$deliveredAt', null] },
                                ],
                            },
                            { $divide: [{ $subtract: ['$deliveredAt', '$pickedUpAt'] }, 60000] },
                            null,
                        ],
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'riderUser',
            },
        },
        { $unwind: '$riderUser' },
        {
            $project: {
                _id: 1,
                name: '$riderUser.name',
                email: '$riderUser.email',
                assignedDeliveries: 1,
                completedDeliveries: 1,
                failedDeliveries: 1,
                avgDurationMinutes: 1,
            },
        },
    ]);
    return riderStats.map((r) => {
        const completionRate = r.assignedDeliveries > 0
            ? Math.round((r.completedDeliveries / r.assignedDeliveries) * 1000) / 10
            : 0;
        return {
            _id: r._id,
            name: r.name,
            assignedDeliveries: r.assignedDeliveries,
            completedDeliveries: r.completedDeliveries,
            failedDeliveries: r.failedDeliveries,
            completionRate,
            averageDeliveryMinutes: r.avgDurationMinutes ? Math.round(r.avgDurationMinutes * 10) / 10 : null,
        };
    });
}
/**
 * 7. Menu Performance Analytics (Using Historical Snapshots)
 */
export async function getMenuPerformanceAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const menuStats = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: dateFrom, $lte: dateTo } } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.name',
                itemType: { $first: '$items.itemType' },
                quantitySold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.totalPrice' },
            },
        },
        { $sort: { totalRevenue: -1 } },
        {
            $project: {
                _id: 0,
                name: '$_id',
                itemType: 1,
                quantitySold: 1,
                totalRevenue: 1,
                averagePrice: {
                    $cond: [{ $gt: ['$quantitySold', 0] }, { $round: [{ $divide: ['$totalRevenue', '$quantitySold'] }, 0] }, 0],
                },
            },
        },
    ]);
    return menuStats;
}
/**
 * 8. Customer Analytics
 */
export async function getCustomerAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const newCustomers = await User.countDocuments({
        role: 'customer',
        createdAt: { $gte: dateFrom, $lte: dateTo },
    });
    // Active Customers in range (placed at least 1 order)
    const activeCustomerIds = await Order.distinct('user', {
        createdAt: { $gte: dateFrom, $lte: dateTo },
    });
    // Repeat Customer calculation
    const repeatCustomerGroup = await Order.aggregate([
        { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
        { $group: { _id: '$user', orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gte: 2 } } },
    ]);
    const repeatCustomersCount = repeatCustomerGroup.length;
    // Goal Distribution
    const goalDistribution = await User.aggregate([
        { $match: { role: 'customer', fitnessGoal: { $ne: null } } },
        { $group: { _id: '$fitnessGoal', count: { $sum: 1 } } },
        { $project: { _id: 0, goal: '$_id', count: 1 } },
    ]);
    // Dietary Preference Distribution
    const dietaryDistribution = await User.aggregate([
        { $match: { role: 'customer', dietaryPreference: { $ne: null } } },
        { $group: { _id: '$dietaryPreference', count: { $sum: 1 } } },
        { $project: { _id: 0, diet: '$_id', count: 1 } },
    ]);
    return {
        totalCustomers,
        newCustomers,
        activeCustomers: activeCustomerIds.length,
        repeatCustomers: repeatCustomersCount,
        goalDistribution,
        dietaryDistribution,
    };
}
/**
 * 9. Fuel & Nutrition Analytics (From Historical Item Snapshots)
 */
export async function getNutritionAnalytics(dateFromStr, dateToStr) {
    const { dateFrom, dateTo } = parseDateRange(dateFromStr, dateToStr);
    const nutritionStats = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: dateFrom, $lte: dateTo } } },
        { $unwind: '$items' },
        {
            $group: {
                _id: null,
                totalItems: { $sum: 1 },
                avgFuelScore: { $avg: '$items.fuelScore' },
                avgCalories: { $avg: '$items.nutritionSnapshot.calories' },
                avgProtein: { $avg: '$items.nutritionSnapshot.protein' },
                avgCarbs: { $avg: '$items.nutritionSnapshot.carbs' },
                avgFats: { $avg: '$items.nutritionSnapshot.fats' },
                highProteinItems: {
                    $sum: {
                        $cond: [{ $gte: ['$items.nutritionSnapshot.protein', 35] }, 1, 0],
                    },
                },
            },
        },
    ]);
    const stats = nutritionStats[0];
    if (!stats || stats.totalItems === 0) {
        return {
            averageFuelScore: null,
            averageCalories: null,
            averageProtein: null,
            averageCarbs: null,
            averageFats: null,
            highProteinOrderPercentage: 0,
        };
    }
    const highProteinOrderPercentage = Math.round((stats.highProteinItems / stats.totalItems) * 1000) / 10;
    return {
        averageFuelScore: Math.round((stats.avgFuelScore || 0) * 10) / 10,
        averageCalories: Math.round(stats.avgCalories || 0),
        averageProtein: Math.round((stats.avgProtein || 0) * 10) / 10,
        averageCarbs: Math.round((stats.avgCarbs || 0) * 10) / 10,
        averageFats: Math.round((stats.avgFats || 0) * 10) / 10,
        highProteinOrderPercentage,
    };
}
