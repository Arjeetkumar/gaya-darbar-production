import mongoose, { Schema } from 'mongoose';
const NotificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: [
            'ORDER_PLACED',
            'ORDER_CONFIRMED',
            'ORDER_PREPARING',
            'ORDER_READY',
            'ORDER_OUT_FOR_DELIVERY',
            'ORDER_DELIVERED',
            'ORDER_CANCELLED',
            'DELIVERY_ASSIGNED',
            'DELIVERY_PICKED_UP',
            'DELIVERY_FAILED',
            'PAYMENT_SUCCESS',
            'PAYMENT_FAILED',
            'REFUND_INITIATED',
            'REFUND_COMPLETED',
            'REFUND_FAILED',
            'SYSTEM',
        ],
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        default: null,
        index: true,
    },
    orderNumber: {
        type: String,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});
// Indexes for performance
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ order: 1, createdAt: -1 });
export const Notification = mongoose.models.Notification ||
    mongoose.model('Notification', NotificationSchema);
