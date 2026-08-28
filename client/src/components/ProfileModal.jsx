import React from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Clock } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

const SABA_USERNAME = 'saba.the.purest.women';

const SABA_QUOTES = [
  '"True beauty is reflected in character, kindness, and dignity."',
  '"Respect, modesty, and kindness create a beauty that time cannot diminish."',
  '"Some people leave an impression through the quiet strength of their character."',
  '"A pure heart sees beauty in everything it touches."',
  '"Compassion is the most beautiful language the heart speaks."',
  '"Inner beauty shines brighter than any light the world can offer."',
  '"Those who carry grace within carry a treasure no one can take away."',
];

const getQuote = (username) => {
  const idx = username?.charCodeAt(0) % SABA_QUOTES.length || 0;
  return SABA_QUOTES[idx];
};

export default function ProfileModal({ user, onClose, onMessage }) {
  const { onlineUsers } = useSocket();
  const isOnline = user ? onlineUsers.has(user._id) : false;
  const isSaba = user?.username === SABA_USERNAME;

  const lastSeenText = user?.lastSeen
    ? formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })
    : 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="h-24 relative"
          style={{
            background: isSaba
              ? 'linear-gradient(135deg, #f9a8d4, #c084fc, #818cf8)'
              : user?.role === 'admin'
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)',
          }}>
          <button onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center -mt-10 px-6 pb-6">
          <div className="ring-4 ring-[var(--bg-card)] rounded-full mb-3">
            <UserAvatar user={user} size={80} showStatus isOnline={isOnline} />
          </div>

          <h2 className="text-xl font-bold text-[var(--text-primary)] text-center">
            {user?.displayName}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-1">@{user?.username}</p>

          {/* Online status */}
          <div className="flex items-center gap-1.5 text-sm mb-4">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
            <span style={{ color: isOnline ? 'var(--success)' : 'var(--text-muted)' }}>
              {isOnline ? 'Online' : `Last seen ${lastSeenText}`}
            </span>
          </div>

          {/* Saba special section */}
          {isSaba && (
            <div className="w-full mb-4 p-4 rounded-xl text-center"
              style={{ background: 'linear-gradient(135deg, rgba(249,168,212,0.1), rgba(192,132,252,0.1))', border: '1px solid rgba(249,168,212,0.2)' }}>
              <p className="text-sm italic text-[var(--text-secondary)] leading-relaxed">
                {getQuote(user?.username)}
              </p>
              <div className="flex justify-center gap-2 mt-3 text-xs" style={{ color: 'rgba(192,132,252,0.8)' }}>
                <span>Respect</span>
                <span>·</span>
                <span>Kindness</span>
                <span>·</span>
                <span>Dignity</span>
              </div>
            </div>
          )}

          {/* Bio */}
          {user?.bio && !isSaba && (
            <p className="text-sm text-center text-[var(--text-secondary)] mb-4 px-2 leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Role badge */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
              👑 Administrator
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-4">
            <Clock size={13} />
            <span>Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}</span>
          </div>

          {/* Message button */}
          {onMessage && (
            <button onClick={onMessage}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              <MessageCircle size={16} />
              Send Message
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
