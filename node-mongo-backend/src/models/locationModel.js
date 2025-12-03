const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: false },
  name: { type: String, required: true, trim: true },
  address: { type: String, default: null },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  openHours: { type: String, default: null },
  type: { type: String, enum: ['supermarket', 'school', 'business', 'park', 'healthcare', 'other'], default: 'other' },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' },
  qrCode: { type: String, unique: true, sparse: true }, // Unique QR code for check-in
  pointsReward: { type: Number, default: 50, min: 0 } // Points awarded for check-in
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

// index for geo queries (if needed later)
locationSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Location', locationSchema);
