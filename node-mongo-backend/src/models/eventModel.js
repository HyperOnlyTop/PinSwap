const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    location: { type: String, default: '' },
    date: { type: Date, required: true },
    sponsor: { type: String, default: '' },
    images: { type: [String], default: [] },
    thumbnail: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
