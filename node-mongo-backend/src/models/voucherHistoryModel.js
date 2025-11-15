const mongoose = require('mongoose');

const voucherHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  code: { type: String },
  pointsUsed: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('VoucherHistory', voucherHistorySchema);
