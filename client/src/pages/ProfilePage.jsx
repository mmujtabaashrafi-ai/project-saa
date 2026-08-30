import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Bot,
  Shield,
  Loader2,
  Heart,
  Sparkles,
  User,
  Calendar,
  Lock,
  Quote,
} from 'lucide-react';
import { usersApi, conversationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { SABA_QUOTES } from '../data/sabaKnowledge';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = targetUsername === currentUser?.username;

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUsername) return;

    setLoading(true);
    usersApi
      .getAll({ search: targetUsername })
      .then(({ data }) => {
        const found = (data.users || []).find((u) => u.username === targetUsername);
        if (found) {
          setProfileUser(found);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetUsername]);

  const handleStartChat = async () => {
    if (!profileUser) return;
    try {
      const { data } = await conversationsApi.create(profileUser._id);
      if (data.success) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 size={32} className="animate-spin text-pink-500" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-center p-4">
        <h2 className="text-xl font-bold text-white mb-2">User Not Found</h2>
        <p className="text-sm text-slate-400">The profile @{targetUsername} does not exist.</p>
        <button
          onClick={() => navigate('/chat')}
          className="mt-4 px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all"
        >
          Return to Chats
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center pb-24 md:pb-12">
      <div className="w-full max-w-3xl px-4 py-8 space-y-6">
        {/* ─── Profile Card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-3xl glass-card border border-white/10 bg-slate-900/90 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-20 blur-3xl -z-10"
            style={{
              background: 'radial-gradient(circle, #ec4899 0%, #8b5cf6 60%, transparent 80%)',
            }}
          />

          <div className="relative">
            <UserAvatar user={profileUser} size={100} showStatus isOnline={profileUser.isOnline} />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                  {profileUser.displayName}
                  {profileUser.role === 'admin' ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1 font-bold">
                      <Shield size={12} />
                      Admin
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1 font-bold">
                      <Sparkles size={12} />
                      Member
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-400">@{profileUser.username}</p>
              </div>

              <div className="flex items-center justify-center gap-2.5">
                {!isOwnProfile ? (
                  <button
                    onClick={handleStartChat}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg flex items-center gap-2 transition-all hover:brightness-110 active:scale-95"
                  >
                    <MessageCircle size={15} />
                    <span>Direct Message</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/ai')}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg flex items-center gap-2 transition-all hover:brightness-110 active:scale-95"
                  >
                    <Bot size={15} />
                    <span>Chat with Saba AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                {profileUser.bio}
              </p>
            )}

            {/* Account Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-3 border-t border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <Lock size={13} className="text-pink-400" />
                <span>Private & Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <Sparkles size={13} className="text-purple-400" />
                <span>AI Companion Enabled</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{profileUser.isOnline ? 'Online Now' : 'Active Account'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Words of Grace Reflection Card ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl glass-card border border-pink-500/20 bg-slate-900/60 shadow-xl text-left space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-300">
            <Quote size={15} className="text-pink-400" />
            <span>Words of Grace ✨</span>
          </div>
          <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed">
            "{SABA_QUOTES[0]}"
          </p>
          <p className="text-xs text-slate-400">
            A sanctuary built on dignity, modest beauty, and respectful companionship.
          </p>
        </motion.div>

        {/* ─── Quick Shortcuts Card ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div
            onClick={() => navigate('/chat')}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all cursor-pointer group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-3 group-hover:scale-105 transition-transform">
              <MessageCircle size={20} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Direct Messages</h3>
            <p className="text-xs text-slate-400">
              Engage in private, real-time conversations with contacts.
            </p>
          </div>

          <div
            onClick={() => navigate('/ai')}
            className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer group shadow-md"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-105 transition-transform">
              <Bot size={20} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Saba AI Assistant</h3>
            <p className="text-xs text-slate-400">
              Explore thoughtful reflections, learn technical topics, and seek inspiration.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
