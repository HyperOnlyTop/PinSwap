const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Public: list and get
router.get('/', newsController.list.bind(newsController));
router.get('/:id', newsController.get.bind(newsController));

// Admin-only create/update/delete
router.post('/', verifyToken, isAdmin, newsController.create.bind(newsController));
router.put('/:id', verifyToken, isAdmin, newsController.update.bind(newsController));
router.delete('/:id', verifyToken, isAdmin, newsController.remove.bind(newsController));

module.exports = router;
