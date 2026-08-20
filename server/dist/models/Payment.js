import mongoose, { Schema } from 'mongoose';
const PaymentSchema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    orderNumber: {
        type: String,
        required: true,
        index: true,
    },
    provider: {
        type: String,
        default: 'razorpay',
    },
    providerOrderId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    providerPaymentId: {
        type: String,
        default: null,
        index: true,
    },
    providerSignature: {
        type: String,
        default: null,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    amountInPaise: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'partially_refunded', 'refunded'],
        default: 'pending',
        index: true,
    },
    isPending: {
        type: Boolean,
        default: true,
        index: true,
    },
    method: {
        type: String,
        default: null,
    },
    failureReason: {
        type: String,
        default: null,
    },
    refundId: {
        type: String,
        default: null,
    },
    refundedAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    refundsList: [
        {
            refundId: { type: String, required: true },
            amount: { type: Number, required: true },
            reason: { type: String, default: '' },
            status: { type: String, default: 'processed' },
            createdAt: { type: Date, default: Date.now },
            createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        },
    ],
}, {
    timestamps: true,
});
// Indexes
PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
// Partial unique index enforcing at most ONE pending payment attempt per order
PaymentSchema.index({ order: 1, isPending: 1 }, { unique: true, partialFilterExpression: { isPending: true } });
export const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
