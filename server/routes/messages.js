const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markAsRead } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.patch('/:id/read', markAsRead);

module.exports = router;
