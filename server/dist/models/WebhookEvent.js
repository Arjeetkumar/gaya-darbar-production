import mongoose, { Schema } from 'mongoose';
const WebhookEventSchema = new Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    eventType: {
        type: String,
        required: true,
    },
    providerOrderId: {
        type: String,
        default: null,
        index: true,
    },
    providerPaymentId: {
        type: String,
        default: null,
    },
    processedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
});
// TTL index to automatically clean up webhook events older than 90 days (7,776,000 seconds)
WebhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 7776000 });
export const WebhookEvent = mongoose.models.WebhookEvent ||
    mongoose.model('WebhookEvent', WebhookEventSchema);
