const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  pointsEarned: { type: Number, required: true, min: 0 },
  checkInTime: { type: Date, default: Date.now }
}, { timestamps: true });

// Index to quickly find user's check-ins and prevent duplicate check-ins on same day
checkInSchema.index({ userId: 1, locationId: 1, checkInTime: -1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
