import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import type { KitchenTicket, KitchenTicketStatus, KitchenTicketPriority } from '../types/kitchen';
import {
  getKitchenTickets,
  updateKitchenTicketStatus,
  updateKitchenTicketPriority,
} from '../services/kitchenService';
import { KitchenHeader } from '../components/kitchen/KitchenHeader';
import { KitchenFilters } from '../components/kitchen/KitchenFilters';
import { KitchenTicketColumn } from '../components/kitchen/KitchenTicketColumn';
import { KitchenLoadingState } from '../components/kitchen/KitchenLoadingState';
import { KitchenErrorState } from '../components/kitchen/KitchenErrorState';
import { KitchenEmptyState } from '../components/kitchen/KitchenEmptyState';

const ALLOWED_KITCHEN_ROLES = ['admin', 'manager', 'kitchen_staff'];

export const KitchenDisplay: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [activeOnly, setActiveOnly] = useState<boolean>(true);

  // Overlap prevention flag for polling
  const isFetchingRef = useRef<boolean>(false);

  // Fetch Tickets Function
  const fetchTickets = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      const fetchedTickets = await getKitchenTickets({
        active: activeOnly ? true : undefined,
        status: selectedStatus !== 'ALL' ? (selectedStatus as KitchenTicketStatus) : undefined,
        priority: selectedPriority !== 'ALL' ? (selectedPriority as KitchenTicketPriority) : undefined,
      });

      setTickets(fetchedTickets);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load kitchen tickets:', err);
      setError(err.message || 'Failed to connect to Kitchen Display System server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [activeOnly, selectedStatus, selectedPriority]);

  // Initial Load & Polling (10s interval)
  useEffect(() => {
    if (!isAuthenticated || !user || !ALLOWED_KITCHEN_ROLES.includes(user.role)) {
      return;
    }

    fetchTickets();

    const interval = setInterval(() => {
      fetchTickets();
    }, 10000); // 10 seconds polling

    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchTickets]);

  // Handler for Ticket Status Update
  const handleStatusUpdate = async (id: string, newStatus: KitchenTicketStatus) => {
    const updatedTicket = await updateKitchenTicketStatus(id, newStatus);
    setTickets((prevTickets) =>
      prevTickets.map((t) => (t.id === id || t._id === id ? updatedTicket : t))
    );
    setLastUpdated(new Date());
  };

  // Handler for Ticket Priority Update
  const handlePriorityUpdate = async (id: string, newPriority: KitchenTicketPriority) => {
    const updatedTicket = await updateKitchenTicketPriority(id, newPriority);
    setTickets((prevTickets) =>
      prevTickets.map((t) => (t.id === id || t._id === id ? updatedTicket : t))
    );
    setLastUpdated(new Date());
  };

  // ----------------------------------------------------
  // 1. Authorization Guard
  // ----------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="gd-container py-12">
        <KitchenLoadingState />
      </div>
    );
  }

  if (!isAuthenticated || !user || !ALLOWED_KITCHEN_ROLES.includes(user.role)) {
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
            The Kitchen Display System (KDS) is restricted strictly to kitchen staff, managers, and administrators.
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
              <span>Sign In as Staff</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. Data Filtering & Categorization for 4-Column Board
  // ----------------------------------------------------
  const filteredTickets = tickets.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchOrderNum = t.orderNumber.toLowerCase().includes(q);
      const matchItemName = t.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchOrderNum && !matchItemName) return false;
    }
    return true;
  });

  const pendingTickets = filteredTickets.filter((t) => t.status === 'pending');
  const preparingTickets = filteredTickets.filter((t) => t.status === 'preparing');
  const readyTickets = filteredTickets.filter((t) => t.status === 'ready');
  const completedTickets = filteredTickets.filter((t) => t.status === 'completed');

  const activeCount = pendingTickets.length + preparingTickets.length + readyTickets.length;

  return (
    <div className="gd-container min-h-screen py-8">
      {/* Header Bar */}
      <KitchenHeader
        activeCount={activeCount}
        pendingCount={pendingTickets.length}
        preparingCount={preparingTickets.length}
        readyCount={readyTickets.length}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchTickets(true)}
      />

      {/* Filter Controls */}
      <KitchenFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        activeOnly={activeOnly}
        onActiveOnlyToggle={() => setActiveOnly((prev) => !prev)}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <KitchenLoadingState />
      ) : error ? (
        <KitchenErrorState message={error} onRetry={() => fetchTickets(true)} />
      ) : filteredTickets.length === 0 ? (
        <KitchenEmptyState />
      ) : (
        /* 4 Operational Kanban Board Columns */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KitchenTicketColumn
            title="PENDING"
            statusKey="pending"
            tickets={pendingTickets}
            accentColorClass="bg-amber-500"
            headerBadgeClass="bg-amber-100 text-amber-900"
            onStatusUpdate={handleStatusUpdate}
            onPriorityUpdate={handlePriorityUpdate}
          />

          <KitchenTicketColumn
            title="PREPARING"
            statusKey="preparing"
            tickets={preparingTickets}
            accentColorClass="bg-blue-500"
            headerBadgeClass="bg-blue-100 text-blue-900"
            onStatusUpdate={handleStatusUpdate}
            onPriorityUpdate={handlePriorityUpdate}
          />

          <KitchenTicketColumn
            title="READY"
            statusKey="ready"
            tickets={readyTickets}
            accentColorClass="bg-emerald-500"
            headerBadgeClass="bg-emerald-100 text-emerald-900"
            onStatusUpdate={handleStatusUpdate}
            onPriorityUpdate={handlePriorityUpdate}
          />

          <KitchenTicketColumn
            title="COMPLETED"
            statusKey="completed"
            tickets={completedTickets}
            accentColorClass="bg-zinc-400"
            headerBadgeClass="bg-zinc-200 text-zinc-800"
            onStatusUpdate={handleStatusUpdate}
            onPriorityUpdate={handlePriorityUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
