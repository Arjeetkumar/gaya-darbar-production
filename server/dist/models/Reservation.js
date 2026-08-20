import mongoose, { Schema } from 'mongoose';
const ReservationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    table: {
        type: Schema.Types.ObjectId,
        ref: 'Table',
        default: null,
    },
    reservationDate: {
        type: String,
        required: true,
        index: true,
    },
    timeSlot: {
        type: String,
        required: true,
    },
    partySize: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'seated', 'cancelled', 'completed', 'noShow'],
        default: 'confirmed',
        index: true,
    },
    customerNotes: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});
// Indexes
ReservationSchema.index({ user: 1, reservationDate: -1 });
ReservationSchema.index({ table: 1, reservationDate: 1, timeSlot: 1 });
ReservationSchema.index({ status: 1, reservationDate: 1 });
export const Reservation = mongoose.models.Reservation ||
    mongoose.model('Reservation', ReservationSchema);
