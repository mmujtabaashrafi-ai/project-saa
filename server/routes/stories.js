'use strict';

const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', storyController.getActiveStories);
router.post('/', storyController.createStory);
router.post('/:id/view', storyController.markStoryViewed);
router.delete('/:id', storyController.deleteStory);

module.exports = router;
