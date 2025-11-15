const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const ROLES = ['admin', 'citizen', 'business'];
const STATUSES = ['active', 'looked']; 
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: null,
        required: false,
        trim: true,
    },
    address: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ROLES,
        default: 'citizen',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: STATUSES,
        default: 'active',
    },
    points: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Password reset token (hashed) and expiration
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
});

// index to speed up lookup by reset token
userSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 });

// Hash password trước khi lưu (chỉ khi thay đổi/khởi tạo password)
userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();
        const saltRounds = 10;
        const hash = await bcrypt.hash(this.password, saltRounds);
        this.password = hash;
        return next();
    } catch (err) {
        return next(err);
    }
});

// Instance method để so sánh mật khẩu
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create a password reset token, store hashed version and expiry on user document
userSchema.methods.createPasswordResetToken = function () {
    // generate token (plain) and also store hashed version
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // token valid for 1 hour
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    return resetToken;
};

// Ẩn password và __v khi trả JSON
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});
const User = mongoose.model('User', userSchema);

module.exports = User;