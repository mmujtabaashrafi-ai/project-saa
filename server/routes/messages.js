const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  markAsRead,
} = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.post('/:id/react', reactToMessage);
router.patch('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.patch('/:id/read', markAsRead);

module.exports = router;

