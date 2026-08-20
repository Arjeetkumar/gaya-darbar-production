import React from 'react';
import type { KitchenTicket, KitchenTicketStatus, KitchenTicketPriority } from '../../types/kitchen';
import { KitchenTicketCard } from './KitchenTicketCard';

interface KitchenTicketColumnProps {
  title: string;
  statusKey: KitchenTicketStatus;
  tickets: KitchenTicket[];
  accentColorClass: string;
  headerBadgeClass: string;
  onStatusUpdate: (id: string, newStatus: KitchenTicketStatus) => Promise<void>;
  onPriorityUpdate: (id: string, newPriority: KitchenTicketPriority) => Promise<void>;
}

export const KitchenTicketColumn: React.FC<KitchenTicketColumnProps> = ({
  title,
  tickets,
  accentColorClass,
  headerBadgeClass,
  onStatusUpdate,
  onPriorityUpdate,
}) => {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--gd-border)] bg-zinc-50/50 p-4 min-h-[600px] shadow-sm">
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${accentColorClass}`} />
          <h2 className="font-display text-base font-bold text-[var(--gd-charcoal)] uppercase tracking-wider">
            {title}
          </h2>
        </div>
        <span
          className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${headerBadgeClass}`}
        >
          {tickets.length}
        </span>
      </div>

      {/* Ticket Cards List */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {tickets.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/60 p-4 text-center">
            <p className="text-xs font-semibold text-zinc-400">No {title.toLowerCase()} tickets</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <KitchenTicketCard
              key={ticket.id}
              ticket={ticket}
              onStatusUpdate={onStatusUpdate}
              onPriorityUpdate={onPriorityUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
};
