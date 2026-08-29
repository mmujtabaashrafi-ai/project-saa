'use strict';

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Media = require('../models/Media');

// Ensure uploads folder exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Disk Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueSuffix}${ext}`);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { filename, originalname, mimetype, size } = req.file;
    let mediaType = 'other';

    if (mimetype.startsWith('image/')) mediaType = 'image';
    else if (mimetype.startsWith('video/')) mediaType = 'video';
    else if (mimetype.startsWith('audio/')) mediaType = 'audio';
    else if (mimetype === 'application/pdf') mediaType = 'document';

    const fileUrl = `/uploads/${filename}`;

    const mediaDoc = await Media.create({
      uploader: req.user._id,
      originalName: originalname,
      fileName: filename,
      mimeType: mimetype,
      mediaType,
      size,
      url: fileUrl,
    });

    res.status(201).json({
      success: true,
      media: {
        _id: mediaDoc._id,
        url: fileUrl,
        mediaType,
        mimeType: mimetype,
        originalName: originalname,
        size,
      },
    });
  } catch (err) {
    console.error('[MediaController upload]', err);
    res.status(500).json({ success: false, message: err.message || 'File upload failed' });
  }
};

module.exports = {
  upload,
  uploadMedia,
};
