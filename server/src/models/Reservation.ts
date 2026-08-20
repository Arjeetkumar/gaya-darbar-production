import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'cancelled'
  | 'completed'
  | 'noShow';

export interface IReservation extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  table?: mongoose.Types.ObjectId | null;
  reservationDate: string; // YYYY-MM-DD
  timeSlot: string;
  partySize: number;
  status: ReservationStatus;
  customerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
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
  },
  {
    timestamps: true,
  }
);

// Indexes
ReservationSchema.index({ user: 1, reservationDate: -1 });
ReservationSchema.index({ table: 1, reservationDate: 1, timeSlot: 1 });
ReservationSchema.index({ status: 1, reservationDate: 1 });

export const Reservation: Model<IReservation> =
  mongoose.models.Reservation ||
  mongoose.model<IReservation>('Reservation', ReservationSchema);
