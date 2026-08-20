import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  RotateCw,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  ChefHat,
  Truck,
  Sparkles,
  Flame,
  Utensils,
  LogIn,
  AlertOctagon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  AnalyticsOverview,
  OrderAnalytics,
  RevenueAnalytics,
  KitchenAnalytics,
  DeliveryAnalytics,
  RiderPerformanceItem,
  MenuPerformanceItem,
  CustomerAnalytics,
  NutritionAnalytics,
  PresetDateRange,
} from '../types/analytics';
import {
  getAnalyticsOverview,
  getOrderAnalytics,
  getRevenueAnalytics,
  getKitchenAnalytics,
  getDeliveryAnalytics,
  getRiderAnalytics,
  getMenuAnalytics,
  getCustomerAnalytics,
  getNutritionAnalytics,
} from '../services/analyticsService';

const ALLOWED_ADMIN_ROLES = ['admin', 'manager'];

export const AnalyticsDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Date Range State
  const [preset, setPreset] = useState<PresetDateRange>('30d');
  const [dateFromInput, setDateFromInput] = useState<string>('');
  const [dateToInput, setDateToInput] = useState<string>('');

  // Metrics Data State
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [orderData, setOrderData] = useState<OrderAnalytics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [kitchenData, setKitchenData] = useState<KitchenAnalytics | null>(null);
  const [deliveryData, setDeliveryData] = useState<DeliveryAnalytics | null>(null);
  const [riderData, setRiderData] = useState<RiderPerformanceItem[]>([]);
  const [menuData, setMenuData] = useState<MenuPerformanceItem[]>([]);
  const [customerData, setCustomerData] = useState<CustomerAnalytics | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionAnalytics | null>(null);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute effective date params
  const getEffectiveDates = useCallback(() => {
    if (preset === 'custom') {
      return { dateFrom: dateFromInput || undefined, dateTo: dateToInput || undefined };
    }

    const now = new Date();
    const dateTo = now.toISOString().split('T')[0];
    const dateFromObj = new Date(now);

    if (preset === '7d') dateFromObj.setDate(now.getDate() - 7);
    else if (preset === '30d') dateFromObj.setDate(now.getDate() - 30);
    else if (preset === '90d') dateFromObj.setDate(now.getDate() - 90);

    const dateFrom = dateFromObj.toISOString().split('T')[0];
    return { dateFrom, dateTo };
  }, [preset, dateFromInput, dateToInput]);

  // Load All Analytics Data
  const loadAnalytics = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setError(null);
    const dateParams = getEffectiveDates();

    try {
      const [
        overviewRes,
        orderRes,
        revenueRes,
        kitchenRes,
        deliveryRes,
        riderRes,
        menuRes,
        customerRes,
        nutritionRes,
      ] = await Promise.all([
        getAnalyticsOverview(dateParams),
        getOrderAnalytics(dateParams),
        getRevenueAnalytics(dateParams),
        getKitchenAnalytics(dateParams),
        getDeliveryAnalytics(dateParams),
        getRiderAnalytics(dateParams),
        getMenuAnalytics(dateParams),
        getCustomerAnalytics(dateParams),
        getNutritionAnalytics(dateParams),
      ]);

      setOverview(overviewRes);
      setOrderData(orderRes);
      setRevenueData(revenueRes);
      setKitchenData(kitchenRes);
      setDeliveryData(deliveryRes);
      setRiderData(riderRes);
      setMenuData(menuRes);
      setCustomerData(customerRes);
      setNutritionData(nutritionRes);
    } catch (err: any) {
      console.error('Failed to load analytics dashboard metrics:', err);
      setError(err.message || 'Failed to load restaurant operations analytics metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getEffectiveDates]);

  useEffect(() => {
    if (!isAuthenticated || !user || !ALLOWED_ADMIN_ROLES.includes(user.role)) {
      return;
    }
    loadAnalytics();
  }, [isAuthenticated, user, loadAnalytics]);

  // Handle Preset Change
  const handlePresetChange = (newPreset: PresetDateRange) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      setDateFromInput('');
      setDateToInput('');
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
            The Restaurant Operations Analytics Dashboard is restricted strictly to administrators and managers.
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

  // Calculate maximum for trend chart scaling
  const maxRevenueTrend = revenueData?.revenueTrend
    ? Math.max(...revenueData.revenueTrend.map((d) => d.revenue), 100)
    : 100;

  const maxOrdersTrend = orderData?.dailyOrders
    ? Math.max(...orderData.dailyOrders.map((d) => d.orders), 10)
    : 10;

  return (
    <div className="gd-container min-h-screen py-8 space-y-8">
      {/* Header & Date Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--gd-charcoal)]">
              Operations & Business Analytics
            </h1>
            <span className="rounded-full bg-[var(--gd-forest)] px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
              Real MongoDB Data
            </span>
          </div>
          <p className="text-xs text-[var(--gd-muted)]">
            Comprehensive business performance metrics, revenue trends, kitchen throughput, and fuel nutrition statistics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="flex rounded-xl bg-zinc-200/80 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => handlePresetChange('7d')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                preset === '7d' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('30d')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                preset === '30d' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('90d')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                preset === '90d' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              90 Days
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('custom')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                preset === 'custom' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Custom Date Pickers */}
          {preset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white py-1.5 px-3 text-xs"
              />
              <span className="text-zinc-400">to</span>
              <input
                type="date"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white py-1.5 px-3 text-xs"
              />
              <button
                type="button"
                onClick={() => loadAnalytics(true)}
                className="rounded-xl bg-zinc-900 px-3 py-1.5 font-bold text-white text-xs"
              >
                Apply
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-forest)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[var(--gd-charcoal)] disabled:opacity-50"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Analytics Content */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-zinc-200" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-64 w-full animate-pulse rounded-3xl bg-zinc-200" />
            <div className="h-64 w-full animate-pulse rounded-3xl bg-zinc-200" />
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto my-8 max-w-lg rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertOctagon size={28} className="mx-auto mb-2 text-red-600" />
          <h3 className="font-display text-base font-bold text-red-900">Failed to Load Analytics</h3>
          <p className="text-xs text-red-700 mt-1 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. OVERVIEW KPI CARDS */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <ShoppingBag size={15} className="text-indigo-600" />
                <span className="text-[11px] font-semibold uppercase">Total Orders</span>
              </div>
              <p className="font-display text-2xl font-bold text-zinc-900">
                {overview?.totalOrders || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 mb-1">
                <DollarSign size={15} />
                <span className="text-[11px] font-semibold uppercase">Total Revenue</span>
              </div>
              <p className="font-display text-2xl font-bold text-emerald-950">
                ₹{overview?.totalRevenue || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-blue-800 mb-1">
                <TrendingUp size={15} />
                <span className="text-[11px] font-semibold uppercase">Avg Order Value</span>
              </div>
              <p className="font-display text-2xl font-bold text-blue-950">
                ₹{overview?.averageOrderValue || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CheckCircle2 size={15} />
                <span className="text-[11px] font-semibold uppercase">Completed</span>
              </div>
              <p className="font-display text-2xl font-bold text-zinc-900">
                {overview?.completedOrders || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-red-800 mb-1">
                <XCircle size={15} />
                <span className="text-[11px] font-semibold uppercase">Cancelled</span>
              </div>
              <p className="font-display text-2xl font-bold text-red-950">
                {overview?.cancelledOrders || 0}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-purple-800 mb-1">
                <Users size={15} />
                <span className="text-[11px] font-semibold uppercase">Total Customers</span>
              </div>
              <p className="font-display text-2xl font-bold text-purple-950">
                {overview?.totalCustomers || 0}
              </p>
            </div>
          </section>

          {/* 2. REVENUE & ORDERS TREND CHARTS */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Revenue Trend Chart */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-600" /> Revenue Trend (₹)
                </h3>
                <span className="text-xs font-semibold text-zinc-500">Excludes Cancelled</span>
              </div>

              {!revenueData?.revenueTrend || revenueData.revenueTrend.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-zinc-400">
                  No revenue data recorded for selected date range.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-40 items-end gap-1.5 pt-4">
                    {revenueData.revenueTrend.map((item, idx) => {
                      const heightPercent = Math.max(8, Math.round((item.revenue / maxRevenueTrend) * 100));
                      return (
                        <div
                          key={idx}
                          className="group relative flex-1 flex flex-col items-center justify-end h-full"
                        >
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full rounded-t-md bg-emerald-600 transition-all group-hover:bg-emerald-500"
                          />
                          <div className="absolute -top-8 hidden rounded bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white shadow-md group-hover:block z-10 whitespace-nowrap">
                            {item.date}: ₹{item.revenue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 font-semibold pt-1 border-t border-zinc-100">
                    <span>{revenueData.revenueTrend[0]?.date}</span>
                    <span>{revenueData.revenueTrend[revenueData.revenueTrend.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Trend Chart */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-indigo-600" /> Daily Orders Trend
                </h3>
                <span className="text-xs font-semibold text-zinc-500">Order Volume</span>
              </div>

              {!orderData?.dailyOrders || orderData.dailyOrders.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-zinc-400">
                  No orders recorded for selected date range.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-40 items-end gap-1.5 pt-4">
                    {orderData.dailyOrders.map((item, idx) => {
                      const heightPercent = Math.max(8, Math.round((item.orders / maxOrdersTrend) * 100));
                      return (
                        <div
                          key={idx}
                          className="group relative flex-1 flex flex-col items-center justify-end h-full"
                        >
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full rounded-t-md bg-indigo-600 transition-all group-hover:bg-indigo-500"
                          />
                          <div className="absolute -top-8 hidden rounded bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white shadow-md group-hover:block z-10 whitespace-nowrap">
                            {item.date}: {item.orders} orders
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 font-semibold pt-1 border-t border-zinc-100">
                    <span>{orderData.dailyOrders[0]?.date}</span>
                    <span>{orderData.dailyOrders[orderData.dailyOrders.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. KITCHEN & DELIVERY PERFORMANCE */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Kitchen Performance */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <ChefHat size={18} className="text-amber-600" /> Kitchen Performance (KDS)
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-amber-50/60 p-3.5 border border-amber-200/60">
                  <p className="text-[11px] font-semibold text-amber-800 uppercase">Total Tickets</p>
                  <p className="font-display text-xl font-bold text-amber-950">{kitchenData?.totalTickets || 0}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-200/60">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase">Completed</p>
                  <p className="font-display text-xl font-bold text-emerald-950">{kitchenData?.completedTickets || 0}</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/60">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Pending</p>
                  <p className="font-display text-xl font-bold text-zinc-900">{kitchenData?.pendingTickets || 0}</p>
                </div>
                <div className="rounded-2xl bg-blue-50/60 p-3.5 border border-blue-200/60">
                  <p className="text-[11px] font-semibold text-blue-800 uppercase">Avg Prep Duration</p>
                  <p className="font-display text-xl font-bold text-blue-950">
                    {kitchenData?.averagePreparationMinutes != null
                      ? `${kitchenData.averagePreparationMinutes} min`
                      : 'Data unavailable'}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Operations */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Truck size={18} className="text-indigo-600" /> Delivery Operations
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-200/60">
                  <p className="text-[11px] font-semibold text-indigo-800 uppercase">Total Shipments</p>
                  <p className="font-display text-xl font-bold text-indigo-950">{deliveryData?.totalDeliveries || 0}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-200/60">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase">Delivered</p>
                  <p className="font-display text-xl font-bold text-emerald-950">{deliveryData?.delivered || 0}</p>
                </div>
                <div className="rounded-2xl bg-red-50/60 p-3.5 border border-red-200/60">
                  <p className="text-[11px] font-semibold text-red-800 uppercase">Failed Shipments</p>
                  <p className="font-display text-xl font-bold text-red-950">{deliveryData?.failed || 0}</p>
                </div>
                <div className="rounded-2xl bg-purple-50/60 p-3.5 border border-purple-200/60">
                  <p className="text-[11px] font-semibold text-purple-800 uppercase">Avg Delivery Time</p>
                  <p className="font-display text-xl font-bold text-purple-950">
                    {deliveryData?.averageDeliveryMinutes != null
                      ? `${deliveryData.averageDeliveryMinutes} min`
                      : 'Data unavailable'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. RIDER PERFORMANCE TABLE */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Truck size={18} className="text-indigo-600" /> Rider Performance Breakdown
            </h3>

            {riderData.length === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-zinc-400">
                No rider activity records for selected date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase text-zinc-500">
                      <th className="py-3 px-4">Rider Name</th>
                      <th className="py-3 px-4">Assigned</th>
                      <th className="py-3 px-4">Completed</th>
                      <th className="py-3 px-4">Failed</th>
                      <th className="py-3 px-4">Completion Rate</th>
                      <th className="py-3 px-4">Avg Delivery Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                    {riderData.map((r) => (
                      <tr key={r._id} className="hover:bg-zinc-50">
                        <td className="py-3 px-4 font-bold text-zinc-900">{r.name}</td>
                        <td className="py-3 px-4">{r.assignedDeliveries}</td>
                        <td className="py-3 px-4 text-emerald-700 font-bold">{r.completedDeliveries}</td>
                        <td className="py-3 px-4 text-red-700">{r.failedDeliveries}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                            {r.completionRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {r.averageDeliveryMinutes != null ? `${r.averageDeliveryMinutes} min` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 5. TOP PERFORMING MENU ITEMS TABLE */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Utensils size={18} className="text-[var(--gd-forest)]" /> Top Performing Menu Items
            </h3>

            {menuData.length === 0 ? (
              <div className="py-8 text-center text-xs font-semibold text-zinc-400">
                No menu item sales recorded for selected date range.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-bold uppercase text-zinc-500">
                      <th className="py-3 px-4">Menu Item / Custom Meal</th>
                      <th className="py-3 px-4">Quantity Sold</th>
                      <th className="py-3 px-4">Total Revenue</th>
                      <th className="py-3 px-4">Average Selling Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                    {menuData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="py-3 px-4 font-bold text-zinc-900 flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.itemType === 'CUSTOM_MEAL' && (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                              Custom Fuel Bowl
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold">{item.quantitySold}</td>
                        <td className="py-3 px-4 text-emerald-700 font-bold">₹{item.totalRevenue}</td>
                        <td className="py-3 px-4 text-zinc-600">₹{item.averagePrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 6. CUSTOMER & FUEL NUTRITION INSIGHTS */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Customer Insights */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Users size={18} className="text-purple-600" /> Customer Insights
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-purple-50/60 p-3.5 border border-purple-200/60">
                  <p className="text-[11px] font-semibold text-purple-800 uppercase">New Customers</p>
                  <p className="font-display text-xl font-bold text-purple-950">{customerData?.newCustomers || 0}</p>
                </div>
                <div className="rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-200/60">
                  <p className="text-[11px] font-semibold text-indigo-800 uppercase">Active Ordering</p>
                  <p className="font-display text-xl font-bold text-indigo-950">{customerData?.activeCustomers || 0}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-200/60">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase">Repeat Customers</p>
                  <p className="font-display text-xl font-bold text-emerald-950">{customerData?.repeatCustomers || 0}</p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/60">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Total User Base</p>
                  <p className="font-display text-xl font-bold text-zinc-900">{customerData?.totalCustomers || 0}</p>
                </div>
              </div>
            </div>

            {/* Fuel & Nutrition Analytics */}
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-display text-base font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Flame size={18} className="text-[var(--gd-forest)]" /> Fuel & Macro Nutrition Averages
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-amber-50/60 p-3.5 border border-amber-200/60">
                  <p className="text-[11px] font-semibold text-amber-800 uppercase flex items-center gap-1">
                    <Sparkles size={13} /> Avg Fuel Score
                  </p>
                  <p className="font-display text-xl font-bold text-amber-950">
                    {nutritionData?.averageFuelScore != null ? nutritionData.averageFuelScore : 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50/60 p-3.5 border border-emerald-200/60">
                  <p className="text-[11px] font-semibold text-emerald-800 uppercase">Avg Protein</p>
                  <p className="font-display text-xl font-bold text-emerald-950">
                    {nutritionData?.averageProtein != null ? `${nutritionData.averageProtein}g` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-3.5 border border-zinc-200/60">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Avg Calories</p>
                  <p className="font-display text-xl font-bold text-zinc-900">
                    {nutritionData?.averageCalories != null ? `${nutritionData.averageCalories} kcal` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl bg-indigo-50/60 p-3.5 border border-indigo-200/60">
                  <p className="text-[11px] font-semibold text-indigo-800 uppercase">High-Protein Ratio</p>
                  <p className="font-display text-xl font-bold text-indigo-950">
                    {nutritionData?.highProteinOrderPercentage != null
                      ? `${nutritionData.highProteinOrderPercentage}%`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
