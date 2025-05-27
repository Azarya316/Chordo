const express = require('express');
const router = express.Router();
const multer = require('multer');
const songController = require('../controllers/songController');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('song'), songController.analyzeSong);

module.exports = router;
