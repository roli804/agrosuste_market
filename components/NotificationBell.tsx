import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { mockDb } from '../lib/mock_db';
import { DeliveryStatus } from '../types';

interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: 'delivery' | 'order' | 'system';
}

interface NotificationBellProps {
  userId?: string;
}

const SEEN_KEY = 'agrosuste_seen_notifications';

const NotificationBell: React.FC<NotificationBellProps> = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
    catch { return new Set(); }
  });
  const ref = useRef<HTMLDivElement>(null);

  const buildNotifications = () => {
    const deliveries = mockDb.getDeliveryRequests();
    const pending = deliveries.filter(d => d.status === DeliveryStatus.PENDENTE);
    return pending.map(d => ({
      id: d.id,
      message: `📦 Novo pedido de entrega: ${d.pickup_address} → ${d.delivery_address}`,
      time: new Date(d.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }),
      read: seenIds.has(d.id),
      type: 'delivery' as const,
    }));
  };

  useEffect(() => {
    setNotifications(buildNotifications());
    const interval = setInterval(() => setNotifications(buildNotifications()), 10000);
    const onDbChange = () => setNotifications(buildNotifications());
    window.addEventListener('mock-db-changed', onDbChange);
    return () => { clearInterval(interval); window.removeEventListener('mock-db-changed', onDbChange); };
  }, [seenIds]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const allIds = new Set([...seenIds, ...notifications.map(n => n.id)]);
    setSeenIds(allIds);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...allIds]));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    const updated = new Set([...seenIds, id]);
    setSeenIds(updated);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...updated]));
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2.5 rounded-xl bg-white border border-[#E0E0E0] hover:border-[#2E7D32]/30 hover:bg-[#F1F8F4] transition-all shadow-sm active:scale-95"
        aria-label="Notificações"
      >
        <Bell size={20} className={`transition-colors ${unread > 0 ? 'text-[#2E7D32]' : 'text-[#6D6D6D]'}`} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-in zoom-in-75 duration-200">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-[#E0E0E0]/80 z-[500] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#2E7D32]" />
              <h4 className="font-poppins font-bold text-[14px] text-[#1C1C1C]">Notificações</h4>
              {unread > 0 && (
                <span className="bg-[#2E7D32]/10 text-[#2E7D32] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread} nova{unread !== 1 ? 's' : ''}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] font-semibold text-[#6D6D6D] hover:text-[#2E7D32] transition-colors">
                Marcar tudo lido
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto divide-y divide-[#F5F5F5]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-[13px] text-[#A0A0A0] font-medium">Sem notificações de momento</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-5 py-4 transition-colors hover:bg-[#F9FFF9] flex items-start gap-3 ${!n.read ? 'bg-[#F1F8F4]' : ''}`}
                >
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 transition-opacity ${!n.read ? 'bg-[#2E7D32] opacity-100' : 'opacity-0'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug ${!n.read ? 'font-semibold text-[#1C1C1C]' : 'font-medium text-[#6D6D6D]'}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-[#A0A0A0] mt-1">{n.time}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-5 py-3 border-t border-[#F0F0F0] bg-[#FAFAF8]">
            <p className="text-[11px] text-[#B0B0B0] text-center font-medium">AgroSuste • Sistema de Notificações</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
