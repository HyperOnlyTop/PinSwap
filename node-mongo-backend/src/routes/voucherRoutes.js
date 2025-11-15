const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', voucherController.list.bind(voucherController));
router.get('/:id', voucherController.get.bind(voucherController));
router.post('/exchange', verifyToken, voucherController.exchange.bind(voucherController));
router.get('/history/me', verifyToken, voucherController.history.bind(voucherController));

module.exports = router;
