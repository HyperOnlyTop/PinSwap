const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { verifyToken, isAdmin, isAdminOrBusiness } = require('../middlewares/auth');

// Public listing
router.get('/', eventController.list);

// Specific routes MUST come before /:id to avoid being caught by the wildcard
// User's own registrations
router.get('/my/registrations', verifyToken, eventController.getMyRegistrations);

// User registration routes (require login)
router.post('/:eventId/register', verifyToken, eventController.register);
router.post('/:eventId/cancel', verifyToken, eventController.cancelRegistration);
router.get('/:eventId/check-registration', verifyToken, eventController.checkRegistration);

// Admin/Business view registrations (restricted)
router.get('/:eventId/registrations', verifyToken, isAdminOrBusiness, eventController.getRegistrations);

// Admin create/update/delete
router.post('/', verifyToken, isAdmin, eventController.create);
router.put('/:id', verifyToken, isAdmin, eventController.update);
router.delete('/:id', verifyToken, isAdmin, eventController.remove);

// Get single event - MUST be last among GET routes to avoid catching specific routes
router.get('/:id', eventController.get);

module.exports = router;
