const mongoose = require('mongoose');

const collectionItemSchema = new mongoose.Schema({
  pinType: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  points: { type: Number, default: 0 }
}, { _id: false });

const collectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [collectionItemSchema], default: [] },
  totalPoints: { type: Number, default: 0 },
  location: { type: String, default: null },
  method: { type: String, default: 'scan' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Collection', collectionSchema);
