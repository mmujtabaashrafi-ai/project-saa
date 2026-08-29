import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, UploadCloud, Loader2 } from 'lucide-react';
import { mediaApi, storiesApi } from '../services/api';

export default function CreateStoryModal({ onClose, onStoryCreated }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

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

    try {
      let mediaUrl = previewUrl;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const { data: mediaData } = await mediaApi.upload(formData);
        if (!mediaData.success) throw new Error('Upload failed');
        mediaUrl = mediaData.media.url;
      }

      const { data } = await storiesApi.create({
        mediaUrl,
        mediaType,
        caption,
      });

      if (data.success) {
        if (onStoryCreated) onStoryCreated(data.story);
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <div className="relative w-full max-w-md rounded-3xl overflow-hidden glass-card border border-white/15 bg-slate-900 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles size={18} className="text-pink-400" />
              <span>Add 24h Story</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-64 rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-500/60 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-pink-400">
                  <UploadCloud size={28} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Select Story Photo or Video</p>
                  <p className="text-xs text-slate-400 mt-0.5">Expires automatically in 24 hours</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {mediaType === 'video' ? (
                  <video src={previewUrl} autoPlay loop muted className="w-full h-full object-cover" />
                ) : (
                  <img src={previewUrl} alt="Story Preview" className="w-full h-full object-cover" />
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

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Story Caption</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a short caption to your story…"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-pink-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={(!file && !previewUrl) || uploading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Publishing Story…</span>
                </>
              ) : (
                <span>Publish to Stories</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
