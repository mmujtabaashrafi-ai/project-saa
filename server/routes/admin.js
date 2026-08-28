const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllSessions,
  updateUserStatus,
  terminateSession,
  logoutAllSessions,
  getStats,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');

// All admin routes require authentication AND admin role
router.use(authenticate, adminOnly);

router.get('/users', getAllUsers);
router.get('/sessions', getAllSessions);
router.get('/stats', getStats);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/sessions/:id', terminateSession);
router.post('/logout-all', logoutAllSessions);

module.exports = router;
