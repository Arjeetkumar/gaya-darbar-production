import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Truck,
  ChefHat,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import type { Notification, NotificationType } from '../../types/notification';

interface NotificationPanelProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await onMarkRead(notif.id);
    }
    onClose();

    if (notif.order || notif.orderNumber) {
      const targetId = notif.order || notif.orderNumber;
      navigate(`/order/${targetId}`);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_PLACED':
      case 'ORDER_CONFIRMED':
        return <ShoppingBag size={16} className="text-[var(--gd-forest)]" />;
      case 'ORDER_PREPARING':
        return <ChefHat size={16} className="text-amber-600" />;
      case 'ORDER_READY':
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case 'ORDER_OUT_FOR_DELIVERY':
      case 'DELIVERY_ASSIGNED':
      case 'DELIVERY_PICKED_UP':
        return <Truck size={16} className="text-indigo-600" />;
      case 'ORDER_DELIVERED':
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case 'ORDER_CANCELLED':
      case 'DELIVERY_FAILED':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Info size={16} className="text-zinc-500" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-[var(--gd-ivory)] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[var(--gd-forest)]" />
          <h3 className="font-display text-sm font-bold text-[var(--gd-charcoal)]">
            Order Notifications
          </h3>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--gd-forest)] hover:underline"
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 font-medium">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-zinc-50 ${
                !notif.isRead ? 'bg-emerald-50/30' : ''
              }`}
            >
              <div className="mt-0.5 rounded-xl bg-zinc-100 p-2 shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-0.5 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-xs ${!notif.isRead ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-700'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                    {formatTimestamp(notif.createdAt)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.isRead && (
                <span className="mt-2 h-2 w-2 rounded-full bg-[var(--gd-forest)] shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
