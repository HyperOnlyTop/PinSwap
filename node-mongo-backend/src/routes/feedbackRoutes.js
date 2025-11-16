const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Public: create feedback
router.post('/', feedbackController.create.bind(feedbackController));

// Current user's feedback history
router.get('/me', verifyToken, feedbackController.listByUser.bind(feedbackController));

// Admin only: list, get, delete
router.get('/', verifyToken, isAdmin, feedbackController.list.bind(feedbackController));
router.get('/:id', verifyToken, isAdmin, feedbackController.get.bind(feedbackController));
router.put('/:id', verifyToken, isAdmin, feedbackController.update.bind(feedbackController));
router.delete('/:id', verifyToken, isAdmin, feedbackController.remove.bind(feedbackController));

module.exports = router;
