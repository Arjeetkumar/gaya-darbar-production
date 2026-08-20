import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShieldAlert, RotateCw, Truck, Inbox, LogIn } from 'lucide-react';
import type { Delivery } from '../types/delivery';
import { getMyDeliveries, updateMyDeliveryStatus } from '../services/deliveryService';
import { DeliveryCard } from '../components/delivery/DeliveryCard';

export const DeliveryDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);

  const fetchDeliveries = useCallback(async (isManual = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManual) setIsRefreshing(true);

    try {
      setError(null);
      const myDeliveries = await getMyDeliveries();
      setDeliveries(myDeliveries);
    } catch (err: any) {
      console.error('Failed to load rider deliveries:', err);
      setError(err.message || 'Failed to fetch assigned deliveries.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Polling every 10 seconds
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'delivery_rider') {
      return;
    }

    fetchDeliveries();

    const interval = setInterval(() => {
      fetchDeliveries();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchDeliveries]);

  const handleStatusUpdate = async (
    deliveryId: string,
    status: any,
    failureReason?: string
  ) => {
    const updated = await updateMyDeliveryStatus(deliveryId, status, failureReason);
    setDeliveries((prev) =>
      prev.map((d) => (d.id === deliveryId || d._id === deliveryId ? updated : d))
    );
  };

  // ----------------------------------------------------
  // Authorization Guard
  // ----------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="gd-container py-12 text-center text-xs font-semibold text-zinc-500">
        Loading authentication status...
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'delivery_rider') {
    return (
      <div className="gd-container flex min-h-[70vh] flex-col items-center justify-center py-12">
        <div className="mx-auto max-w-md text-center rounded-3xl border border-red-200 bg-red-50/50 p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-red-900 mb-2">
            403 — Access Denied
          </h2>
          <p className="text-xs font-medium text-red-700 mb-6">
            The Delivery Rider Dashboard is restricted strictly to registered delivery riders.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="rounded-xl border border-red-300 bg-white px-4 py-2.5 text-xs font-bold text-red-800 transition-colors hover:bg-red-100"
            >
              Return to Home
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700"
            >
              <LogIn size={15} />
              <span>Sign In as Rider</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active vs Completed Deliveries
  const activeDeliveries = deliveries.filter((d) =>
    ['assigned', 'picked_up', 'out_for_delivery'].includes(d.status)
  );
  const completedDeliveries = deliveries.filter((d) =>
    ['delivered', 'failed', 'cancelled'].includes(d.status)
  );

  return (
    <div className="gd-container min-h-screen py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--gd-charcoal)]">
              Rider Dashboard
            </h1>
            <p className="text-xs text-[var(--gd-muted)]">
              Welcome back, <span className="font-bold text-zinc-900">{user.name}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchDeliveries(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--gd-forest)] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--gd-charcoal)] disabled:opacity-50"
        >
          <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-3xl bg-zinc-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-xs font-medium text-red-800">
          <p className="font-bold text-sm mb-2">{error}</p>
          <button
            type="button"
            onClick={() => fetchDeliveries(true)}
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Spotlight Active Deliveries Section */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-zinc-900">
              <span>Active Assigned Deliveries</span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-900">
                {activeDeliveries.length}
              </span>
            </h2>

            {activeDeliveries.length === 0 ? (
              <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center space-y-2">
                <Inbox size={32} className="mx-auto text-zinc-400" />
                <p className="text-sm font-bold text-zinc-800">No active delivery assigned</p>
                <p className="text-xs text-zinc-500">
                  New delivery assignments from restaurant dispatch will automatically appear here.
                </p>
              </div>
            ) : (
              activeDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            )}
          </section>

          {/* Past / Completed Deliveries Section */}
          {completedDeliveries.length > 0 && (
            <section className="space-y-4 border-t border-zinc-200 pt-6">
              <h2 className="font-display text-base font-bold text-zinc-700">
                Completed & Past Deliveries ({completedDeliveries.length})
              </h2>
              <div className="space-y-4">
                {completedDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
