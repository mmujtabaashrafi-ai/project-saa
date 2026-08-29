'use strict';

const Story = require('../models/Story');
const StoryView = require('../models/StoryView');

// ─── GET /api/stories ───────────────────────────────────────────────────────
const getActiveStories = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Get all stories that haven't expired yet
    const stories = await Story.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName avatar')
      .lean();

    // Get list of story IDs this user has viewed
    const viewedRecords = await StoryView.find({
      viewer: userId,
      storyId: { $in: stories.map((s) => s._id) },
    }).select('storyId');

    const viewedStoryIds = new Set(viewedRecords.map((v) => v.storyId.toString()));

    // Group stories by author
    const authorMap = new Map();

    for (const s of stories) {
      const authorId = s.author._id.toString();
      const isViewed = viewedStoryIds.has(s._id.toString());

      if (!authorMap.has(authorId)) {
        authorMap.set(authorId, {
          author: s.author,
          hasUnviewed: !isViewed,
          stories: [{ ...s, isViewed }],
        });
      } else {
        const group = authorMap.get(authorId);
        if (!isViewed) group.hasUnviewed = true;
        group.stories.push({ ...s, isViewed });
      }
    }

    const storyGroups = Array.from(authorMap.values()).sort((a, b) => {
      // Put current user's stories first, then unviewed stories
      if (a.author._id.toString() === userId.toString()) return -1;
      if (b.author._id.toString() === userId.toString()) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    res.json({ success: true, storyGroups });
  } catch (err) {
    console.error('[StoryController getActiveStories]', err);
    res.status(500).json({ success: false, message: 'Failed to load stories' });
  }
};

// ─── POST /api/stories ──────────────────────────────────────────────────────
const createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType, caption } = req.body;
    const userId = req.user._id;

    if (!mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL is required for a story' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const story = await Story.create({
      author: userId,
      mediaUrl,
      mediaType: mediaType || 'image',
      caption: caption?.trim() || '',
      expiresAt,
    });

    const populated = await Story.findById(story._id).populate(
      'author',
      'username displayName avatar'
    );

    res.status(201).json({ success: true, story: populated });
  } catch (err) {
    console.error('[StoryController createStory]', err);
    res.status(500).json({ success: false, message: 'Failed to create story' });
  }
};

// ─── POST /api/stories/:id/view ─────────────────────────────────────────────
const markStoryViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const existing = await StoryView.findOne({ storyId: id, viewer: userId });
    if (!existing) {
      await StoryView.create({ storyId: id, viewer: userId });
      story.viewsCount += 1;
      await story.save();
    }

    res.json({ success: true, viewsCount: story.viewsCount });
  } catch (err) {
    console.error('[StoryController markStoryViewed]', err);
    res.status(500).json({ success: false, message: 'Failed to record view' });
  }
};

// ─── DELETE /api/stories/:id ────────────────────────────────────────────────
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this story' });
    }

    await Story.findByIdAndDelete(id);
    await StoryView.deleteMany({ storyId: id });

    res.json({ success: true, message: 'Story deleted successfully' });
  } catch (err) {
    console.error('[StoryController deleteStory]', err);
    res.status(500).json({ success: false, message: 'Failed to delete story' });
  }
};

module.exports = {
  getActiveStories,
  createStory,
  markStoryViewed,
  deleteStory,
};
