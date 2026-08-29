'use strict';

const express = require('express');
const router = express.Router();
const { upload, uploadMedia } = require('../controllers/mediaController');
const { authenticate } = require('../middleware/auth');

router.post('/upload', authenticate, upload.single('file'), uploadMedia);

module.exports = router;
