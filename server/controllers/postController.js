'use strict';

const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ─── GET /api/posts ─────────────────────────────────────────────────────────
const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar role')
      .lean();

    const total = await Post.countDocuments();

    // Check which posts the current user has liked or saved
    const postIds = posts.map((p) => p._id);
    const userLikes = await Like.find({
      user: userId,
      targetType: 'post',
      targetId: { $in: postIds },
    }).select('targetId');

    const likedPostIds = new Set(userLikes.map((l) => l.targetId.toString()));
    const currentUser = await User.findById(userId).select('savedPosts');
    const savedPostIds = new Set((currentUser?.savedPosts || []).map((id) => id.toString()));

    const enrichedPosts = posts.map((p) => ({
      ...p,
      isLiked: likedPostIds.has(p._id.toString()),
      isSaved: savedPostIds.has(p._id.toString()),
    }));

    res.json({
      success: true,
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (err) {
    console.error('[PostController getFeed]', err);
    res.status(500).json({ success: false, message: 'Failed to load feed' });
  }
};

// ─── POST /api/posts ────────────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { caption, mediaUrl, mediaType, aspectRatio, tags } = req.body;
    const userId = req.user._id;

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL is required' });
    }

    // Extract hashtags from caption if present
    const extractedTags = (caption || '').match(/#[\w\u0590-\u05ff]+/gi) || [];
    const formattedTags = [
      ...(Array.isArray(tags) ? tags : []),
      ...extractedTags.map((t) => t.slice(1).toLowerCase()),
    ];

    const post = await Post.create({
      author: userId,
      caption: caption || '',
      mediaUrl,
      mediaType: mediaType || 'image',
      aspectRatio: aspectRatio || '1:1',
      tags: [...new Set(formattedTags)],
    });

    const populated = await Post.findById(post._id).populate(
      'author',
      'username displayName avatar role'
    );

    res.status(201).json({ success: true, post: populated });
  } catch (err) {
    console.error('[PostController createPost]', err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// ─── POST /api/posts/:id/like ───────────────────────────────────────────────
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingLike = await Like.findOne({
      user: userId,
      targetType: 'post',
      targetId: id,
    });

    let isLiked = false;

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();
      isLiked = false;
    } else {
      await Like.create({
        user: userId,
        targetType: 'post',
        targetId: id,
      });
      post.likesCount += 1;
      await post.save();
      isLiked = true;

      // Notification for post author (if not liking own post)
      if (post.author.toString() !== userId.toString()) {
        const notif = await Notification.create({
          userId: post.author,
          type: 'like',
          title: 'New Like',
          content: `${req.user.displayName} liked your post.`,
          relatedUser: userId,
          relatedPost: post._id,
        });

        const io = req.app.get('io');
        if (io) {
          io.to(`user:${post.author}`).emit('notification:new', notif);
        }
      }
    }

    res.json({
      success: true,
      isLiked,
      likesCount: post.likesCount,
    });
  } catch (err) {
    console.error('[PostController toggleLike]', err);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
};

// ─── GET /api/posts/:id/comments ────────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await Comment.find({ targetId: id, targetType: 'post' })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar role')
      .lean();

    res.json({ success: true, comments });
  } catch (err) {
    console.error('[PostController getComments]', err);
    res.status(500).json({ success: false, message: 'Failed to load comments' });
  }
};

// ─── POST /api/posts/:id/comments ───────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentComment } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      targetType: 'post',
      targetId: id,
      author: userId,
      text: text.trim(),
      parentComment: parentComment || null,
    });

    post.commentsCount += 1;
    await post.save();

    const populated = await Comment.findById(comment._id).populate(
      'author',
      'username displayName avatar role'
    );

    // Notification for post author
    if (post.author.toString() !== userId.toString()) {
      const notif = await Notification.create({
        userId: post.author,
        type: 'comment',
        title: 'New Comment',
        content: `${req.user.displayName} commented on your post: "${text.trim().slice(0, 50)}"`,
        relatedUser: userId,
        relatedPost: post._id,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${post.author}`).emit('notification:new', notif);
      }
    }

    res.status(201).json({ success: true, comment: populated, commentsCount: post.commentsCount });
  } catch (err) {
    console.error('[PostController addComment]', err);
    res.status(500).json({ success: false, message: 'Failed to post comment' });
  }
};

// ─── POST /api/posts/:id/save ───────────────────────────────────────────────
const toggleSave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const isSaved = (user.savedPosts || []).some((p) => p.toString() === id);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter((p) => p.toString() !== id);
      await Post.findByIdAndUpdate(id, { $inc: { savesCount: -1 } });
    } else {
      user.savedPosts.push(id);
      await Post.findByIdAndUpdate(id, { $inc: { savesCount: 1 } });
    }

    await user.save();

    res.json({ success: true, isSaved: !isSaved });
  } catch (err) {
    console.error('[PostController toggleSave]', err);
    res.status(500).json({ success: false, message: 'Failed to save post' });
  }
};

// ─── DELETE /api/posts/:id ──────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Only post author or admin can delete
    if (post.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ targetId: id, targetType: 'post' });
    await Like.deleteMany({ targetId: id, targetType: 'post' });

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('[PostController deletePost]', err);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

module.exports = {
  getFeed,
  createPost,
  toggleLike,
  getComments,
  addComment,
  toggleSave,
  deletePost,
};
