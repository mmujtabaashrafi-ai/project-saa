'use strict';

const express = require('express');
const router = express.Router();
const reelController = require('../controllers/reelController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', reelController.getReels);
router.post('/', reelController.createReel);
router.post('/:id/like', reelController.toggleReelLike);
router.get('/:id/comments', reelController.getReelComments);
router.post('/:id/comments', reelController.addReelComment);
router.post('/:id/view', reelController.recordReelView);
router.delete('/:id', reelController.deleteReel);

module.exports = router;
