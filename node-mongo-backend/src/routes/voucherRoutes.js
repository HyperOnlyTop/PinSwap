const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { verifyToken, isAdminOrBusiness } = require('../middlewares/auth');

// Public routes
router.get('/', voucherController.list.bind(voucherController));
router.get('/:id', voucherController.get.bind(voucherController));

// User routes
router.post('/exchange', verifyToken, voucherController.exchange.bind(voucherController));
router.get('/history/me', verifyToken, voucherController.history.bind(voucherController));

// Admin/Business routes - create, update, delete vouchers
router.post('/create', verifyToken, isAdminOrBusiness, voucherController.create.bind(voucherController));
router.put('/:id', verifyToken, isAdminOrBusiness, voucherController.update.bind(voucherController));
router.delete('/:id', verifyToken, isAdminOrBusiness, voucherController.delete.bind(voucherController));
router.get('/business/:businessId', verifyToken, isAdminOrBusiness, voucherController.getByBusiness.bind(voucherController));

module.exports = router;
