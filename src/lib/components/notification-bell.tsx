"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Check, ChevronRight, Clock, MessageSquare, AlertTriangle, CreditCard, Gift, Shield, Info, X } from "lucide-react";
import Link from "next/link";
import { notificationService, type AppNotification } from "@/lib/notification/notification-service";

const typeIcons: Record<string, React.ReactNode> = {
  trip: <Clock className="w-4 h-4 text-primary" />,
  payment: <CreditCard className="w-4 h-4 text-success" />,
  promotion: <Gift className="w-4 h-4 text-warning" />,
  security: <Shield className="w-4 h-4 text-error" />,
  system: <Info className="w-4 h-4 text-info" />,
  message: <MessageSquare className="w-4 h-4 text-accent" />,
  verification: <AlertTriangle className="w-4 h-4 text-warning" />,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const all = await notificationService.getAll();
      setRecent(all.slice(0, 5));
      setUnreadCount(await notificationService.getUnreadCount());
    }
    load();
    const unsub = notificationService.subscribe(() => {
      notificationService.getAll().then(all => setRecent(all.slice(0, 5)));
      notificationService.getUnreadCount().then(setUnreadCount);
    });
    return unsub;
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleMarkAll() {
    await notificationService.markAllAsRead();
  }

  async function handleClickNotification(n: AppNotification) {
    if (!n.read) await notificationService.markAsRead(n.id);
    setOpen(false);
    if (n.actionUrl) window.location.href = n.actionUrl;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-card-bg transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-primary" />
        ) : (
          <Bell className="w-5 h-5 text-gray-400" />
        )}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel overflow-hidden shadow-2xl z-50"
          >
            <div className="p-4 border-b border-card-border flex items-center justify-between">
              <span className="font-bold text-white">Notificações</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} className="text-xs text-primary hover:underline font-medium">
                  Marcar todas lidas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recent.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nenhuma notificação
                </div>
              ) : (
                recent.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left p-4 flex items-start gap-3 hover:bg-card-bg/50 transition-colors border-b border-card-border/50 ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className="mt-0.5">{typeIcons[n.type] || <Info className="w-4 h-4 text-gray-500" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-white truncate">{n.title}</span>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </button>
                ))
              )}
            </div>

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="p-3 border-t border-card-border flex items-center justify-center gap-1 text-sm text-primary font-medium hover:bg-card-bg/50 transition-colors"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
