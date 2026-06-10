const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const songController = require('../controllers/songController');

const ALLOWED = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.webm'];

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 Mo
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED.includes(ext)) return cb(null, true);
    cb(new Error(`Format non supporté (${ext}). Utilisez: ${ALLOWED.join(', ')}`));
  },
});

router.post(
  '/upload',
  (req, res, next) => {
    upload.single('song')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  songController.analyzeSong
);

router.get('/chords', songController.getChords);

module.exports = router;
