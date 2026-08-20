import mongoose, { Schema } from 'mongoose';
const OrderItemSnapshotSchema = new Schema({
    itemType: {
        type: String,
        enum: ['STANDARD_ITEM', 'CUSTOM_MEAL'],
        required: true,
    },
    menuItemId: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        default: null,
    },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    portionChoice: { type: String, default: '' },
    sauceChoice: { type: String, default: '' },
    nutritionSnapshot: {
        calories: { type: Number, required: true, min: 0 },
        protein: { type: Number, required: true, min: 0 },
        carbs: { type: Number, required: true, min: 0 },
        fats: { type: Number, required: true, min: 0 },
    },
    fuelScore: { type: Number, required: true, min: 1, max: 100 },
    customOptionsSnapshot: [
        {
            optionId: { type: String, required: true },
            name: { type: String, required: true },
            category: { type: String, required: true },
            price: { type: Number, required: true, min: 0 },
            nutrition: {
                calories: { type: Number, required: true, min: 0 },
                protein: { type: Number, required: true, min: 0 },
                carbs: { type: Number, required: true, min: 0 },
                fats: { type: Number, required: true, min: 0 },
            },
            dietaryPreference: { type: String, default: '' },
        },
    ],
}, { _id: false });
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
const OrderSchema = new Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    orderType: {
        type: String,
        enum: ['delivery', 'dineIn'],
        required: true,
        index: true,
    },
    items: {
        type: [OrderItemSnapshotSchema],
        required: true,
        validate: [
            (val) => val.length > 0,
            'Order must contain at least one item.',
        ],
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    deliveryAddress: {
        type: DeliveryAddressSnapshotSchema,
        default: null,
    },
    table: { type: String, default: null },
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'preparing',
            'ready',
            'outForDelivery',
            'delivered',
            'completed',
            'cancelled',
        ],
        default: 'pending',
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
        index: true,
    },
    customerNotes: { type: String, default: '' },
}, {
    timestamps: true,
});
// Indexes
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
