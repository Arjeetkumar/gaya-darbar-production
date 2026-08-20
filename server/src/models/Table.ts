import mongoose, { Schema, Document, Model } from 'mongoose';

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface ITable extends Document {
  _id: mongoose.Types.ObjectId;
  tableNumber: string;
  qrCodeIdentifier: string;
  capacity: number;
  status: TableStatus;
  location: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ISafeTable;
}

export interface ISafeTable {
  id: string;
  _id: string;
  tableNumber: string;
  qrCodeIdentifier: string;
  capacity: number;
  status: TableStatus;
  location: string;
  isActive: boolean;
}

const TableSchema = new Schema<ITable>(
  {
    tableNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    qrCodeIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
      index: true,
    },
    location: {
      type: String,
      default: 'Main Dining',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TableSchema.index({ qrCodeIdentifier: 1, isActive: 1, isDeleted: 1 });

TableSchema.methods.toSafeObject = function (): ISafeTable {
  const obj = this.toObject();
  return {
    id: obj._id.toString(),
    _id: obj._id.toString(),
    tableNumber: obj.tableNumber,
    qrCodeIdentifier: obj.qrCodeIdentifier,
    capacity: obj.capacity,
    status: obj.status,
    location: obj.location,
    isActive: obj.isActive,
  };
};

export const Table: Model<ITable> =
  mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema);
