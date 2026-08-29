'use strict';

const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', postController.getFeed);
router.post('/', postController.createPost);
router.post('/:id/like', postController.toggleLike);
router.get('/:id/comments', postController.getComments);
router.post('/:id/comments', postController.addComment);
router.post('/:id/save', postController.toggleSave);
router.delete('/:id', postController.deletePost);

module.exports = router;
