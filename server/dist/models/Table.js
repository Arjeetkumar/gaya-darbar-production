import mongoose, { Schema } from 'mongoose';
const TableSchema = new Schema({
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
}, {
    timestamps: true,
});
TableSchema.index({ qrCodeIdentifier: 1, isActive: 1, isDeleted: 1 });
TableSchema.methods.toSafeObject = function () {
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
export const Table = mongoose.models.Table || mongoose.model('Table', TableSchema);
