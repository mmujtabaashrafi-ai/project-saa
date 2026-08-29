import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Hash, Film, BookOpen, Users, Sparkles, Loader2, Heart, MessageCircle } from 'lucide-react';
import { searchApi, postsApi } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import { useNavigate } from 'react-router-dom';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'users' | 'posts' | 'reels' | 'knowledge'
  const [searchResults, setSearchResults] = useState(null);
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load initial discovery posts
  useEffect(() => {
    postsApi
      .getFeed({ limit: 18 })
      .then(({ data }) => {
        if (data.success) setExplorePosts(data.posts || []);
      })
      .catch(console.error);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchApi.search({ q: searchTerm.trim(), type: activeTab });
        if (data.success) setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, activeTab]);

  const trendingTags = [
    '#SabasWorld',
    '#Java',
    '#Python',
    '#DSA',
    '#MachineLearning',
    '#Wisdom',
    '#WebRTC',
    '#React',
  ];

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-6 space-y-6 pb-24 md:pb-12">
        {/* ─── Search Bar ──────────────────────────────────────────────── */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users, hashtags, posts, reels, or CS knowledge…"
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-white/10 text-white text-sm outline-none focus:border-pink-500 transition-all shadow-lg"
          />
        </div>

        {/* ─── Filter Tabs & Trending Tags ─────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'users', 'posts', 'reels', 'knowledge'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ─── Trending Topics ─────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl glass-card border border-white/10">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles size={13} className="text-pink-400" />
            <span>Trending Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-purple-300 font-medium transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Search Results or Discovery Grid ────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin text-pink-400" />
            <p className="text-xs text-slate-400">Searching database…</p>
          </div>
        ) : searchResults ? (
          /* Search Results */
          <div className="space-y-6">
            {/* Users */}
            {searchResults.users?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} />
                  <span>Users ({searchResults.users.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.users.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => navigate(`/profile/${u.username}`)}
                      className="p-3 rounded-2xl glass-card border border-white/10 hover:border-pink-500/40 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <UserAvatar user={u} size={42} showStatus isOnline={u.isOnline} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">{u.displayName}</div>
                        <div className="text-xs text-slate-400 truncate">@{u.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge */}
            {searchResults.knowledge?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={14} />
                  <span>AI Knowledge Items ({searchResults.knowledge.length})</span>
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {searchResults.knowledge.map((k) => (
                    <div
                      key={k._id}
                      onClick={() => navigate('/ai')}
                      className="p-4 rounded-2xl glass-card border border-purple-500/20 hover:border-purple-500/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-sm">{k.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                          {k.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{k.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {searchResults.posts?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Posts ({searchResults.posts.length})
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {searchResults.posts.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => navigate('/home')}
                      className="aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 relative group cursor-pointer"
                    >
                      <img
                        src={p.mediaUrl}
                        alt="Post"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Default Discovery Grid */
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Explore Recent Highlights
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {explorePosts.map((post) => (
                <motion.div
                  key={post._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate('/home')}
                  className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer bg-slate-900 border border-white/10 shadow-lg"
                >
                  <img
                    src={post.mediaUrl}
                    alt="Explore"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                    <span className="flex items-center gap-1">
                      <Heart size={16} className="fill-white" />
                      {post.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={16} className="fill-white" />
                      {post.commentsCount || 0}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
