const express = require('express');
const router = express.Router();
const { chat, getHistory, deleteHistory } = require('../controllers/reactBoatController');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/chat', aiLimiter, chat);
router.get('/history', getHistory);
router.delete('/history', deleteHistory);

module.exports = router;
