import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Compass,
  Film,
  MessageCircle,
  Bot,
  Bell,
  User,
  Shield,
  LogOut,
  PlusSquare,
  Sparkles,
  Sun,
  Moon,
  Mic,
  Video,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from './UserAvatar';
import CreatePostModal from './CreatePostModal';
import CreateStoryModal from './CreateStoryModal';
import CreateReelModal from './CreateReelModal';
import AIVoiceModal from './AIVoiceModal';
import AIVideoModal from './AIVideoModal';

export default function Navigation() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showCreateReel, setShowCreateReel] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showAIVoice, setShowAIVoice] = useState(false);
  const [showAIVideo, setShowAIVideo] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/explore', icon: Compass, label: 'Explore' },
    { to: '/reels', icon: Film, label: 'Reels' },
    { to: '/chat', icon: MessageCircle, label: 'Messages' },
    { to: '/ai', icon: Bot, label: 'AI Assistant', highlight: true },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: `/profile/${user?.username}`, icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* ─── Desktop Sidebar ────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen p-5 border-r border-white/10 flex-shrink-0 z-30 select-none"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Brand Logo */}
        <div>
          <div
            onClick={() => navigate('/home')}
            className="flex items-center gap-3 px-3 py-2 mb-6 cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)' }}
            >
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-wide flex items-center gap-1.5">
                SABA'S WORLD
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  AI+
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Social · Chat · Intelligence</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'bg-white/10 text-white font-semibold shadow-sm'
                      : item.highlight
                      ? 'text-purple-300 hover:bg-purple-500/10 hover:text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon
                    size={20}
                    className={item.highlight ? 'text-pink-400' : isActive ? 'text-white' : 'text-slate-400'}
                  />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      AI ✨
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Admin Link if Admin */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
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

          {/* Quick Create Button with Popover */}
          <div className="relative mt-5">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="w-full py-3 px-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1, #a855f7)' }}
            >
              <PlusSquare size={18} />
              <span>Create Post</span>
            </button>

            {showCreateMenu && (
              <div
                className="absolute left-0 right-0 bottom-full mb-2 p-2 rounded-2xl glass-card border border-white/15 shadow-2xl z-40 bg-slate-900/95 flex flex-col gap-1"
                onClick={() => setShowCreateMenu(false)}
              >
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium text-left"
                >
                  <PlusSquare size={16} className="text-blue-400" />
                  <span>Share Photo / Video Post</span>
                </button>
                <button
                  onClick={() => setShowCreateStory(true)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium text-left"
                >
                  <Sparkles size={16} className="text-pink-400" />
                  <span>Add 24h Story</span>
                </button>
                <button
                  onClick={() => setShowCreateReel(true)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium text-left"
                >
                  <Film size={16} className="text-purple-400" />
                  <span>Upload Short Reel</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick AI Voice & Video triggers */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => setShowAIVoice(true)}
              className="py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Mic size={14} className="text-pink-400" />
              <span>Call AI</span>
            </button>
            <button
              onClick={() => setShowAIVideo(true)}
              className="py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Video size={14} className="text-blue-400" />
              <span>AI Video</span>
            </button>
          </div>
        </div>

        {/* User Footer Profile */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div
            onClick={() => navigate(`/profile/${user?.username}`)}
            className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
          >
            <UserAvatar user={user} size={38} showStatus isOnline />
            <div className="min-w-0">
              <div className="font-semibold text-white text-sm truncate group-hover:text-pink-300 transition-colors">
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

      {/* ─── Mobile Bottom Navigation Bar ─────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 px-3 py-2 flex items-center justify-around glass-card backdrop-blur-xl"
        style={{ background: 'rgba(15, 23, 42, 0.95)' }}
      >
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `p-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs ${
              isActive ? 'text-pink-400 font-bold' : 'text-slate-400'
            }`
          }
        >
          <Home size={20} />
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `p-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs ${
              isActive ? 'text-pink-400 font-bold' : 'text-slate-400'
            }`
          }
        >
          <Compass size={20} />
        </NavLink>

        <button
          onClick={() => setShowCreatePost(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/20"
          style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
        >
          <PlusSquare size={20} />
        </button>

        <NavLink
          to="/reels"
          className={({ isActive }) =>
            `p-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs ${
              isActive ? 'text-pink-400 font-bold' : 'text-slate-400'
            }`
          }
        >
          <Film size={20} />
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `p-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs ${
              isActive ? 'text-pink-400 font-bold' : 'text-slate-400'
            }`
          }
        >
          <MessageCircle size={20} />
        </NavLink>

        <NavLink
          to="/ai"
          className={({ isActive }) =>
            `p-2.5 rounded-xl flex flex-col items-center gap-0.5 text-xs ${
              isActive ? 'text-purple-400 font-bold' : 'text-purple-300'
            }`
          }
        >
          <Bot size={20} />
        </NavLink>
      </div>

      {/* Modals */}
      {showCreatePost && <CreatePostModal onClose={() => setShowCreatePost(false)} />}
      {showCreateStory && <CreateStoryModal onClose={() => setShowCreateStory(false)} />}
      {showCreateReel && <CreateReelModal onClose={() => setShowCreateReel(false)} />}
      {showAIVoice && <AIVoiceModal isOpen={showAIVoice} onClose={() => setShowAIVoice(false)} />}
      {showAIVideo && <AIVideoModal isOpen={showAIVideo} onClose={() => setShowAIVideo(false)} />}
    </>
  );
}
