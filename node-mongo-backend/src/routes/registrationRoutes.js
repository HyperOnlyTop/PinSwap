const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { verifyToken } = require('../middlewares/auth');

// Register for event (authenticated)
router.post('/', verifyToken, registrationController.register);

// Cancel registration by id (authenticated)
router.delete('/:id', verifyToken, registrationController.cancel);

// Cancel by eventId (alternative) - body: { eventId }
router.post('/cancel', verifyToken, registrationController.cancel);

// Get my registrations
router.get('/me', verifyToken, registrationController.myRegistrations);

module.exports = router;
