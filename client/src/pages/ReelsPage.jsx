import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Music,
  Plus,
  Send,
  Loader2,
} from 'lucide-react';
import { reelsApi } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import CreateReelModal from '../components/CreateReelModal';
import { useNavigate } from 'react-router-dom';

export default function ReelsPage() {
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showCreateReel, setShowCreateReel] = useState(false);

  // Active comments modal
  const [activeCommentsReelId, setActiveCommentsReelId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const videoRefs = useRef([]);

  useEffect(() => {
    reelsApi
      .getReels({ limit: 10 })
      .then(({ data }) => {
        if (data.success) setReels(data.reels || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (reelId) => {
    try {
      const { data } = await reelsApi.toggleLike(reelId);
      if (data.success) {
        setReels((prev) =>
          prev.map((r) =>
            r._id === reelId ? { ...r, isLiked: data.isLiked, likesCount: data.likesCount } : r
          )
        );
      }
    } catch (err) {
      console.error('Reel like error:', err);
    }
  };

  const handleOpenComments = async (reelId) => {
    setActiveCommentsReelId(reelId);
    setLoadingComments(true);
    try {
      const { data } = await reelsApi.getComments(reelId);
      if (data.success) setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load reel comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentsReelId) return;

    try {
      const { data } = await reelsApi.addComment(activeCommentsReelId, {
        text: commentText.trim(),
      });
      if (data.success) {
        setComments((prev) => [...prev, data.comment]);
        setReels((prev) =>
          prev.map((r) =>
            r._id === activeCommentsReelId ? { ...r, commentsCount: data.commentsCount } : r
          )
        );
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to post reel comment:', err);
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-scroll snap-y snap-mandatory bg-black flex flex-col items-center select-none pb-16 md:pb-0">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Loader2 size={32} className="animate-spin text-purple-400" />
          <p className="text-sm text-slate-400">Loading Saba’s World Reels…</p>
        </div>
      ) : reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Music size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">No Reels Yet</h2>
          <p className="text-sm text-slate-400 max-w-xs">
            Be the first to publish a vertical video reel on Saba’s World!
          </p>
          <button
            onClick={() => setShowCreateReel(true)}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30"
          >
            Create Reel
          </button>
        </div>
      ) : (
        reels.map((reel, idx) => (
          <div
            key={reel._id}
            className="relative w-full max-w-sm h-screen snap-start flex items-center justify-center flex-shrink-0"
          >
            {/* Video Element */}
            <div className="relative w-full h-[92vh] max-h-[780px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950">
              <video
                ref={(el) => (videoRefs.current[idx] = el)}
                src={reel.videoUrl}
                loop
                autoPlay
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover"
                onClick={() => setIsMuted(!isMuted)}
              />

              {/* Mute Indicator Button */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur z-20 transition-all"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* Side Floating Action Buttons */}
              <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-5">
                {/* Author Avatar with follow/view trigger */}
                <div
                  onClick={() => navigate(`/profile/${reel.author?.username}`)}
                  className="cursor-pointer relative"
                >
                  <UserAvatar user={reel.author} size={46} />
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleLike(reel._id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div
                    className={`p-3 rounded-full bg-black/40 backdrop-blur border border-white/10 group-hover:scale-110 transition-transform ${
                      reel.isLiked ? 'text-pink-500 bg-pink-500/20' : 'text-white'
                    }`}
                  >
                    <Heart size={22} className={reel.isLiked ? 'fill-pink-500' : ''} />
                  </div>
                  <span className="text-xs text-white font-semibold">{reel.likesCount || 0}</span>
                </button>

                {/* Comments Button */}
                <button
                  onClick={() => handleOpenComments(reel._id)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="p-3 rounded-full bg-black/40 backdrop-blur border border-white/10 text-white group-hover:scale-110 transition-transform">
                    <MessageCircle size={22} />
                  </div>
                  <span className="text-xs text-white font-semibold">
                    {reel.commentsCount || 0}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "Saba's World Reel", url: window.location.href });
                    }
                  }}
                  className="p-3 rounded-full bg-black/40 backdrop-blur border border-white/10 text-white hover:scale-110 transition-transform"
                >
                  <Share2 size={20} />
                </button>
              </div>

              {/* Bottom Caption & Audio Info */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div
                  onClick={() => navigate(`/profile/${reel.author?.username}`)}
                  className="flex items-center gap-2 mb-2 cursor-pointer"
                >
                  <span className="font-bold text-white text-sm">
                    {reel.author?.displayName}
                  </span>
                  <span className="text-xs text-slate-400">@{reel.author?.username}</span>
                </div>

                {reel.caption && (
                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed mb-3">
                    {reel.caption}
                  </p>
                )}

                {/* Sound Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur max-w-fit border border-white/10">
                  <Music size={12} className="text-pink-400 animate-spin" />
                  <span className="text-[11px] text-white font-medium truncate max-w-[200px]">
                    {reel.audioTitle || 'Original Audio · Saba’s World'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Reel Comments Drawer */}
      {activeCommentsReelId && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-md h-[70vh] rounded-t-3xl md:rounded-3xl glass-card bg-slate-900 border border-white/15 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Reel Comments</h3>
                <button
                  onClick={() => setActiveCommentsReelId(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingComments ? (
                  <div className="text-center py-10 text-slate-400 text-sm">Loading…</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    No comments yet. Be first!
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c._id} className="flex items-start gap-2.5">
                      <UserAvatar user={c.author} size={32} />
                      <div className="flex-1 bg-white/5 rounded-2xl p-2.5 border border-white/5">
                        <span className="font-bold text-white text-xs block">
                          {c.author?.displayName}
                        </span>
                        <p className="text-xs text-slate-200 mt-0.5">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendComment} className="p-3 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {showCreateReel && (
        <CreateReelModal
          onClose={() => setShowCreateReel(false)}
          onReelCreated={(newReel) => setReels((prev) => [newReel, ...prev])}
        />
      )}
    </div>
  );
}
