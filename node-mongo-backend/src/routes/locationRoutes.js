const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { verifyToken, isAdmin } = require('../middlewares/auth');

// Public
router.get('/', locationController.list.bind(locationController));
router.get('/:id', locationController.get.bind(locationController));

// Admin only
router.post('/', verifyToken, isAdmin, locationController.create.bind(locationController));
router.put('/:id', verifyToken, isAdmin, locationController.update.bind(locationController));
router.delete('/:id', verifyToken, isAdmin, locationController.remove.bind(locationController));

module.exports = router;
