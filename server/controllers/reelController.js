'use strict';

const Reel = require('../models/Reel');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// ─── GET /api/reels ─────────────────────────────────────────────────────────
const getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar role')
      .lean();

    const total = await Reel.countDocuments();

    // Check which reels the user has liked
    const reelIds = reels.map((r) => r._id);
    const userLikes = await Like.find({
      user: userId,
      targetType: 'reel',
      targetId: { $in: reelIds },
    }).select('targetId');

    const likedReelIds = new Set(userLikes.map((l) => l.targetId.toString()));

    const enrichedReels = reels.map((r) => ({
      ...r,
      isLiked: likedReelIds.has(r._id.toString()),
    }));

    res.json({
      success: true,
      reels: enrichedReels,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + reels.length < total,
      },
    });
  } catch (err) {
    console.error('[ReelController getReels]', err);
    res.status(500).json({ success: false, message: 'Failed to load reels' });
  }
};

// ─── POST /api/reels ────────────────────────────────────────────────────────
const createReel = async (req, res) => {
  try {
    const { videoUrl, thumbnailUrl, caption, audioTitle, tags } = req.body;
    const userId = req.user._id;

    if (!videoUrl) {
      return res.status(400).json({ success: false, message: 'Video URL is required for reels' });
    }

    const extractedTags = (caption || '').match(/#[\w\u0590-\u05ff]+/gi) || [];
    const formattedTags = [
      ...(Array.isArray(tags) ? tags : []),
      ...extractedTags.map((t) => t.slice(1).toLowerCase()),
    ];

    const reel = await Reel.create({
      author: userId,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      caption: caption || '',
      audioTitle: audioTitle || 'Original Audio · Saba’s World',
      tags: [...new Set(formattedTags)],
    });

    const populated = await Reel.findById(reel._id).populate(
      'author',
      'username displayName avatar role'
    );

    res.status(201).json({ success: true, reel: populated });
  } catch (err) {
    console.error('[ReelController createReel]', err);
    res.status(500).json({ success: false, message: 'Failed to create reel' });
  }
};

// ─── POST /api/reels/:id/like ───────────────────────────────────────────────
const toggleReelLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    const existingLike = await Like.findOne({
      user: userId,
      targetType: 'reel',
      targetId: id,
    });

    let isLiked = false;

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      reel.likesCount = Math.max(0, reel.likesCount - 1);
      await reel.save();
      isLiked = false;
    } else {
      await Like.create({
        user: userId,
        targetType: 'reel',
        targetId: id,
      });
      reel.likesCount += 1;
      await reel.save();
      isLiked = true;

      // Notification
      if (reel.author.toString() !== userId.toString()) {
        const notif = await Notification.create({
          userId: reel.author,
          type: 'like',
          title: 'New Like on Reel',
          content: `${req.user.displayName} liked your reel.`,
          relatedUser: userId,
          relatedReel: reel._id,
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user:${reel.author}`).emit('notification:new', notif);
        }
      }
    }

    res.json({
      success: true,
      isLiked,
      likesCount: reel.likesCount,
    });
  } catch (err) {
    console.error('[ReelController toggleReelLike]', err);
    res.status(500).json({ success: false, message: 'Failed to toggle reel like' });
  }
};

// ─── GET /api/reels/:id/comments ────────────────────────────────────────────
const getReelComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ targetId: id, targetType: 'reel' })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar role')
      .lean();

    res.json({ success: true, comments });
  } catch (err) {
    console.error('[ReelController getReelComments]', err);
    res.status(500).json({ success: false, message: 'Failed to load reel comments' });
  }
};

// ─── POST /api/reels/:id/comments ───────────────────────────────────────────
const addReelComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    const comment = await Comment.create({
      targetType: 'reel',
      targetId: id,
      author: userId,
      text: text.trim(),
    });

    reel.commentsCount += 1;
    await reel.save();

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'username displayName avatar role'
    );

    if (reel.author.toString() !== userId.toString()) {
      const notif = await Notification.create({
        userId: reel.author,
        type: 'comment',
        title: 'New Reel Comment',
        content: `${req.user.displayName} commented on your reel: "${text.trim().slice(0, 50)}"`,
        relatedUser: userId,
        relatedReel: reel._id,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${reel.author}`).emit('notification:new', notif);
      }
    }

    res.status(201).json({ success: true, comment: populated, commentsCount: reel.commentsCount });
  } catch (err) {
    console.error('[ReelController addReelComment]', err);
    res.status(500).json({ success: false, message: 'Failed to post reel comment' });
  }
};

// ─── POST /api/reels/:id/view ───────────────────────────────────────────────
const recordReelView = async (req, res) => {
  try {
    const { id } = req.params;
    await Reel.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
    res.json({ success: true });
  } catch (err) {
    console.error('[ReelController recordReelView]', err);
    res.status(500).json({ success: false });
  }
};

// ─── DELETE /api/reels/:id ──────────────────────────────────────────────────
const deleteReel = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(id);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    if (reel.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this reel' });
    }

    await Reel.findByIdAndDelete(id);
    await Comment.deleteMany({ targetId: id, targetType: 'reel' });
    await Like.deleteMany({ targetId: id, targetType: 'reel' });

    res.json({ success: true, message: 'Reel deleted successfully' });
  } catch (err) {
    console.error('[ReelController deleteReel]', err);
    res.status(500).json({ success: false, message: 'Failed to delete reel' });
  }
};

module.exports = {
  getReels,
  createReel,
  toggleReelLike,
  getReelComments,
  addReelComment,
  recordReelView,
  deleteReel,
};
