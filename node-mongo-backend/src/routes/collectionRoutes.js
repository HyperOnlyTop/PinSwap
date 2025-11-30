const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { verifyToken } = require('../middlewares/auth');

// create collection (authenticated users)
router.post('/', verifyToken, (req, res) => collectionController.create(req, res));

// list current user's collections
router.get('/', verifyToken, (req, res) => collectionController.list(req, res));

module.exports = router;
