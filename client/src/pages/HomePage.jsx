import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Bot, Shield, Sparkles, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from '../components/UserAvatar';

export default function HomePage() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const cards = [
    {
      to: '/chat',
      icon: MessageCircle,
      label: 'Chats & AI',
      description: 'Private real-time messaging and AI companion hub',
      gradient: 'from-pink-500 to-rose-600',
      glow: 'rgba(236,72,153,0.3)',
      iconBg: 'bg-pink-500/15 border-pink-500/30',
      iconColor: 'text-pink-400',
      badge: 'Active',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    },
    {
      to: '/ai',
      icon: Bot,
      label: 'Saba AI Assistant',
      description: 'Thoughtful, conversational AI — ask anything',
      gradient: 'from-purple-500 to-violet-600',
      glow: 'rgba(139,92,246,0.3)',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      iconColor: 'text-purple-400',
      badge: 'AI ✨',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 24 } },
  };

  return (
    <div
      className="flex flex-col min-h-dvh w-full bg-[var(--bg-primary)] overflow-y-auto pb-20"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)' }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-wide leading-tight flex items-center gap-1.5">
              SABA'S WORLD
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                AI
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight">Private AI & Messaging</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ─── Welcome greeting ─────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <UserAvatar user={user} size={44} showStatus isOnline />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400 font-medium">Welcome back 👋</p>
            <p className="text-white font-bold text-sm truncate">{user?.displayName}</p>
            <p className="text-[11px] text-slate-500 truncate">@{user?.username}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Navigation Cards ─────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-5 space-y-3"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.to}
              variants={cardVariants}
              onClick={() => navigate(card.to)}
              whileTap={{ scale: 0.975 }}
              className="w-full text-left p-5 rounded-3xl border border-white/10 hover:border-white/20 transition-all relative overflow-hidden group shadow-lg"
              style={{
                background: 'var(--bg-card)',
                boxShadow: `0 4px 30px -8px ${card.glow}`,
              }}
            >
              {/* Subtle gradient shimmer on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
                style={{
                  background: `linear-gradient(135deg, ${card.glow.replace('0.3', '0.08')}, transparent 60%)`,
                }}
              />
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${card.iconBg} group-hover:scale-110 transition-transform`}
                >
                  <Icon size={22} className={card.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white text-sm">{card.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{card.description}</p>
                </div>
                <div className="text-slate-600 group-hover:text-slate-400 transition-colors text-lg flex-shrink-0">›</div>
              </div>
            </motion.button>
          );
        })}

        {/* Admin card — only for admins */}
        {isAdmin && (
          <motion.button
            variants={cardVariants}
            onClick={() => navigate('/admin')}
            whileTap={{ scale: 0.975 }}
            className="w-full text-left p-5 rounded-3xl border border-yellow-500/20 hover:border-yellow-500/40 transition-all relative overflow-hidden group shadow-lg"
            style={{
              background: 'var(--bg-card)',
              boxShadow: '0 4px 30px -8px rgba(234,179,8,0.2)',
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.05), transparent 60%)' }}
            />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border bg-yellow-500/10 border-yellow-500/30 group-hover:scale-110 transition-transform">
                <Shield size={22} className="text-yellow-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white text-sm">Admin Console</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-500/30 font-bold">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">Manage users, content, and platform settings</p>
              </div>
              <div className="text-slate-600 group-hover:text-slate-400 transition-colors text-lg flex-shrink-0">›</div>
            </div>
          </motion.button>
        )}
      </motion.div>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <div className="flex-1" />
      <div className="px-5 py-4 text-center">
        <p className="text-[11px] text-slate-600">
          Saba's World · Private & Encrypted
        </p>
      </div>
    </div>
  );
}
