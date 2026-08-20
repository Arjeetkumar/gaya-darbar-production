import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  Bell,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { KitchenTicket, KitchenTicketStatus, KitchenTicketPriority } from '../../types/kitchen';

interface KitchenTicketCardProps {
  ticket: KitchenTicket;
  onStatusUpdate: (id: string, newStatus: KitchenTicketStatus) => Promise<void>;
  onPriorityUpdate: (id: string, newPriority: KitchenTicketPriority) => Promise<void>;
}

function formatElapsedAge(createdAtStr: string): string {
  const createdDate = new Date(createdAtStr);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ${diffMins % 60}m ago`;
}

export const KitchenTicketCard: React.FC<KitchenTicketCardProps> = ({
  ticket,
  onStatusUpdate,
  onPriorityUpdate,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedAge, setElapsedAge] = useState<string>(formatElapsedAge(ticket.createdAt));

  // Update timer every 30 seconds
  useEffect(() => {
    setElapsedAge(formatElapsedAge(ticket.createdAt));
    const interval = setInterval(() => {
      setElapsedAge(formatElapsedAge(ticket.createdAt));
    }, 30000);
    return () => clearInterval(interval);
  }, [ticket.createdAt]);

  const handleNextStatus = async () => {
    let nextStatus: KitchenTicketStatus | null = null;
    if (ticket.status === 'pending') nextStatus = 'preparing';
    else if (ticket.status === 'preparing') nextStatus = 'ready';
    else if (ticket.status === 'ready') nextStatus = 'completed';

    if (!nextStatus) return;

    setIsUpdatingStatus(true);
    setErrorMessage(null);

    try {
      await onStatusUpdate(ticket.id, nextStatus);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = e.target.value as KitchenTicketPriority;
    if (newPriority === ticket.priority) return;

    setIsUpdatingPriority(true);
    setErrorMessage(null);

    try {
      await onPriorityUpdate(ticket.id, newPriority);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update priority.');
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  // Border & Accent Styling based on Priority & Status
  const getPriorityStyle = () => {
    switch (ticket.priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500 bg-red-50/20';
      case 'high':
        return 'border-l-4 border-l-amber-500 bg-amber-50/10';
      case 'normal':
      default:
        return 'border-l-4 border-l-zinc-300';
    }
  };

  const getPriorityBadgeClass = () => {
    switch (ticket.priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 font-bold';
      case 'high':
        return 'bg-amber-100 text-amber-800 font-bold';
      case 'normal':
      default:
        return 'bg-zinc-100 text-zinc-700 font-medium';
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[var(--gd-border)] bg-white p-4 shadow-sm transition-all hover:shadow-md ${getPriorityStyle()}`}
    >
      {/* Header Row: Order Number, Age Timer, Priority Selector */}
      <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <span className="font-display text-lg font-bold text-[var(--gd-charcoal)]">
            {ticket.orderNumber}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
            <Clock size={12} />
            <span>{elapsedAge}</span>
          </div>
        </div>

        {/* Priority Dropdown Selector */}
        <div className="flex items-center gap-2">
          {ticket.priority === 'urgent' && (
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
          )}
          <select
            value={ticket.priority}
            onChange={handlePriorityChange}
            disabled={isUpdatingPriority}
            className={`rounded-lg px-2.5 py-1 text-xs transition-colors focus:outline-none ${getPriorityBadgeClass()}`}
            title="Change Kitchen Ticket Priority"
          >
            <option value="normal">Normal Priority</option>
            <option value="high">⚡ High Priority</option>
            <option value="urgent">🔥 URGENT</option>
          </select>
        </div>
      </div>

      {/* Customer Notes Box */}
      {ticket.customerNotes && (
        <div className="mb-3.5 flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-200/60">
          <MessageSquare size={14} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">Customer Notes:</span> {ticket.customerNotes}
          </div>
        </div>
      )}

      {/* Ticket Items List */}
      <div className="mb-4 space-y-3">
        {ticket.items.map((item, idx) => (
          <div key={idx} className="rounded-xl bg-zinc-50/80 p-3 text-xs border border-zinc-100">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--gd-charcoal)] text-xs font-bold text-white shrink-0">
                  {item.quantity}x
                </span>
                <div>
                  <p className="font-bold text-[var(--gd-charcoal)] text-sm">{item.name}</p>
                  {item.itemType === 'CUSTOM_MEAL' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gd-forest)] mt-0.5">
                      <Sparkles size={11} /> Custom Fuel Bowl
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Standard Item Choice Badges */}
            {(item.portionChoice || item.sauceChoice) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.portionChoice && (
                  <span className="rounded-md bg-zinc-200/70 px-2 py-0.5 text-[10px] font-semibold text-zinc-800">
                    Portion: {item.portionChoice}
                  </span>
                )}
                {item.sauceChoice && (
                  <span className="rounded-md bg-emerald-100/70 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                    Sauce: {item.sauceChoice}
                  </span>
                )}
              </div>
            )}

            {/* Custom Meal Grouped Option Snapshots */}
            {item.customOptionsSnapshot && item.customOptionsSnapshot.length > 0 && (
              <div className="mt-2.5 space-y-1 border-t border-zinc-200/60 pt-2 text-[11px]">
                {item.customOptionsSnapshot.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center justify-between text-zinc-700">
                    <span className="font-medium">{opt.name}</span>
                    <span className="rounded bg-zinc-200/50 px-1.5 py-0.2 text-[9px] font-bold capitalize text-zinc-600">
                      {opt.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-800 border border-red-200">
          <AlertTriangle size={14} className="shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Button for Status Transition */}
      <div className="pt-1">
        {ticket.status === 'pending' && (
          <button
            type="button"
            onClick={handleNextStatus}
            disabled={isUpdatingStatus}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 disabled:opacity-50"
          >
            <ChefHat size={16} />
            <span>{isUpdatingStatus ? 'Updating...' : 'START PREPARING'}</span>
          </button>
        )}

        {ticket.status === 'preparing' && (
          <button
            type="button"
            onClick={handleNextStatus}
            disabled={isUpdatingStatus}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            <Bell size={16} />
            <span>{isUpdatingStatus ? 'Updating...' : 'MARK READY'}</span>
          </button>
        )}

        {ticket.status === 'ready' && (
          <button
            type="button"
            onClick={handleNextStatus}
            disabled={isUpdatingStatus}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>{isUpdatingStatus ? 'Updating...' : 'COMPLETE ORDER'}</span>
          </button>
        )}

        {ticket.status === 'completed' && (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-bold text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 size={15} />
            <span>Completed</span>
          </div>
        )}

        {ticket.status === 'cancelled' && (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 py-2 text-xs font-bold text-zinc-500">
            <span>Cancelled</span>
          </div>
        )}
      </div>
    </div>
  );
};
