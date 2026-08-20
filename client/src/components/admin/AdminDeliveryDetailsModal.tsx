import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  Clock,
  Truck,
  AlertTriangle,
  Ban,
  UserCheck,
} from 'lucide-react';
import type { Delivery, DeliveryRider } from '../../types/delivery';
import { getAvailableRiders } from '../../services/deliveryService';

interface AdminDeliveryDetailsModalProps {
  delivery: Delivery | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignRider: (deliveryId: string, riderId: string) => Promise<void>;
  onCancelDelivery: (deliveryId: string) => Promise<void>;
}

export const AdminDeliveryDetailsModal: React.FC<AdminDeliveryDetailsModalProps> = ({
  delivery,
  isOpen,
  onClose,
  onAssignRider,
  onCancelDelivery,
}) => {
  const [availableRiders, setAvailableRiders] = useState<DeliveryRider[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAvailableRiders()
        .then((riders) => setAvailableRiders(riders))
        .catch((err) => console.error('Failed to load riders:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (delivery && delivery.rider) {
      setSelectedRiderId(typeof delivery.rider === 'object' ? delivery.rider._id : delivery.rider);
    } else {
      setSelectedRiderId('');
    }
  }, [delivery]);

  if (!isOpen || !delivery) return null;

  const riderObj = typeof delivery.rider === 'object' && delivery.rider ? delivery.rider : null;

  const handleAssignClick = async () => {
    if (!selectedRiderId) return;
    setIsAssigning(true);
    setErrorMsg(null);
    try {
      await onAssignRider(delivery.id, selectedRiderId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign rider.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCancelClick = async () => {
    setIsCancelling(true);
    setErrorMsg(null);
    try {
      await onCancelDelivery(delivery.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel delivery.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Pending';
    return new Date(dateStr).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-[var(--gd-ivory)] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-[var(--gd-charcoal)]">
              {delivery.deliveryNumber}
            </span>
            <span className="rounded-full bg-zinc-900 px-3 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
              {delivery.orderNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Status & Priority Overview */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80">
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Created At</p>
              <p className="text-xs font-bold text-zinc-800">{formatDate(delivery.createdAt)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Delivery Status</p>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900 capitalize">
                {delivery.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Assigned Rider</p>
              <span className="text-xs font-bold text-zinc-900">
                {riderObj ? riderObj.name : 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Rider Assignment Control Box */}
          {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                <Truck size={16} className="text-indigo-600" /> Rider Dispatch Assignment
              </h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="flex-1 rounded-xl border border-indigo-200 bg-white py-2 px-3 text-xs font-semibold text-zinc-800 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">-- Select Available Rider --</option>
                  {availableRiders.map((r) => (
                    <option key={r.id || r._id} value={r.id || r._id}>
                      {r.name} ({r.email})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignClick}
                  disabled={isAssigning || !selectedRiderId}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <UserCheck size={15} />
                  <span>{isAssigning ? 'Assigning...' : riderObj ? 'Reassign Rider' : 'Assign Rider'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Customer Snapshot */}
          <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <User size={15} className="text-[var(--gd-forest)]" /> Customer Info Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-800">
              <div>
                <span className="text-zinc-500">Name: </span>
                <span className="font-bold text-zinc-900">{delivery.customerSnapshot.name}</span>
              </div>
              <div>
                <span className="text-zinc-500">Email: </span>
                <span>{delivery.customerSnapshot.email}</span>
              </div>
            </div>
          </div>

          {/* Frozen Delivery Address Snapshot */}
          <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <MapPin size={15} className="text-[var(--gd-forest)]" /> Frozen Delivery Address
            </h3>
            <div className="text-xs text-zinc-800 space-y-1 font-medium">
              <p className="font-bold text-zinc-900">
                {delivery.deliveryAddressSnapshot.fullName} ({delivery.deliveryAddressSnapshot.phone})
              </p>
              <p>
                {delivery.deliveryAddressSnapshot.addressLine1}{' '}
                {delivery.deliveryAddressSnapshot.addressLine2}
              </p>
              <p>
                {delivery.deliveryAddressSnapshot.city}, {delivery.deliveryAddressSnapshot.state} -{' '}
                {delivery.deliveryAddressSnapshot.postalCode}
              </p>
              {delivery.deliveryAddressSnapshot.landmark && (
                <p className="text-zinc-500 italic">
                  Landmark: {delivery.deliveryAddressSnapshot.landmark}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Milestone Timeline */}
          <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Clock size={15} className="text-[var(--gd-forest)]" /> Dispatch & Delivery Timeline
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-zinc-50 p-2.5">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase">Assigned</p>
                <p className="font-bold text-zinc-900">{formatDate(delivery.assignedAt)}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2.5">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase">Picked Up</p>
                <p className="font-bold text-zinc-900">{formatDate(delivery.pickedUpAt)}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2.5">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase">Out for Delivery</p>
                <p className="font-bold text-zinc-900">{formatDate(delivery.outForDeliveryAt)}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2.5">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase">Delivered</p>
                <p className="font-bold text-zinc-900">{formatDate(delivery.deliveredAt)}</p>
              </div>
            </div>
          </div>

          {/* Failure Reason */}
          {delivery.failureReason && (
            <div className="rounded-2xl bg-red-50 p-4 border border-red-200 text-xs text-red-900">
              <span className="font-bold">Failure Reason:</span> {delivery.failureReason}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-200 bg-[var(--gd-ivory)] p-5 flex justify-between items-center">
          {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && (
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancelClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Ban size={15} />
              <span>{isCancelling ? 'Cancelling...' : 'Cancel Delivery'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
