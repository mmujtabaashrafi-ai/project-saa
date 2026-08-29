import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Grid,
  Film,
  Bookmark,
  MessageCircle,
  Phone,
  Video,
  ExternalLink,
  Shield,
  Loader2,
  Heart,
} from 'lucide-react';
import { usersApi, postsApi, reelsApi, conversationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const targetUsername = username || currentUser?.username;
  const isOwnProfile = targetUsername === currentUser?.username;

  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels' | 'saved'
  const [userPosts, setUserPosts] = useState([]);
  const [userReels, setUserReels] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
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
          // Load user posts & reels
          postsApi.getFeed().then((res) => {
            if (res.data.success) {
              setUserPosts(res.data.posts.filter((p) => p.author?.username === targetUsername));
              if (isOwnProfile) {
                setSavedPosts(res.data.posts.filter((p) => p.isSaved));
              }
            }
          });
          reelsApi.getReels().then((res) => {
            if (res.data.success) {
              setUserReels(res.data.reels.filter((r) => r.author?.username === targetUsername));
            }
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetUsername, isOwnProfile]);

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
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center pb-24 md:pb-12">
      <div className="w-full max-w-3xl px-4 py-8 space-y-8">
        {/* ─── Profile Header ─────────────────────────────────────────── */}
        <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/10 bg-slate-900/90 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <div className="relative">
            <UserAvatar user={profileUser} size={100} showStatus isOnline={profileUser.isOnline} />
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center justify-center md:justify-start gap-2">
                  {profileUser.displayName}
                  {profileUser.role === 'admin' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1 font-bold">
                      <Shield size={12} />
                      Admin
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-400">@{profileUser.username}</p>
              </div>

              {!isOwnProfile && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleStartChat}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <MessageCircle size={15} />
                    <span>Message</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                {profileUser.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center justify-center md:justify-start gap-6 pt-2 border-t border-white/10 text-sm">
              <div>
                <span className="font-extrabold text-white text-base mr-1">
                  {userPosts.length}
                </span>
                <span className="text-slate-400 text-xs font-medium">Posts</span>
              </div>
              <div>
                <span className="font-extrabold text-white text-base mr-1">
                  {userReels.length}
                </span>
                <span className="text-slate-400 text-xs font-medium">Reels</span>
              </div>
              <div>
                <span className="font-extrabold text-emerald-400 text-xs uppercase font-bold tracking-wider">
                  Open Social ✨
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Profile Tabs ────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('posts')}
            className={`pb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'posts'
                ? 'border-pink-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Grid size={15} />
            <span>Posts ({userPosts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reels')}
            className={`pb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'reels'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Film size={15} />
            <span>Reels ({userReels.length})</span>
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'saved'
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark size={15} />
              <span>Saved ({savedPosts.length})</span>
            </button>
          )}
        </div>

        {/* ─── Tab Content ─────────────────────────────────────────────── */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userPosts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                No posts shared yet.
              </div>
            ) : (
              userPosts.map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate('/home')}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative group cursor-pointer shadow-lg"
                >
                  <img
                    src={p.mediaUrl}
                    alt="User Post"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                    <span className="flex items-center gap-1">
                      <Heart size={16} className="fill-white" />
                      {p.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={16} className="fill-white" />
                      {p.commentsCount || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {userReels.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                No reels uploaded yet.
              </div>
            ) : (
              userReels.map((r) => (
                <div
                  key={r._id}
                  onClick={() => navigate('/reels')}
                  className="aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative group cursor-pointer shadow-lg"
                >
                  <video src={r.videoUrl} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 backdrop-blur rounded-xl text-white text-xs truncate">
                    {r.caption || r.audioTitle}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {savedPosts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                No saved posts. Save posts from the feed to view them here!
              </div>
            ) : (
              savedPosts.map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate('/home')}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative group cursor-pointer shadow-lg"
                >
                  <img src={p.mediaUrl} alt="Saved" className="w-full h-full object-cover" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
