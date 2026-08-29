import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Sparkles,
  Send,
  Loader2,
  Plus,
} from 'lucide-react';
import { postsApi, storiesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import StoriesViewer from '../components/StoriesViewer';
import CreateStoryModal from '../components/CreateStoryModal';
import CreatePostModal from '../components/CreatePostModal';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Active post comments modal
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Load Feed Posts
  const loadPosts = useCallback(async (pageNum = 1) => {
    try {
      const { data } = await postsApi.getFeed({ page: pageNum, limit: 8 });
      if (data.success) {
        setPosts((prev) => (pageNum === 1 ? data.posts : [...prev, ...data.posts]));
        setHasMore(data.pagination.hasMore);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Active Stories
  const loadStories = useCallback(async () => {
    try {
      const { data } = await storiesApi.getActive();
      if (data.success) {
        setStoryGroups(data.storyGroups || []);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
  }, []);

  useEffect(() => {
    loadPosts(1);
    loadStories();
  }, [loadPosts, loadStories]);

  const handleLike = async (postId) => {
    try {
      const { data } = await postsApi.toggleLike(postId);
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount } : p
          )
        );
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleSave = async (postId) => {
    try {
      const { data } = await postsApi.toggleSave(postId);
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, isSaved: data.isSaved } : p))
        );
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleOpenComments = async (postId) => {
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const { data } = await postsApi.getComments(postId);
      if (data.success) setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentsPostId) return;

    try {
      const { data } = await postsApi.addComment(activeCommentsPostId, {
        text: commentInput.trim(),
      });
      if (data.success) {
        setComments((prev) => [...prev, data.comment]);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === activeCommentsPostId ? { ...p, commentsCount: data.commentsCount } : p
          )
        );
        setCommentInput('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[var(--bg-primary)] flex flex-col items-center">
      <div className="w-full max-w-2xl px-4 py-6 space-y-6 pb-24 md:pb-12">
        {/* ─── Stories Rail ────────────────────────────────────────────── */}
        <div className="p-4 rounded-3xl glass-card border border-white/10 overflow-x-auto flex items-center gap-4 scrollbar-none">
          {/* Add My Story Button */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
            <div
              onClick={() => setShowCreateStory(true)}
              className="relative w-16 h-16 rounded-full p-0.5 border-2 border-dashed border-pink-500/60 flex items-center justify-center group-hover:scale-105 transition-transform"
            >
              <UserAvatar user={user} size={54} />
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                <Plus size={13} />
              </div>
            </div>
            <span className="text-xs text-slate-300 font-medium truncate max-w-[64px]">
              Your Story
            </span>
          </div>

          {/* Active Story Bubbles */}
          {storyGroups.map((group, idx) => (
            <div
              key={group.author?._id || idx}
              onClick={() => setActiveStoryGroupIndex(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2.5px] group-hover:scale-105 transition-transform ${
                  group.hasUnviewed
                    ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-400'
                    : 'bg-white/20'
                }`}
              >
                <div className="w-full h-full rounded-full p-0.5 bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={group.author?.avatar}
                    alt={group.author?.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs text-slate-300 font-medium truncate max-w-[64px]">
                {group.author?.displayName?.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* ─── Create Post Banner ──────────────────────────────────────── */}
        <div className="p-4 rounded-2xl glass-card border border-white/10 flex items-center gap-3">
          <UserAvatar user={user} size={42} />
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-left text-sm text-slate-400 border border-white/10 transition-colors"
          >
            What’s on your mind? Share reflections, code, or updates…
          </button>
        </div>

        {/* ─── Feed Posts List ─────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-pink-400" />
            <p className="text-sm text-slate-400">Loading social feed…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 opacity-60">
            <Sparkles size={48} className="mx-auto mb-3 text-pink-400" />
            <h3 className="text-lg font-bold text-white">Welcome to the Feed</h3>
            <p className="text-sm text-slate-400 mt-1">Be the first to publish a post!</p>
          </div>
        ) : (
          posts.map((post) => {
            const timeAgo = post.createdAt
              ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
              : '';

            return (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl overflow-hidden glass-card border border-white/10 bg-slate-900/90 shadow-xl"
              >
                {/* Author Header */}
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                  <div
                    onClick={() => navigate(`/profile/${post.author?.username}`)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <UserAvatar user={post.author} size={42} />
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-pink-300 transition-colors">
                        {post.author?.displayName}
                      </div>
                      <div className="text-xs text-slate-400">
                        @{post.author?.username} · {timeAgo}
                      </div>
                    </div>
                  </div>

                  <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {/* Media Content (Clean, AI-focused compact presentation) */}
                {post.mediaUrl && (
                  <div className="px-4 pb-2">
                    <div className="w-full bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center max-h-72">
                      {post.mediaType === 'video' ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          playsInline
                          className="w-full h-full max-h-72 object-cover"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt="Post attachment"
                          className="w-full h-full max-h-72 object-cover hover:scale-102 transition-transform"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={`flex items-center gap-1.5 text-sm transition-transform active:scale-125 ${
                          post.isLiked ? 'text-pink-500' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Heart size={22} className={post.isLiked ? 'fill-pink-500' : ''} />
                        <span className="font-semibold text-xs">{post.likesCount || 0}</span>
                      </button>

                      <button
                        onClick={() => handleOpenComments(post._id)}
                        className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
                      >
                        <MessageCircle size={22} />
                        <span className="font-semibold text-xs">{post.commentsCount || 0}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: "Saba's World Post",
                              url: window.location.href,
                            });
                          }
                        }}
                        className="text-slate-300 hover:text-white transition-colors"
                      >
                        <Share2 size={20} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleSave(post._id)}
                      className={`transition-colors ${
                        post.isSaved ? 'text-purple-400' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Bookmark size={22} className={post.isSaved ? 'fill-purple-400' : ''} />
                    </button>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-sm text-slate-200 leading-relaxed">
                      <span className="font-bold text-white mr-2">
                        {post.author?.displayName}:
                      </span>
                      {post.caption}
                    </p>
                  )}

                  {/* Comments Preview */}
                  {post.commentsCount > 0 && (
                    <button
                      onClick={() => handleOpenComments(post._id)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      View all {post.commentsCount} comments
                    </button>
                  )}
                </div>
              </motion.article>
            );
          })
        )}
      </div>

      {/* ─── Comments Drawer / Modal ─────────────────────────────────── */}
      {activeCommentsPostId && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-lg h-[75vh] rounded-t-3xl md:rounded-3xl glass-card bg-slate-900 border border-white/15 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Comments</h3>
                <button
                  onClick={() => setActiveCommentsPostId(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingComments ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    Loading comments…
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c._id} className="flex items-start gap-3">
                      <UserAvatar user={c.author} size={34} />
                      <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">
                            {c.author?.displayName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1">{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendComment} className="p-3 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-pink-400"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-sm disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Stories Viewer Modal */}
      {activeStoryGroupIndex !== null && (
        <StoriesViewer
          storyGroups={storyGroups}
          initialGroupIndex={activeStoryGroupIndex}
          onClose={() => setActiveStoryGroupIndex(null)}
          onStoryDeleted={() => loadStories()}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={() => loadStories()}
        />
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
        />
      )}
    </div>
  );
}
