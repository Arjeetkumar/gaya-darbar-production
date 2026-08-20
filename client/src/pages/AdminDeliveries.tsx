import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  RotateCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  Inbox,
  LogIn,
  Truck,
} from 'lucide-react';
import type { Delivery, DeliveryPagination, DeliveryRider, DeliveryStatus } from '../types/delivery';
import {
  getAdminDeliveries,
  getAvailableRiders,
  assignDeliveryRider,
  cancelDelivery,
} from '../services/deliveryService';
import { AdminDeliveryDetailsModal } from '../components/admin/AdminDeliveryDetailsModal';

const ALLOWED_ADMIN_ROLES = ['admin', 'manager'];

export const AdminDeliveries: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [availableRiders, setAvailableRiders] = useState<DeliveryRider[]>([]);
  const [pagination, setPagination] = useState<DeliveryPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('ALL');
  const [selectedRider, setSelectedRider] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Delivery for Details Modal
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch Available Riders
  useEffect(() => {
    getAvailableRiders()
      .then((riders) => setAvailableRiders(riders))
      .catch((err) => console.error('Failed to fetch available riders:', err));
  }, []);

  // Fetch Deliveries
  const fetchDeliveries = useCallback(async (pageToFetch = currentPage, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);
    try {
      const response = await getAdminDeliveries({
        page: pageToFetch,
        limit: 20,
        search: search.trim() ? search.trim() : undefined,
        status: status !== 'ALL' ? (status as DeliveryStatus) : undefined,
        rider: selectedRider !== 'ALL' ? selectedRider : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setDeliveries(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Failed to load admin deliveries:', err);
      setError(err.message || 'Failed to connect to Admin Delivery Operations server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, search, status, selectedRider, dateFrom, dateTo]);

  useEffect(() => {
    if (!isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
      return;
    }
    fetchDeliveries(currentPage);
  }, [isAuthenticated, user, currentPage, fetchDeliveries]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setSelectedRider('ALL');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleAssignRider = async (deliveryId: string, riderId: string) => {
    const updated = await assignDeliveryRider(deliveryId, riderId);
    setDeliveries((prev) => prev.map((d) => (d.id === deliveryId || d._id === deliveryId ? updated : d)));
    if (selectedDelivery && (selectedDelivery.id === deliveryId || selectedDelivery._id === deliveryId)) {
      setSelectedDelivery(updated);
    }
  };

  const handleCancelDelivery = async (deliveryId: string) => {
    const updated = await cancelDelivery(deliveryId);
    setDeliveries((prev) => prev.map((d) => (d.id === deliveryId || d._id === deliveryId ? updated : d)));
    if (selectedDelivery && (selectedDelivery.id === deliveryId || selectedDelivery._id === deliveryId)) {
      setSelectedDelivery(updated);
    }
  };

  // ----------------------------------------------------
  // 1. Authorization Guard
  // ----------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="gd-container py-12 text-center text-xs font-semibold text-zinc-500">
        Loading authentication status...
      </div>
    );
  }

  if (!isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
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
            The Delivery Operations Dashboard is restricted strictly to administrators and managers.
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
              <span>Sign In as Admin</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quick summary counts
  const unassignedCount = deliveries.filter((d) => d.status === 'unassigned').length;
  const assignedCount = deliveries.filter((d) => d.status === 'assigned').length;
  const pickedUpCount = deliveries.filter((d) => d.status === 'picked_up').length;
  const outForDeliveryCount = deliveries.filter((d) => d.status === 'out_for_delivery').length;
  const deliveredCount = deliveries.filter((d) => d.status === 'delivered').length;

  return (
    <div className="gd-container min-h-screen py-8">
      {/* Title Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--gd-charcoal)]">
              Delivery Operations & Dispatch
            </h1>
            <span className="rounded-full bg-indigo-900 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
              {user.role} Dispatch
            </span>
          </div>
          <p className="text-xs text-[var(--gd-muted)]">
            Assign delivery riders, track real-time rider status, manage dispatches, and monitor fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchDeliveries(currentPage, true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-forest)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--gd-charcoal)] disabled:opacity-50"
        >
          <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Deliveries'}</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-red-800">Unassigned</p>
          <p className="font-display text-2xl font-bold text-red-900">{unassignedCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-amber-800">Assigned</p>
          <p className="font-display text-2xl font-bold text-amber-900">{assignedCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-blue-800">Picked Up</p>
          <p className="font-display text-2xl font-bold text-blue-900">{pickedUpCount}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-indigo-800">Out for Delivery</p>
          <p className="font-display text-2xl font-bold text-indigo-900">{outForDeliveryCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-emerald-800">Delivered</p>
          <p className="font-display text-2xl font-bold text-emerald-900">{deliveredCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 rounded-2xl border border-[var(--gd-border)] bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by #GD-D-XXXX, order #, or customer name..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-zinc-800 placeholder-zinc-400 transition-all focus:border-[var(--gd-forest)] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-xs font-semibold text-zinc-700 focus:border-[var(--gd-forest)] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={selectedRider}
            onChange={(e) => setSelectedRider(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-xs font-semibold text-zinc-700 focus:border-[var(--gd-forest)] focus:outline-none"
          >
            <option value="ALL">All Delivery Riders</option>
            {availableRiders.map((r) => (
              <option key={r.id || r._id} value={r.id || r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-500">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 px-3 text-xs text-zinc-800"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 px-3 text-xs text-zinc-800"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-xl border border-zinc-300 bg-zinc-100 px-3.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-3">
          <div className="mx-auto h-6 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto my-8 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertOctagon size={28} className="mx-auto mb-2 text-red-600" />
          <h3 className="font-display text-base font-bold text-red-900">Failed to Load Deliveries</h3>
          <p className="text-xs text-red-700 mt-1 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchDeliveries(currentPage, true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center space-y-3">
          <Inbox size={36} className="mx-auto text-zinc-400" />
          <h3 className="font-display text-lg font-bold text-zinc-800">No Delivery Records Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No delivery records match your current search query or filter settings.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Deliveries Data Table */
        <div className="rounded-2xl border border-[var(--gd-border)] bg-white shadow-sm overflow-hidden">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4">Delivery #</th>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Assigned Rider</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                {deliveries.map((d) => {
                  const riderObj = typeof d.rider === 'object' && d.rider ? d.rider : null;
                  return (
                    <tr key={d.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900">{d.deliveryNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-zinc-800">{d.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900">{d.customerSnapshot.name}</div>
                        <div className="text-[11px] text-zinc-500">{d.customerSnapshot.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {riderObj ? (
                          <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                            <Truck size={14} className="text-indigo-600" />
                            <span>{riderObj.name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 capitalize">
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 truncate max-w-[150px]">
                        {d.deliveryAddressSnapshot.city}, {d.deliveryAddressSnapshot.postalCode}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDelivery(d);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-800 transition-all hover:bg-[var(--gd-forest)] hover:text-white"
                        >
                          <Eye size={14} />
                          <span>View & Dispatch</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="divide-y divide-zinc-200 md:hidden">
            {deliveries.map((d) => {
              const riderObj = typeof d.rider === 'object' && d.rider ? d.rider : null;
              return (
                <div key={d.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-zinc-900">{d.deliveryNumber}</span>
                    <span className="text-xs font-bold text-zinc-600">{d.orderNumber}</span>
                  </div>
                  <div className="text-xs text-zinc-700 font-medium">
                    <p className="font-bold text-zinc-900">{d.customerSnapshot.name}</p>
                    <p className="text-zinc-500">{d.deliveryAddressSnapshot.addressLine1}, {d.deliveryAddressSnapshot.city}</p>
                    <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                      Rider: {riderObj ? riderObj.name : 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 capitalize">
                      {d.status.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDelivery(d);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1 text-xs font-bold text-white"
                    >
                      <Eye size={13} />
                      <span>Dispatch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between text-xs font-medium text-zinc-600">
            <div>
              Showing page <span className="font-bold text-zinc-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-zinc-900">{pagination.totalPages}</span> (
              <span className="font-bold text-zinc-900">{pagination.total}</span> deliveries)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Previous
              </button>

              <span className="px-2 text-xs font-bold text-zinc-800">
                {currentPage} / {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 disabled:opacity-40"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Delivery Details Drawer Modal */}
      <AdminDeliveryDetailsModal
        delivery={selectedDelivery}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDelivery(null);
        }}
        onAssignRider={handleAssignRider}
        onCancelDelivery={handleCancelDelivery}
      />
    </div>
  );
};

export default AdminDeliveries;
