const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
    },
    taxCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// index on taxCode for uniqueness and lookup
businessSchema.index({ taxCode: 1 }, { unique: true });

// clean JSON output
businessSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.__v;
        return ret;
    }
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
