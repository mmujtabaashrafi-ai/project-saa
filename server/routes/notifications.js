'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', (req, res, next) => {
  req.params.id = 'all';
  notificationController.markAsRead(req, res, next);
});
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/', notificationController.clearNotifications);

module.exports = router;
