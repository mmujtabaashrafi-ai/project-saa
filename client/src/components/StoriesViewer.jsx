import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { storiesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STORY_DURATION_MS = 5000;

export default function StoriesViewer({ storyGroups, initialGroupIndex = 0, onClose, onStoryDeleted }) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Mark story as viewed
  useEffect(() => {
    if (currentStory?._id) {
      storiesApi.markViewed(currentStory._id).catch(() => {});
    }
  }, [currentStory?._id]);

  // Story progress timer
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const interval = 50; // update every 50ms
    const step = (interval / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, currentStory, groupIndex, storyIndex]);

  const handleNext = () => {
    if (!currentGroup) return;

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!currentStory) return;
    if (confirm('Delete this story?')) {
      await storiesApi.delete(currentStory._id);
      if (onStoryDeleted) onStoryDeleted(currentStory._id);
      handleNext();
    }
  };

  if (!currentGroup || !currentStory) return null;

  const isOwnStory = currentGroup.author?._id === user?._id;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X size={22} />
        </button>

        {/* Previous Group Navigation Arrow */}
        {groupIndex > 0 && (
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-40"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Next Group Navigation Arrow */}
        {groupIndex < storyGroups.length - 1 && (
          <button
            onClick={handleNext}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-40"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Story Card */}
        <div className="relative w-full max-w-sm h-[86vh] rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900 flex flex-col">
          {/* Segmented Progress Bars */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
            {currentGroup.stories.map((s, idx) => (
              <div key={s._id || idx} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Author Header */}
          <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={currentGroup.author} size={36} />
              <div>
                <span className="font-bold text-white text-xs block">
                  {currentGroup.author?.displayName}
                </span>
                <span className="text-[10px] text-white/70">@{currentGroup.author?.username}</span>
              </div>
            </div>

            {isOwnStory && (
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-colors"
                title="Delete Story"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Media Content */}
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            {currentStory.mediaType === 'video' ? (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}

            {/* Click Navigation Zones */}
            <div className="absolute inset-y-0 left-0 w-1/3 z-20" onClick={handlePrev} />
            <div className="absolute inset-y-0 right-0 w-1/3 z-20" onClick={handleNext} />

            {/* Caption Overlay */}
            {currentStory.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-6 z-30 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-medium leading-relaxed drop-shadow">
                  {currentStory.caption}
                </p>
                {isOwnStory && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-white/60">
                    <Eye size={13} />
                    <span>{currentStory.viewsCount || 0} views</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
