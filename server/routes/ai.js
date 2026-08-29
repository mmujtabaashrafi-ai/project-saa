'use strict';

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const { aiLimiter } = require('../middleware/rateLimiter');

// All AI routes require authentication
router.use(authenticate);

// Chat & Assistant
router.post('/chat', aiLimiter, aiController.chat);

// Multi-conversation sessions
router.get('/conversations', aiController.getConversations);
router.post('/conversations', aiController.createConversation);
router.get('/conversations/:id/messages', aiController.getMessages);
router.patch('/conversations/:id', aiController.updateConversation);
router.delete('/conversations/:id', aiController.deleteConversation);

// AI Memory
router.get('/memory', aiController.getMemories);
router.delete('/memory', aiController.clearMemory);

// Knowledge Base (Read open to authenticated users, mutations restricted to Admin)
router.get('/knowledge', aiController.getKnowledge);
router.post('/knowledge', adminOnly, aiController.createKnowledge);
router.put('/knowledge/:id', adminOnly, aiController.updateKnowledge);
router.delete('/knowledge/:id', adminOnly, aiController.deleteKnowledge);

module.exports = router;
