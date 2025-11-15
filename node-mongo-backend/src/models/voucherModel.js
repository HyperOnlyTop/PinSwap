const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: false },
  title: { type: String, required: true },
  description: { type: String },
  expiry: { type: Date },
  images: [{ type: String }],
  quantity: { type: Number, default: 0 },
  pointsRequired: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
