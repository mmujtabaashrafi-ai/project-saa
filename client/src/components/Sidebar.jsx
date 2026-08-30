import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bot, Settings, LogOut, Shield, X, MessageCircle, Moon, Sun, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { usersApi, conversationsApi } from '../services/api';
import UserAvatar from './UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// ─── Typing indicator dots ────────────────────────────────────────────────
const TypingDots = () => (
  <span className="flex gap-0.5 items-center">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="typing-dot w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </span>
);

// ─── Conversation list item ────────────────────────────────────────────────
const ConversationItem = ({
  conversation,
  isActive,
  onClick,
  currentUserId,
  typingUsers,
  onlineUsers,
}) => {
  const other = conversation.participants?.find(
    (p) => p._id !== currentUserId
  );
  const isOnline = other ? onlineUsers.has(other._id) : false;
  const isTyping = other ? typingUsers.has(other._id) : false;

  const lastMsg = conversation.lastMessage;
  const lastText = lastMsg?.text || 'Start a conversation';
  const lastTime = lastMsg?.timestamp
    ? formatDistanceToNow(new Date(lastMsg.timestamp), { addSuffix: false })
    : '';

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
        isActive
          ? 'bg-[var(--accent)] bg-opacity-20 border border-[var(--accent)] border-opacity-30'
          : 'hover:bg-white/5'
      }`}
    >
      <UserAvatar user={other} size={44} showStatus isOnline={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[var(--sidebar-text)] text-sm truncate">
            {other?.displayName || 'Unknown'}
          </span>
          {lastTime && (
            <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {lastTime}
            </span>
          )}
        </div>
        <div className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {isTyping ? <TypingDots /> : lastText}
        </div>
      </div>
    </motion.button>
  );
};

// ─── React Boat AI item ────────────────────────────────────────────────────
const AIItem = ({ isActive, onClick }) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left mb-1 ${
      isActive
        ? 'bg-purple-500/20 border border-purple-400/30'
        : 'hover:bg-white/5'
    }`}
  >
    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
      <Bot size={22} className="text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-white">Saba's World</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full text-white"
          style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', fontSize: '10px' }}>
          AI ✨
        </span>
      </div>
      <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
        Online · AI Assistant
      </div>
    </div>
  </motion.button>
);

// ─── Main Sidebar ─────────────────────────────────────────────────────────
export default function Sidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  onSelectAI,
  isAIActive,
  typingUsers = new Map(),
  onRefreshConversations,
}) {
  const { user, logout, isAdmin } = useAuth();
  const { onlineUsers } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // ─── Search users ────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setSearchMode(false);
      return;
    }

    setSearchMode(true);
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await usersApi.getAll({ search: search.trim() });
        setSearchResults(data.users || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleSelectUser = async (targetUser) => {
    try {
      const { data } = await conversationsApi.create(targetUser._id);
      if (data.success) {
        onRefreshConversations();
        onSelectConversation(data.conversation);
        setSearch('');
        setSearchMode(false);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="sidebar flex flex-col h-full" style={{ background: 'var(--sidebar-bg)' }}>
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">SABA'S WORLD ✨</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {isAdmin && (
            <button onClick={() => navigate('/admin')}
              className="p-2 rounded-lg hover:bg-yellow-400/20 transition-colors text-yellow-400/70 hover:text-yellow-400">
              <Shield size={15} />
            </button>
          )}
          <button onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/50 hover:text-red-400">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* ─── Search ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setSearchMode(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ─── React Boat AI ────────────────────────────────────────────── */}
      {!searchMode && (
        <div className="px-3">
          <AIItem isActive={isAIActive} onClick={onSelectAI} />
          <div className="text-xs px-1 mb-2 mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            MESSAGES
          </div>
        </div>
      )}

      {/* ─── Conversation List / Search Results ───────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pb-24 md:pb-4 space-y-0.5">
        <AnimatePresence mode="wait">
          {searchMode ? (
            /* Search Results */
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {searching ? (
                <div className="text-center py-8 text-white/40 text-sm">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">No users found</div>
              ) : (
                searchResults.map((u) => (
                  <motion.button
                    key={u._id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectUser(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                  >
                    <UserAvatar user={u} size={38} showStatus isOnline={onlineUsers.has(u._id)} />
                    <div>
                      <div className="text-sm font-medium text-white">{u.displayName}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        @{u.username}
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </motion.div>
          ) : (
            /* Conversation List */
            <motion.div key="convos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {conversations.length === 0 ? (
                <div className="text-center py-10">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-20 text-white" />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Search for someone to start chatting
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <ConversationItem
                    key={conv._id}
                    conversation={conv}
                    isActive={activeConversation?._id === conv._id && !isAIActive}
                    onClick={() => onSelectConversation(conv)}
                    currentUserId={user?._id}
                    typingUsers={typingUsers}
                    onlineUsers={onlineUsers}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Profile Footer ───────────────────────────────────────────── */}
      <div className="border-t border-white/5 px-4 py-3 hidden md:flex items-center gap-3">
        <UserAvatar user={user} size={36} showStatus isOnline />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{user?.displayName}</div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {user?.role === 'admin' ? '👑 Admin' : '@' + user?.username}
          </div>
        </div>
      </div>
    </div>
  );
}
