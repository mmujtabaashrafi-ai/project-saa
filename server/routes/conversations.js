const express = require('express');
const router = express.Router();
const {
  getConversations,
  createOrGetConversation,
  getConversationById,
} = require('../controllers/conversationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getConversations);
router.post('/', createOrGetConversation);
router.get('/:id', getConversationById);

module.exports = router;
