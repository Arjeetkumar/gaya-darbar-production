import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldAlert,
  RotateCw,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
} from 'lucide-react';
import type { PaymentRecord, PaymentStatus } from '../types/payment';
import { getAdminPayments, processAdminRefund } from '../services/paymentService';

export default function AdminPayments() {
  const { user } = useAuth();
  const isAdminManager = user && ['admin', 'manager'].includes(user.role);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchOrderNum, setSearchOrderNum] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Refund Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [isRefunding, setIsRefunding] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const fetchPaymentsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminPayments({
        status: statusFilter || undefined,
        orderNumber: searchOrderNum || undefined,
        page: currentPage,
        limit: 20,
      });
      setPayments(res.payments);
      setTotalCount(res.total);
      setTotalPages(res.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchOrderNum, currentPage]);

  useEffect(() => {
    if (isAdminManager) {
      fetchPaymentsData();
    }
  }, [isAdminManager, fetchPaymentsData]);

  if (!user || !isAdminManager) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-[var(--gd-ivory)] px-4">
        <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-[var(--gd-border)] shadow-md space-y-3">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="font-display text-2xl font-bold text-[var(--gd-charcoal)]">Access Restricted</h2>
          <p className="text-xs text-[var(--gd-muted)]">
            Financial Payment Management is restricted strictly to Admin and Manager roles.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--gd-forest)] px-6 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[var(--gd-charcoal)]"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenRefundModal = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    const remaining = payment.amount - payment.refundedAmount;
    setRefundAmount(remaining > 0 ? String(remaining) : '');
    setRefundReason('Admin process refund');
    setRefundError(null);
  };

  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const amt = Number(refundAmount);
    const remaining = selectedPayment.amount - selectedPayment.refundedAmount;

    if (!amt || amt <= 0 || amt > remaining) {
      setRefundError(`Amount must be between ₹1 and ₹${remaining.toFixed(2)}.`);
      return;
    }

    setIsRefunding(true);
    setRefundError(null);

    try {
      await processAdminRefund(selectedPayment.id, amt, refundReason);
      setSelectedPayment(null);
      await fetchPaymentsData();
    } catch (err: any) {
      setRefundError(err.message || 'Refund execution failed.');
    } finally {
      setIsRefunding(false);
    }
  };

  const formatPrice = (val: number) => `₹${val.toFixed(2)}`;

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={12} />
            Paid
          </span>
        );
      case 'partially_refunded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
            <RefreshCw size={12} />
            Partially Refunded
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
            <RefreshCw size={12} />
            Fully Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
            <XCircle size={12} />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            <Clock size={12} />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gd-ivory)] py-8 pb-16">
      <div className="gd-container max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--gd-charcoal)] flex items-center gap-3">
              <CreditCard size={28} className="text-[var(--gd-forest)]" />
              Financial Payments & Audit Ledger
            </h1>
            <p className="mt-1 text-xs text-[var(--gd-muted)]">
              Razorpay transaction logs, verification state audit, and partial/full refund controls.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPaymentsData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-xs hover:bg-zinc-100"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin text-[var(--gd-forest)]' : ''} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--gd-border)] bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Order #GD-XXXX"
                value={searchOrderNum}
                onChange={(e) => {
                  setSearchOrderNum(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-9 pr-4 py-2 text-xs font-semibold focus:border-[var(--gd-forest)] focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-zinc-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 focus:border-[var(--gd-forest)] focus:bg-white focus:outline-hidden"
              >
                <option value="">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="partially_refunded">Partially Refunded</option>
                <option value="refunded">Fully Refunded</option>
              </select>
            </div>
          </div>

          <p className="text-xs font-bold text-zinc-500">
            Total Records: <span className="text-zinc-900 font-extrabold">{totalCount}</span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Payments Table */}
        <div className="rounded-3xl border border-[var(--gd-border)] bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 bg-[var(--gd-ivory)] text-zinc-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Provider Order / Payment ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--gd-forest)] mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-500">Loading payment ledger...</p>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-xs font-semibold text-zinc-400">
                      No matching payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isRefundable = (p.status === 'paid' || p.status === 'partially_refunded') && (p.amount - p.refundedAmount > 0);
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-4 font-bold text-zinc-900">
                          <Link to={`/order/${p.order?._id || p.orderNumber}`} className="hover:underline flex items-center gap-1">
                            {p.orderNumber}
                            <ArrowUpRight size={12} className="text-zinc-400" />
                          </Link>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-zinc-900">{p.user?.name || 'Customer'}</p>
                          <p className="text-[10px] text-zinc-400">{p.user?.email}</p>
                        </td>
                        <td className="p-4 font-extrabold text-zinc-900">
                          {formatPrice(p.amount)}
                          {p.refundedAmount > 0 && (
                            <p className="text-[10px] font-bold text-purple-600">
                              Ref: {formatPrice(p.refundedAmount)}
                            </p>
                          )}
                        </td>
                        <td className="p-4">{getStatusBadge(p.status)}</td>
                        <td className="p-4 font-bold text-zinc-700 capitalize">{p.method || 'online'}</td>
                        <td className="p-4 font-mono text-[11px] text-zinc-600">
                          <p><span className="text-zinc-400">Ord:</span> {p.providerOrderId}</p>
                          {p.providerPaymentId && <p><span className="text-zinc-400">Pay:</span> {p.providerPaymentId}</p>}
                        </td>
                        <td className="p-4 text-zinc-500 font-medium">
                          {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-right">
                          {isRefundable && (
                            <button
                              type="button"
                              onClick={() => handleOpenRefundModal(p)}
                              className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-900 hover:bg-purple-100 transition-colors"
                            >
                              Issue Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 bg-[var(--gd-ivory)]">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-zinc-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Refund Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <RefreshCw size={18} className="text-purple-600" />
                  Process Razorpay Refund
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 text-xs text-zinc-600">
                <p><span className="font-bold text-zinc-800">Order:</span> {selectedPayment.orderNumber}</p>
                <p><span className="font-bold text-zinc-800">Original Amount:</span> {formatPrice(selectedPayment.amount)}</p>
                <p><span className="font-bold text-zinc-800">Already Refunded:</span> {formatPrice(selectedPayment.refundedAmount)}</p>
                <p className="font-extrabold text-emerald-700">
                  Remaining Refundable: {formatPrice(selectedPayment.amount - selectedPayment.refundedAmount)}
                </p>
              </div>

              {refundError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{refundError}</span>
                </div>
              )}

              <form onSubmit={handleExecuteRefund} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Refund Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-extrabold text-zinc-900 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Reason for Refund
                  </label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs font-semibold text-zinc-900 focus:border-purple-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment(null)}
                    className="rounded-full px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRefunding}
                    className="rounded-full bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-800 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isRefunding && <Loader2 size={14} className="animate-spin" />}
                    <span>{isRefunding ? 'Processing Refund...' : 'Confirm Refund'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
