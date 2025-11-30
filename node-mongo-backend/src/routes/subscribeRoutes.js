const express = require('express');
const router = express.Router();
const subscribeController = require('../controllers/subscribeController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Public: subscribe
router.post('/', subscribeController.subscribe);

// Confirmation link (GET) - will redirect to frontend on success
router.get('/confirm/:token', subscribeController.confirmSubscription);

// Admin: list and delete
router.get('/', verifyToken, isAdmin, subscribeController.listSubscribers);
router.delete('/:id', verifyToken, isAdmin, subscribeController.deleteSubscriber);

module.exports = router;
