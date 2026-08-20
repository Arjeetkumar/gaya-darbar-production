import mongoose, { Schema } from 'mongoose';
const DeliveryAddressSnapshotSchema = new Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    landmark: { type: String, default: '' },
}, { _id: false });
const CustomerSnapshotSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
}, { _id: false });
const DeliverySchema = new Schema({
    deliveryNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true,
        index: true,
    },
    orderNumber: {
        type: String,
        required: true,
        index: true,
    },
    rider: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    status: {
        type: String,
        enum: [
            'unassigned',
            'assigned',
            'picked_up',
            'out_for_delivery',
            'delivered',
            'failed',
            'cancelled',
        ],
        default: 'unassigned',
        index: true,
    },
    deliveryAddressSnapshot: {
        type: DeliveryAddressSnapshotSchema,
        required: true,
    },
    customerSnapshot: {
        type: CustomerSnapshotSchema,
        required: true,
    },
    assignedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    outForDeliveryAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    estimatedDeliveryTime: { type: Date, default: null },
    deliveryNotes: { type: String, default: '' },
    failureReason: { type: String, default: '' },
}, {
    timestamps: true,
});
// Secondary & Compound Indexes
DeliverySchema.index({ rider: 1, status: 1, createdAt: -1 });
DeliverySchema.index({ status: 1, createdAt: 1 });
export const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', DeliverySchema);
