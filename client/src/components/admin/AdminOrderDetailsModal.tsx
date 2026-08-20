import React, { useState } from 'react';
import {
  X,
  User,
  MapPin,
  Utensils,
  AlertTriangle,
  Sparkles,
  Ban,
  Flame,
} from 'lucide-react';
import type { AdminOrder, AdminOrderCustomer } from '../../types/adminOrder';
import type { OrderStatus } from '../../types/order';

interface AdminOrderDetailsModalProps {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, newStatus: OrderStatus) => Promise<void>;
  onCancelOrder: (id: string) => Promise<void>;
}

export const AdminOrderDetailsModal: React.FC<AdminOrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onCancelOrder,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const customerObj =
    typeof order.user === 'object' && order.user !== null
      ? (order.user as AdminOrderCustomer)
      : null;

  const formattedDate = new Date(order.createdAt).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleStatusClick = async (newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    setErrorMsg(null);
    try {
      await onStatusUpdate(order.id, newStatus);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update order status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setErrorMsg(null);
    try {
      await onCancelOrder(order.id);
      setShowCancelConfirm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Determine valid next action buttons based on status
  const renderActionButtons = () => {
    if (order.status === 'completed' || order.status === 'cancelled') {
      return null;
    }

    const actions: { label: string; nextStatus: OrderStatus; colorClass: string }[] = [];

    switch (order.status) {
      case 'pending':
        actions.push(
          { label: 'Confirm Order', nextStatus: 'confirmed', colorClass: 'bg-blue-600 hover:bg-blue-700' },
          { label: 'Start Preparing', nextStatus: 'preparing', colorClass: 'bg-amber-600 hover:bg-amber-700' }
        );
        break;
      case 'confirmed':
        actions.push({ label: 'Start Preparing', nextStatus: 'preparing', colorClass: 'bg-amber-600 hover:bg-amber-700' });
        break;
      case 'preparing':
        actions.push({ label: 'Mark Ready', nextStatus: 'ready', colorClass: 'bg-emerald-600 hover:bg-emerald-700' });
        break;
      case 'ready':
        if (order.orderType === 'delivery') {
          actions.push(
            { label: 'Mark Out for Delivery', nextStatus: 'outForDelivery', colorClass: 'bg-indigo-600 hover:bg-indigo-700' },
            { label: 'Complete Order', nextStatus: 'completed', colorClass: 'bg-emerald-700 hover:bg-emerald-800' }
          );
        } else {
          actions.push({ label: 'Complete Order', nextStatus: 'completed', colorClass: 'bg-emerald-700 hover:bg-emerald-800' });
        }
        break;
      case 'outForDelivery':
        actions.push(
          { label: 'Mark Delivered', nextStatus: 'delivered', colorClass: 'bg-purple-600 hover:bg-purple-700' },
          { label: 'Complete Order', nextStatus: 'completed', colorClass: 'bg-emerald-700 hover:bg-emerald-800' }
        );
        break;
      case 'delivered':
        actions.push({ label: 'Complete Order', nextStatus: 'completed', colorClass: 'bg-emerald-700 hover:bg-emerald-800' });
        break;
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((act) => (
          <button
            key={act.nextStatus}
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => handleStatusClick(act.nextStatus)}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 ${act.colorClass}`}
          >
            {isUpdatingStatus ? 'Updating...' : act.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      {/* Overlay Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-[var(--gd-ivory)] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-[var(--gd-charcoal)]">
              {order.orderNumber}
            </span>
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-800">
              {order.orderType}
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

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 border border-red-200">
              <AlertTriangle size={16} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80">
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Placed On</p>
              <p className="text-xs font-bold text-zinc-800">{formattedDate}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Order Status</p>
              <span className="inline-flex rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900 capitalize">
                {order.status}
              </span>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Payment Status</p>
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900 capitalize">
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <User size={15} className="text-[var(--gd-forest)]" /> Customer Info
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-500">Name: </span>
                <span className="font-bold text-zinc-900">
                  {customerObj ? customerObj.name : 'Guest User'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Email: </span>
                <span className="font-semibold text-zinc-800">
                  {customerObj ? customerObj.email : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address / Dine-In Table */}
          {order.orderType === 'delivery' && order.deliveryAddress ? (
            <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <MapPin size={15} className="text-[var(--gd-forest)]" /> Delivery Address
              </h3>
              <div className="text-xs text-zinc-800 space-y-1 font-medium">
                <p className="font-bold text-zinc-900">{order.deliveryAddress.fullName} ({order.deliveryAddress.phone})</p>
                <p>{order.deliveryAddress.addressLine1} {order.deliveryAddress.addressLine2}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.postalCode}</p>
                {order.deliveryAddress.landmark && (
                  <p className="text-zinc-500 italic">Landmark: {order.deliveryAddress.landmark}</p>
                )}
              </div>
            </div>
          ) : order.table ? (
            <div className="rounded-2xl border border-zinc-200 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                <Utensils size={15} className="text-[var(--gd-forest)]" /> Dine-In Table
              </h3>
              <p className="text-sm font-bold text-zinc-900">Table: {order.table}</p>
            </div>
          ) : null}

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Customer Notes:</span> {order.customerNotes}
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Order Items ({order.items.length})
            </h3>
            {order.items.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/50 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--gd-charcoal)] text-xs font-bold text-white">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">{item.name}</p>
                      {item.itemType === 'CUSTOM_MEAL' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--gd-forest)] uppercase">
                          <Sparkles size={11} /> Custom Fuel Bowl
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-zinc-900">₹{item.totalPrice}</span>
                </div>

                {/* Choices */}
                {(item.portionChoice || item.sauceChoice) && (
                  <div className="flex gap-2 text-xs text-zinc-600">
                    {item.portionChoice && <span>Portion: <strong>{item.portionChoice}</strong></span>}
                    {item.sauceChoice && <span>Sauce: <strong>{item.sauceChoice}</strong></span>}
                  </div>
                )}

                {/* Custom Options Snapshot */}
                {item.customOptionsSnapshot && item.customOptionsSnapshot.length > 0 && (
                  <div className="mt-2 border-t border-zinc-200 pt-2 space-y-1 text-xs">
                    {item.customOptionsSnapshot.map((opt, optIdx) => (
                      <div key={optIdx} className="flex justify-between text-zinc-700">
                        <span>{opt.name}</span>
                        <span className="text-[10px] font-semibold text-zinc-500 capitalize">{opt.category}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nutrition & Fuel Score */}
                <div className="mt-2 flex items-center justify-between rounded-xl bg-white p-2.5 text-[11px] border border-zinc-200/60">
                  <div className="flex items-center gap-3 text-zinc-600 font-medium">
                    <span>{item.nutritionSnapshot.calories} kcal</span>
                    <span>P: {item.nutritionSnapshot.protein}g</span>
                    <span>C: {item.nutritionSnapshot.carbs}g</span>
                    <span>F: {item.nutritionSnapshot.fats}g</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-emerald-700">
                    <Flame size={12} className="text-emerald-500" />
                    <span>Score: {item.fuelScore}/100</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-2xl border border-zinc-200 p-4 space-y-2 text-xs bg-zinc-50">
            <h3 className="font-bold uppercase tracking-wider text-zinc-500 mb-2">Financial Breakdown</h3>
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Delivery Fee</span>
              <span>₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>GST / Tax</span>
              <span>₹{order.tax}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-zinc-900 border-t border-zinc-200 pt-2">
              <span>Total Amount</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="border-t border-zinc-200 bg-[var(--gd-ivory)] p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {renderActionButtons()}

            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
              >
                <Ban size={14} />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Overlay for Cancellation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-zinc-200 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h4 className="font-display text-lg font-bold text-zinc-900">
                Cancel Order {order.orderNumber}?
              </h4>
              <p className="mt-1 text-xs text-zinc-500 font-medium">
                This action cannot be undone. The order status will be permanently changed to cancelled.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
