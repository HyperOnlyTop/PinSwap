const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetEmail } = require('../utils/email');
const User = require('../models/userModel');
const Business = require('../models/businessModel');

const generateToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

exports.register = async (req, res) => {
    try {
        console.log('authController.register body:', req.body);
        const { name, email, password, phone, address, role, companyName, taxCode, contactName } = req.body;

        // basic required checks
        if (!email || !password) return res.status(400).json({ message: 'Missing required fields: email or password' });

        // for business accounts, accept contactName in place of name
        if (role === 'business') {
            if (!companyName || !taxCode) return res.status(400).json({ message: 'Missing companyName or taxCode for business registration' });
            if (!name && !contactName) return res.status(400).json({ message: 'Missing contact name for business registration' });
        } else {
            if (!name) return res.status(400).json({ message: 'Missing name' });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already in use' });

        // If registering a business, expect additional fields in body (companyName, taxCode, contactName)
        if (role === 'business') {
            const { companyName, taxCode, contactName } = req.body;
            if (!companyName || !taxCode) {
                return res.status(400).json({ message: 'Missing companyName or taxCode for business registration' });
            }

            // create user with role business
            const user = new User({ name: contactName || name, email, password, phone, address, role });
            await user.save();

            // create business record - if business.save fails we should rollback the created user
            try {
                const business = new Business({ userId: user._id, companyName, taxCode });
                await business.save();
                const token = generateToken(user);
                return res.status(201).json({ user: user.toJSON(), business: business.toJSON(), token });
            } catch (bizErr) {
                console.error('business save error', bizErr);
                // remove the created user to avoid orphan user when business creation fails
                try {
                    await User.findByIdAndDelete(user._id);
                } catch (delErr) {
                    console.error('failed to delete user after business save error', delErr);
                }

                if (bizErr.code === 11000) {
                    // duplicate key (e.g., taxCode unique)
                    return res.status(409).json({ message: 'Business taxCode already exists' });
                }
                if (bizErr.name === 'ValidationError') {
                    const details = Object.keys(bizErr.errors).reduce((acc, key) => {
                        acc[key] = bizErr.errors[key].message;
                        return acc;
                    }, {});
                    return res.status(400).json({ message: 'Business validation error', errors: details });
                }
                return res.status(500).json({ message: 'Failed to create business' });
            }
        }

        // normal user/citizen registration
        const user = new User({ name, email, password, phone, address, role });
        await user.save();

        const token = generateToken(user);
        return res.status(201).json({ user: user.toJSON(), token });
    } catch (err) {
        console.error('register error', err);
        // If it's a Mongoose validation error, return details so frontend can show messages
        if (err.name === 'ValidationError') {
            const details = Object.keys(err.errors).reduce((acc, key) => {
                acc[key] = err.errors[key].message;
                return acc;
            }, {});
            return res.status(400).json({ message: 'Validation error', errors: details });
        }
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await user.comparePassword(password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        // If client supplied the expected role, ensure it matches the user's actual role
        if (role) {
            // normalize possible legacy fields
            const userRole = user.role || user.type || 'citizen';
            if (role !== userRole) {
                return res.status(403).json({ message: `Tài khoản không thuộc loại '${role}'` });
            }
        }

        const token = generateToken(user);
        return res.json({ user: user.toJSON(), token });
    } catch (err) {
        console.error('login error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Forgot password - create reset token and (optionally) send email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Missing email' });

        const user = await User.findOne({ email });
        if (!user) {
            // To avoid user enumeration, respond with success message
            return res.status(200).json({ message: 'If an account with that email exists, a reset token has been generated' });
        }

        const resetToken = user.createPasswordResetToken();
        // skip validation when saving only token fields
        await user.save({ validateBeforeSave: false });

    // Prefer linking to the frontend application so the user sees the reset form.
    // You can set FRONTEND_URL in env (e.g., http://localhost:3001). Fall back to the request host for backward compatibility.
    const FRONTEND_URL = process.env.FRONTEND_URL || process.env.REACT_APP_FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetURL = `${FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

        // Try to send email if SMTP is configured. In production we prefer sending email instead of returning the token.
        try {
            await sendResetEmail(user.email, resetURL);
            return res.json({ message: 'Password reset email sent if the address exists' });
        } catch (emailErr) {
            console.error('sendResetEmail failed', emailErr && emailErr.message);
            // If SMTP not configured or sending fails, expose token in non-production for testing convenience
            if (process.env.NODE_ENV !== 'production') {
                return res.json({ message: 'Password reset token created (email send failed)', resetToken, resetURL, emailError: emailErr && emailErr.message });
            }

            return res.status(500).json({ message: 'Failed to send reset email' });
        }
    } catch (err) {
        console.error('forgotPassword error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ message: 'Missing token or newPassword' });

        const hashed = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Token is invalid or has expired' });

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        const newToken = generateToken(user);
        return res.json({ message: 'Password has been reset', token: newToken });
    } catch (err) {
        console.error('resetPassword error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
