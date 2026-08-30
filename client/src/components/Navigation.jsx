import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageCircle,
  Bot,
  Shield,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Mic,
  Video,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from './UserAvatar';
import AIVoiceModal from './AIVoiceModal';
import AIVideoModal from './AIVideoModal';

// Pages that are "inner" full-screen pages (show a mobile top back bar)
const INNER_PAGE_LABELS = {
  '/chat': 'Chats & AI',
  '/ai': 'Saba AI Assistant',
  '/admin': 'Admin Console',
  '/profile': 'My Profile',
};

export default function Navigation({ showBottomNav = true }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAIVoice, setShowAIVoice] = useState(false);
  const [showAIVideo, setShowAIVideo] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleBack = () => {
    navigate('/home');
  };

  const navItems = [
    { to: '/chat', icon: MessageCircle, label: 'Chats & AI', badge: 'Active' },
    { to: '/ai', icon: Bot, label: 'Saba AI Assistant', highlight: true },
  ];

  // Determine current page label for mobile top back bar
  const currentPath = '/' + location.pathname.split('/')[1];
  const currentPageLabel = INNER_PAGE_LABELS[currentPath];

  return (
    <>
      {/* ─── Desktop Sidebar (always shown on md+) ──────────────────── */}
      <aside
        className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen p-4 lg:p-5 border-r border-white/10 flex-shrink-0 z-30 select-none backdrop-blur-xl"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Brand Logo */}
        <div>
          <div
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 px-3 py-2 mb-5 cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)' }}
            >
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-wide flex items-center gap-1.5">
                SABA'S WORLD
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                  AI
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Private AI & Messaging</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {/* Home link on desktop */}
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold shadow-sm border border-white/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Home size={20} className="text-slate-400" />
              <span className="truncate">Home</span>
            </NavLink>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/40 shadow-lg shadow-purple-500/15'
                        : 'bg-white/10 text-white font-semibold shadow-sm border border-white/10'
                      : item.highlight
                      ? 'text-purple-300 hover:bg-purple-500/10 hover:text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon
                    size={20}
                    className={item.highlight ? 'text-pink-400' : isActive ? 'text-pink-400' : 'text-slate-400'}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.highlight ? (
                    <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      AI ✨
                    </span>
                  ) : isActive ? (
                    <span className="ml-auto w-2 h-2 rounded-full bg-pink-400" />
                  ) : null}
                </NavLink>
              );
            })}

            {/* Admin Link if Admin */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-semibold'
                      : 'text-yellow-400/80 hover:bg-yellow-500/10 hover:text-yellow-300'
                  }`
                }
              >
                <Shield size={20} className="text-yellow-400" />
                <span>Admin Console</span>
              </NavLink>
            )}
          </nav>

          {/* Quick AI Voice & Video triggers */}
          <div className="grid grid-cols-2 gap-2.5 mt-6">
            <button
              onClick={() => setShowAIVoice(true)}
              className="py-2.5 px-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Mic size={15} className="text-pink-400" />
              <span>Call AI</span>
            </button>
            <button
              onClick={() => setShowAIVideo(true)}
              className="py-2.5 px-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Video size={15} className="text-blue-400" />
              <span>AI Video</span>
            </button>
          </div>
        </div>

        {/* User Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar user={user} size={38} showStatus isOnline />
            <div className="min-w-0">
              <div className="font-semibold text-white text-sm truncate">
                {user?.displayName}
              </div>
              <div className="text-xs text-slate-400 truncate">@{user?.username}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile: Top Back Bar (shown only on inner/full-screen pages) ── */}
      {!showBottomNav && currentPageLabel && (
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10 backdrop-blur-xl"
          style={{
            background: 'rgba(7, 9, 19, 0.92)',
            paddingTop: 'max(12px, env(safe-area-inset-top))',
          }}
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </button>

          <span className="text-xs font-bold text-white/80 truncate max-w-[160px] text-center">
            {currentPageLabel}
          </span>

          {/* Theme toggle on mobile inner pages */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      )}

      {/* ─── Mobile Bottom Navigation Bar (only on home/hub page) ─────── */}
      {showBottomNav && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 px-4 py-2.5 flex items-center justify-around glass-card backdrop-blur-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.96)',
            paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
          }}
        >
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-xs font-semibold transition-all ${
                isActive ? 'text-pink-400 bg-pink-500/15' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <MessageCircle size={20} />
            <span>Chats</span>
          </NavLink>

          <NavLink
            to="/ai"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-xs font-semibold transition-all ${
                isActive ? 'text-purple-400 bg-purple-500/15' : 'text-purple-300/80 hover:text-white'
              }`
            }
          >
            <Bot size={20} />
            <span>Saba AI</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-xs font-semibold transition-all ${
                  isActive ? 'text-yellow-400 bg-yellow-500/15' : 'text-slate-400 hover:text-white'
                }`
              }
            >
              <Shield size={20} />
              <span>Admin</span>
            </NavLink>
          )}
        </div>
      )}

      {/* Modals */}
      {showAIVoice && <AIVoiceModal isOpen={showAIVoice} onClose={() => setShowAIVoice(false)} />}
      {showAIVideo && <AIVideoModal isOpen={showAIVideo} onClose={() => setShowAIVideo(false)} />}
    </>
  );
}
