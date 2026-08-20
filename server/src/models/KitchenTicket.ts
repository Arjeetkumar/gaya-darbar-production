import mongoose, { Schema, Document, Model } from 'mongoose';
import { ItemType } from './Order.js';

export type KitchenTicketStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type KitchenTicketPriority = 'normal' | 'high' | 'urgent';

export interface IKitchenCustomOptionSnapshot {
  name: string;
  category: string;
  quantity?: number;
}

export interface IKitchenItemSnapshot {
  itemType: ItemType;
  name: string;
  quantity: number;
  portionChoice?: string;
  sauceChoice?: string;
  customOptionsSnapshot?: IKitchenCustomOptionSnapshot[];
}

export interface IKitchenTicket extends Document {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IKitchenItemSnapshot[];
  status: KitchenTicketStatus;
  priority: KitchenTicketPriority;
  customerNotes?: string;
  startedAt?: Date | null;
  readyAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const KitchenCustomOptionSnapshotSchema = new Schema<IKitchenCustomOptionSnapshot>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const KitchenItemSnapshotSchema = new Schema<IKitchenItemSnapshot>(
  {
    itemType: {
      type: String,
      enum: ['STANDARD_ITEM', 'CUSTOM_MEAL'],
      required: true,
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    portionChoice: { type: String, default: '' },
    sauceChoice: { type: String, default: '' },
    customOptionsSnapshot: [KitchenCustomOptionSnapshotSchema],
  },
  { _id: false }
);

const KitchenTicketSchema = new Schema<IKitchenTicket>(
  {
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
    items: {
      type: [KitchenItemSnapshotSchema],
      required: true,
      validate: [
        (val: IKitchenItemSnapshot[]) => val.length > 0,
        'Kitchen ticket must contain at least one item.',
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    customerNotes: { type: String, default: '' },
    startedAt: { type: Date, default: null },
    readyAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Secondary & Compound Indexes
KitchenTicketSchema.index({ status: 1, createdAt: 1 });

export const KitchenTicket: Model<IKitchenTicket> =
  mongoose.models.KitchenTicket ||
  mongoose.model<IKitchenTicket>('KitchenTicket', KitchenTicketSchema);
