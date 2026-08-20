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
} from 'lucide-react';
import type { AdminOrder, AdminOrderPagination, AdminOrderCustomer } from '../types/adminOrder';
import type { OrderStatus, OrderType, PaymentStatus } from '../types/order';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  cancelAdminOrder,
} from '../services/adminOrderService';
import { AdminOrderDetailsModal } from '../components/admin/AdminOrderDetailsModal';

const ALLOWED_ADMIN_ROLES = ['admin', 'manager'];

export const AdminOrders: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<AdminOrderPagination>({
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
  const [orderType, setOrderType] = useState<string>('ALL');
  const [paymentStatus, setPaymentStatus] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch Orders
  const fetchOrders = useCallback(async (pageToFetch = currentPage, isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);
    try {
      const response = await getAdminOrders({
        page: pageToFetch,
        limit: 20,
        search: search.trim() ? search.trim() : undefined,
        status: status !== 'ALL' ? (status as OrderStatus) : undefined,
        orderType: orderType !== 'ALL' ? (orderType as OrderType) : undefined,
        paymentStatus: paymentStatus !== 'ALL' ? (paymentStatus as PaymentStatus) : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setOrders(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Failed to load admin orders:', err);
      setError(err.message || 'Failed to connect to Admin Order Management server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, search, status, orderType, paymentStatus, dateFrom, dateTo]);

  useEffect(() => {
    if (!isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
      return;
    }
    fetchOrders(currentPage);
  }, [isAuthenticated, user, currentPage, fetchOrders]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setOrderType('ALL');
    setPaymentStatus('ALL');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (id: string, newStatus: OrderStatus) => {
    const updated = await updateAdminOrderStatus(id, newStatus);
    setOrders((prev) => prev.map((o) => (o.id === id || o._id === id ? updated : o)));
    if (selectedOrder && (selectedOrder.id === id || selectedOrder._id === id)) {
      setSelectedOrder(updated);
    }
  };

  const handleCancelOrder = async (id: string) => {
    const updated = await cancelAdminOrder(id);
    setOrders((prev) => prev.map((o) => (o.id === id || o._id === id ? updated : o)));
    if (selectedOrder && (selectedOrder.id === id || selectedOrder._id === id)) {
      setSelectedOrder(updated);
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
            The Admin Order Operations Dashboard is restricted strictly to administrators and managers.
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

  // Quick summary stats calculation
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  return (
    <div className="gd-container min-h-screen py-8">
      {/* Title Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--gd-charcoal)]">
              Order Operations Dashboard
            </h1>
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
              {user.role} Control
            </span>
          </div>
          <p className="text-xs text-[var(--gd-muted)]">
            Manage customer orders, status lifecycles, historical snapshots, and business fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOrders(currentPage, true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-forest)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--gd-charcoal)] disabled:opacity-50"
        >
          <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Orders'}</span>
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-zinc-500">Total Found</p>
          <p className="font-display text-2xl font-bold text-zinc-900">{pagination.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-amber-800">Pending</p>
          <p className="font-display text-2xl font-bold text-amber-900">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-blue-800">Preparing</p>
          <p className="font-display text-2xl font-bold text-blue-900">{preparingCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-emerald-800">Ready</p>
          <p className="font-display text-2xl font-bold text-emerald-900">{readyCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-300 bg-zinc-100 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase text-zinc-600">Completed</p>
          <p className="font-display text-2xl font-bold text-zinc-800">{completedCount}</p>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="mb-6 rounded-2xl border border-[var(--gd-border)] bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by #GD-XXXX, customer name, or email..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-zinc-800 placeholder-zinc-400 transition-all focus:border-[var(--gd-forest)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gd-forest)]/20"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-xs font-semibold text-zinc-700 focus:border-[var(--gd-forest)] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="outForDelivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Order Type Dropdown */}
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-xs font-semibold text-zinc-700 focus:border-[var(--gd-forest)] focus:outline-none"
          >
            <option value="ALL">All Order Types</option>
            <option value="delivery">Delivery</option>
            <option value="dineIn">Dine-In</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-zinc-500">Date Filter:</span>
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
            className="rounded-xl border border-zinc-300 bg-zinc-100 px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Content State Handling */}
      {isLoading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center space-y-3">
          <div className="mx-auto h-6 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto my-8 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertOctagon size={28} className="mx-auto mb-2 text-red-600" />
          <h3 className="font-display text-base font-bold text-red-900">Failed to Load Orders</h3>
          <p className="text-xs text-red-700 mt-1 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchOrders(currentPage, true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center space-y-3">
          <Inbox size={36} className="mx-auto text-zinc-400" />
          <h3 className="font-display text-lg font-bold text-zinc-800">No Orders Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No customer orders match your current filter parameters or search term.
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
        /* Orders Table & Mobile Cards */
        <div className="rounded-2xl border border-[var(--gd-border)] bg-white shadow-sm overflow-hidden">
          {/* Desktop/Tablet Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                {orders.map((o) => {
                  const cust = typeof o.user === 'object' && o.user ? (o.user as AdminOrderCustomer) : null;
                  const dateStr = new Date(o.createdAt).toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={o.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-zinc-900">{o.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900">{cust ? cust.name : 'Guest User'}</div>
                        <div className="text-[11px] text-zinc-500">{cust ? cust.email : ''}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-semibold">{o.orderType}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 capitalize">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 capitalize">
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-900">₹{o.total}</td>
                      <td className="py-3.5 px-4 text-zinc-500">{dateStr}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(o);
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-800 transition-all hover:bg-[var(--gd-forest)] hover:text-white"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="divide-y divide-zinc-200 md:hidden">
            {orders.map((o) => {
              const cust = typeof o.user === 'object' && o.user ? (o.user as AdminOrderCustomer) : null;
              const dateStr = new Date(o.createdAt).toLocaleDateString();

              return (
                <div key={o.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-zinc-900">{o.orderNumber}</span>
                      <span className="ml-2 text-[11px] text-zinc-400 font-medium">({dateStr})</span>
                    </div>
                    <span className="font-bold text-zinc-900">₹{o.total}</span>
                  </div>
                  <div className="text-xs text-zinc-600">
                    <p className="font-bold text-zinc-900">{cust ? cust.name : 'Guest User'}</p>
                    <p>{cust ? cust.email : ''}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 capitalize">
                        {o.status}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 capitalize">
                        {o.paymentStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrder(o);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1 text-xs font-bold text-white"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer Bar */}
          <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between text-xs font-medium text-zinc-600">
            <div>
              Showing page <span className="font-bold text-zinc-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-zinc-900">{pagination.totalPages}</span> (
              <span className="font-bold text-zinc-900">{pagination.total}</span> orders)
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

      {/* Order Details Slide-Over Modal */}
      <AdminOrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
};

export default AdminOrders;
