const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// store files in ../uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const name = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// POST /api/uploads - single file upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ url });
});

module.exports = router;
