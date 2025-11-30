const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: false },
  title: { type: String, required: true },
  description: { type: String },
  discount: { type: Number, min: 0, max: 100 }, // percentage discount
  expiry: { type: Date },
  images: [{ type: String }],
  quantity: { type: Number, default: 0 },
  pointsRequired: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
