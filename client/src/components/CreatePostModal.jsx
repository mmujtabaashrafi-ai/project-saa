import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, UploadCloud, Loader2, Hash, Sparkles } from 'lucide-react';
import { mediaApi, postsApi } from '../services/api';

export default function CreatePostModal({ onClose, onPostCreated }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    const isVideo = selected.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    const preview = URL.createObjectURL(selected);
    setPreviewUrl(preview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !previewUrl) return;

    setUploading(true);
    setProgress(20);

    try {
      let mediaUrl = previewUrl;

      // If local file, upload via mediaApi
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        setProgress(50);
        const { data: mediaData } = await mediaApi.upload(formData);
        if (!mediaData.success) throw new Error('Media upload failed');
        mediaUrl = mediaData.media.url;
      }

      setProgress(85);
      const { data } = await postsApi.create({
        mediaUrl,
        mediaType,
        caption,
      });

      if (data.success) {
        if (onPostCreated) onPostCreated(data.post);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create post');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const popularTags = ['#SabasWorld', '#AI', '#Tech', '#Motivation', '#Coding', '#Peace'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <div className="relative w-full max-w-lg rounded-3xl overflow-hidden glass-card border border-white/15 bg-slate-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles size={18} className="text-pink-400" />
              <span>Create New Post</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* Media Upload Area */}
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-56 rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-500/60 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-pink-400">
                  <UploadCloud size={28} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Click to select photo or video</p>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP, MP4 (up to 50MB)</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video src={previewUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Caption & Reflections
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Share your thoughts, wisdom, or code journey…"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-all resize-none"
              />
            </div>

            {/* Quick Hashtags */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                <Hash size={12} />
                <span>Suggested Hashtags</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCaption((prev) => `${prev} ${tag}`.trim())}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-purple-300 font-medium transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={(!file && !previewUrl) || uploading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Publishing Post…</span>
                </>
              ) : (
                <span>Share Post</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
