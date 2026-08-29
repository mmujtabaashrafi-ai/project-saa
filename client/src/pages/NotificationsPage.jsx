import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Heart,
  MessageCircle,
  AtSign,
  Video,
  Phone,
  Sparkles,
  BookOpen,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react';
import { notificationsApi } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';

const ICON_MAP = {
  like: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/15 border-pink-500/20' },
  comment: { icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  mention: { icon: AtSign, color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/20' },
  call: { icon: Phone, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/20' },
  story: { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/20' },
  ai: { icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/20' },
  message: { icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/20' },
  system: { icon: Bell, color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/20' },
  admin: { icon: Bell, color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/20' },
};

const FILTER_TABS = ['all', 'likes', 'comments', 'mentions', 'calls', 'ai'];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    notificationsApi
      .getAll()
      .then(({ data }) => {
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount((data.notifications || []).filter((n) => !n.isRead).length);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Clear error:', err);
    }
  };

  const filterTypeMap = {
    likes: 'like',
    comments: 'comment',
    mentions: 'mention',
    calls: 'call',
    ai: 'ai',
  };

  const filtered =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === filterTypeMap[activeFilter]);

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center">
      <div className="w-full max-w-2xl px-4 py-6 space-y-5 pb-24 md:pb-12">
        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Bell size={22} className="text-pink-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-600 text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Activity across Saba's World</p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Check size={13} />
                <span>Mark All Read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-xs text-slate-400 hover:text-red-300 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Filter Tabs ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                activeFilter === tab
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'all' ? `All (${notifications.length})` : tab}
            </button>
          ))}
        </div>

        {/* ─── Notification List ────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-pink-400" />
            <p className="text-xs text-slate-400">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 opacity-60">
            <Bell size={48} className="mx-auto mb-3 text-slate-500" />
            <h3 className="text-base font-bold text-white">
              {activeFilter === 'all' ? 'No Notifications Yet' : `No ${activeFilter} notifications`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Activity across the platform will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => {
              const meta = ICON_MAP[notif.type] || ICON_MAP.system;
              const IconComp = meta.icon;
              const timeAgo = notif.createdAt
                ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })
                : '';

              return (
                <motion.div
                  key={notif._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    notif.isRead
                      ? 'bg-white/3 border-white/5 opacity-70 hover:opacity-100'
                      : 'bg-white/8 border-white/10 hover:bg-white/12 shadow-lg'
                  }`}
                >
                  {/* Icon Badge */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${meta.bg}`}
                  >
                    <IconComp size={18} className={meta.color} />
                  </div>

                  {/* Related User Avatar */}
                  {notif.relatedUser && (
                    <UserAvatar user={notif.relatedUser} size={36} />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-snug">
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                      {notif.content}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">{timeAgo}</span>
                  </div>

                  {/* Unread Dot */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
