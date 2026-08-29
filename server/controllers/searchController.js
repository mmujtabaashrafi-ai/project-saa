'use strict';

const User = require('../models/User');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const AIKnowledge = require('../models/AIKnowledge');

// ─── GET /api/search ────────────────────────────────────────────────────────
const globalSearch = async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q || !q.trim()) {
      return res.json({
        success: true,
        users: [],
        posts: [],
        reels: [],
        tags: [],
        knowledge: [],
      });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');
    const results = {};

    if (!type || type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [{ username: regex }, { displayName: regex }, { bio: regex }],
        isActive: true,
      })
        .select('username displayName avatar bio isOnline role')
        .limit(10)
        .lean();
    }

    if (!type || type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $or: [{ caption: regex }, { tags: regex }],
      })
        .populate('author', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }

    if (!type || type === 'all' || type === 'reels') {
      results.reels = await Reel.find({
        $or: [{ caption: regex }, { tags: regex }, { audioTitle: regex }],
      })
        .populate('author', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    }

    if (!type || type === 'all' || type === 'knowledge') {
      results.knowledge = await AIKnowledge.find({
        $or: [{ title: regex }, { tags: regex }, { category: regex }],
        enabled: true,
      })
        .select('title category tags content')
        .limit(5)
        .lean();
    }

    res.json({
      success: true,
      query,
      ...results,
    });
  } catch (err) {
    console.error('[SearchController globalSearch]', err);
    res.status(500).json({ success: false, message: 'Search query failed' });
  }
};

module.exports = { globalSearch };
