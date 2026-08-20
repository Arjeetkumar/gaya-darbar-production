import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  UtensilsCrossed,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  UserCheck,
  Flame,
} from 'lucide-react';
import { getStoredToken } from '../services/authService';

interface TimelineStep {
  type: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'cancelled';
  timestamp?: string | null;
}

interface TrackingData {
  order: any;
  kitchenStatus: string | null;
  deliveryStatus: string | null;
  deliveryRider: { name: string } | null;
  timeline: TimelineStep[];
}

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPollingRef = useRef(false);

  const fetchTracking = useCallback(
    async (isBackground = false) => {
      if (!id || isPollingRef.current) return;
      isPollingRef.current = true;

      if (!isBackground) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const token = getStoredToken();
        const response = await fetch(`/api/v1/orders/${encodeURIComponent(id)}/tracking`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error?.message || 'Failed to retrieve order tracking details.');
        }

        setTracking(json.data);
      } catch (err: any) {
        if (!isBackground) {
          setError(err.message || 'Failed to load order details.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isPollingRef.current = false;
      }
    },
    [id]
  );

  useEffect(() => {
    fetchTracking(false);
  }, [fetchTracking]);

  // 10-second lightweight polling for active orders
  useEffect(() => {
    if (!tracking?.order) return;

    const terminalStatuses = ['delivered', 'completed', 'cancelled'];
    if (terminalStatuses.includes(tracking.order.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchTracking(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [tracking?.order?.status, fetchTracking]);

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[var(--gd-ivory)]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--gd-forest)] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[var(--gd-charcoal)]">Retrieving Live Order Timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking?.order) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-[var(--gd-ivory)] px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-[var(--gd-border)] shadow-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="font-display text-2xl font-bold text-[var(--gd-charcoal)]">
            Order Not Found
          </h2>
          <p className="mt-2 text-sm text-[var(--gd-muted)]">{error || 'Order record is unavailable.'}</p>
          <Link
            to="/menu"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--gd-forest)] px-6 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[var(--gd-charcoal)]"
          >
            <ArrowLeft size={14} />
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const { order, deliveryRider, timeline } = tracking;

  const formatPrice = (val: number) => `₹${val.toFixed(2)}`;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--gd-ivory)] py-8 pb-16">
      <div className="gd-container max-w-4xl space-y-6">

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--gd-muted)] hover:text-[var(--gd-charcoal)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to My Orders
          </Link>

          <button
            type="button"
            onClick={() => fetchTracking(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin text-[var(--gd-forest)]' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Live Status'}</span>
          </button>
        </div>

        {/* Top Header Card */}
        <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--gd-charcoal)]">
                  Order {order.orderNumber}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    order.status === 'delivered' || order.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900 animate-pulse'
                  }`}
                >
                  {order.status}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : order.paymentStatus === 'refunded'
                      ? 'bg-purple-50 text-purple-900 border border-purple-200'
                      : order.paymentStatus === 'failed'
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  Payment: {order.paymentStatus || 'pending'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--gd-muted)]">
                Placed on {formatDate(order.createdAt)} • Type:{' '}
                <span className="font-bold capitalize text-zinc-800">{order.orderType}</span>
              </p>
            </div>

            {deliveryRider && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-indigo-50 px-4 py-2.5 text-indigo-900">
                <UserCheck size={18} className="text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-500">Assigned Rider</p>
                  <p className="text-xs font-bold">{deliveryRider.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Visual Step Timeline */}
          <div className="py-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-400 mb-6">
              Fulfillment Progression
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
              {timeline.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isCancelled = step.status === 'cancelled';

                return (
                  <div
                    key={step.type}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'border-[var(--gd-forest)] bg-emerald-50/50 shadow-xs ring-1 ring-[var(--gd-forest)]'
                        : isCompleted
                        ? 'border-zinc-200 bg-zinc-50'
                        : isCancelled
                        ? 'border-red-200 bg-red-50'
                        : 'border-dashed border-zinc-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 font-bold text-xs ${
                        isCompleted
                          ? 'bg-[var(--gd-forest)] text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white animate-bounce'
                          : isCancelled
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-200 text-zinc-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>

                    <p className={`text-xs ${isCurrent ? 'font-extrabold text-[var(--gd-forest)]' : 'font-bold text-zinc-800'}`}>
                      {step.label}
                    </p>

                    {step.timestamp && (
                      <p className="mt-1 text-[10px] font-medium text-zinc-400">
                        {formatDate(step.timestamp)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Column: Ordered Items & Nutrition */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-display text-lg font-bold text-[var(--gd-charcoal)] flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-[var(--gd-forest)]" />
                Ordered Fuel & Meals
              </h2>

              <div className="divide-y divide-zinc-100">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        Quantity: <span className="font-bold text-zinc-700">{item.quantity}</span> • Price:{' '}
                        {formatPrice(item.unitPrice)}
                      </p>
                      {item.macrosSnapshot && (
                        <p className="mt-0.5 text-[11px] font-medium text-[var(--gd-forest)]">
                          {item.macrosSnapshot.calories} kcal • {item.macrosSnapshot.protein}g Protein
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-zinc-900">{formatPrice(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition Breakdown */}
            {order.nutritionSummary && (
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 space-y-3">
                <h3 className="font-display text-base font-bold text-[var(--gd-charcoal)] flex items-center gap-2">
                  <Flame size={18} className="text-amber-500" />
                  Fuel & Macros Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Calories</p>
                    <p className="text-sm font-extrabold text-zinc-900">{order.nutritionSummary.totalCalories} kcal</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Protein</p>
                    <p className="text-sm font-extrabold text-[var(--gd-forest)]">{order.nutritionSummary.totalProtein}g</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Carbs</p>
                    <p className="text-sm font-extrabold text-amber-700">{order.nutritionSummary.totalCarbs}g</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Fats</p>
                    <p className="text-sm font-extrabold text-indigo-700">{order.nutritionSummary.totalFats}g</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl border border-emerald-100 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Fuel Score</p>
                    <p className="text-sm font-extrabold text-emerald-600">{order.nutritionSummary.averageFuelScore}/100</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Billing & Delivery/Table Info */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-display text-lg font-bold text-[var(--gd-charcoal)]">
                Billing Summary
              </h2>

              <div className="space-y-2 text-xs text-zinc-600 border-b border-zinc-100 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-zinc-900">{formatPrice(order.pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-zinc-900">{formatPrice(order.pricing.deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5% GST)</span>
                  <span className="font-bold text-zinc-900">{formatPrice(order.pricing.tax)}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-zinc-900 pt-1">
                <span>Total Amount</span>
                <span className="text-[var(--gd-forest)]">{formatPrice(order.pricing.total)}</span>
              </div>
            </div>

            {/* Delivery Address or Table Info */}
            <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-xs space-y-3">
              {order.orderType === 'delivery' && order.deliveryAddress ? (
                <>
                  <h3 className="font-display text-sm font-bold text-[var(--gd-charcoal)] flex items-center gap-2">
                    <MapPin size={16} className="text-red-500" />
                    Delivery Destination
                  </h3>
                  <div className="text-xs text-zinc-600 space-y-1">
                    <p className="font-bold text-zinc-900">{order.deliveryAddress.fullName}</p>
                    <p>{order.deliveryAddress.addressLine1}</p>
                    <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
                    <p className="pt-1 text-zinc-400 font-medium">Phone: {order.deliveryAddress.phone}</p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-display text-sm font-bold text-[var(--gd-charcoal)] flex items-center gap-2">
                    <UtensilsCrossed size={16} className="text-[var(--gd-forest)]" />
                    Table Information
                  </h3>
                  <p className="text-xs font-bold text-zinc-900">{order.table || 'Main Dining Table'}</p>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
