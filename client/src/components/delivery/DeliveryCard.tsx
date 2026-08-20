import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Navigation,
} from 'lucide-react';
import type { Delivery, DeliveryStatus } from '../../types/delivery';

interface DeliveryCardProps {
  delivery: Delivery;
  onStatusUpdate: (deliveryId: string, status: DeliveryStatus, failureReason?: string) => Promise<void>;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showFailureModal, setShowFailureModal] = useState<boolean>(false);
  const [failureReasonInput, setFailureReasonInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNextStatus = async () => {
    let nextStatus: DeliveryStatus | null = null;
    if (delivery.status === 'assigned') nextStatus = 'picked_up';
    else if (delivery.status === 'picked_up') nextStatus = 'out_for_delivery';
    else if (delivery.status === 'out_for_delivery') nextStatus = 'delivered';

    if (!nextStatus) return;

    setIsUpdating(true);
    setErrorMsg(null);

    try {
      await onStatusUpdate(delivery.id, nextStatus);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update delivery status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmFailure = async () => {
    if (!failureReasonInput.trim()) {
      setErrorMsg('Please specify a failure reason.');
      return;
    }

    setIsUpdating(true);
    setErrorMsg(null);

    try {
      await onStatusUpdate(delivery.id, 'failed', failureReasonInput.trim());
      setShowFailureModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to report delivery issue.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = new Date(delivery.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-md space-y-4">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-[var(--gd-charcoal)]">
              {delivery.deliveryNumber}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-700">
              {delivery.orderNumber}
            </span>
          </div>
          <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Assigned at {formattedDate}</p>
        </div>

        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 capitalize">
          {delivery.status.replace('_', ' ')}
        </span>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
          <AlertTriangle size={15} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Customer Snapshot & Quick Call Button */}
      <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={16} className="text-[var(--gd-forest)]" />
            <span className="font-bold text-sm text-zinc-900">{delivery.customerSnapshot.name}</span>
          </div>

          {delivery.customerSnapshot.phone && (
            <a
              href={`tel:${delivery.customerSnapshot.phone}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <Phone size={13} />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>

      {/* Delivery Destination Address */}
      <div className="rounded-2xl bg-emerald-50/40 p-4 border border-emerald-200/60 space-y-1 text-xs text-emerald-950">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
          <MapPin size={16} className="text-[var(--gd-forest)] shrink-0" />
          <span>Delivery Destination Snapshot</span>
        </div>
        <p className="font-bold text-zinc-900">
          {delivery.deliveryAddressSnapshot.fullName} ({delivery.deliveryAddressSnapshot.phone})
        </p>
        <p className="font-medium text-zinc-800">
          {delivery.deliveryAddressSnapshot.addressLine1} {delivery.deliveryAddressSnapshot.addressLine2}
        </p>
        <p className="font-medium text-zinc-800">
          {delivery.deliveryAddressSnapshot.city}, {delivery.deliveryAddressSnapshot.state} -{' '}
          {delivery.deliveryAddressSnapshot.postalCode}
        </p>
        {delivery.deliveryAddressSnapshot.landmark && (
          <p className="text-zinc-500 italic mt-1">
            Landmark: {delivery.deliveryAddressSnapshot.landmark}
          </p>
        )}
      </div>

      {/* Linked Order Summary */}
      {delivery.order && (
        <div className="rounded-2xl border border-zinc-200 p-4 text-xs space-y-2">
          <div className="flex justify-between font-bold text-zinc-900 border-b border-zinc-100 pb-2">
            <span>Order Summary ({delivery.order.items?.length || 0} items)</span>
            <span>Total: ₹{delivery.order.total}</span>
          </div>
          {delivery.order.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-zinc-700 font-medium">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>₹{item.totalPrice}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
        {delivery.status === 'assigned' && (
          <button
            type="button"
            onClick={handleNextStatus}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 text-xs font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition-all"
          >
            <PackageCheck size={18} />
            <span>{isUpdating ? 'Updating...' : 'MARK PICKED UP FROM RESTAURANT'}</span>
          </button>
        )}

        {delivery.status === 'picked_up' && (
          <button
            type="button"
            onClick={handleNextStatus}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            <Navigation size={18} />
            <span>{isUpdating ? 'Updating...' : 'START DELIVERY (OUT FOR DELIVERY)'}</span>
          </button>
        )}

        {delivery.status === 'out_for_delivery' && (
          <button
            type="button"
            onClick={handleNextStatus}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 size={18} />
            <span>{isUpdating ? 'Updating...' : 'MARK DELIVERED TO CUSTOMER'}</span>
          </button>
        )}

        {delivery.status === 'delivered' && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={16} />
            <span>Delivered Successfully</span>
          </div>
        )}

        {delivery.status !== 'delivered' && delivery.status !== 'cancelled' && delivery.status !== 'failed' && (
          <button
            type="button"
            onClick={() => setShowFailureModal(true)}
            className="w-full text-center text-xs font-semibold text-red-600 hover:underline pt-1"
          >
            Report Issue / Mark Failed
          </button>
        )}
      </div>

      {/* Failure Reason Input Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h4 className="font-display text-lg font-bold text-zinc-900">Report Delivery Issue</h4>
            <p className="text-xs text-zinc-500">
              Please specify why this delivery could not be completed (e.g. Customer unavailable, wrong address).
            </p>
            <textarea
              value={failureReasonInput}
              onChange={(e) => setFailureReasonInput(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              className="w-full rounded-xl border border-zinc-300 p-3 text-xs font-medium focus:border-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowFailureModal(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleConfirmFailure}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isUpdating ? 'Submitting...' : 'Submit Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
