const crypto = require('crypto');
const Subscriber = require('../models/subscriberModel');
const { sendSubscriptionEmail } = require('../utils/email');

// POST /api/subscribe
async function subscribe(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const normalized = String(email).toLowerCase().trim();

        let subscriber = await Subscriber.findOne({ email: normalized });

        const token = crypto.randomBytes(20).toString('hex');
        const tokenExpires = Date.now() + (60 * 60 * 1000); // 1 hour

        if (!subscriber) {
            subscriber = new Subscriber({ email: normalized, token, tokenExpires });
        } else {
            subscriber.token = token;
            subscriber.tokenExpires = tokenExpires;
            subscriber.confirmed = false; // require reconfirmation
        }

        await subscriber.save();

        const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
        const confirmURL = `${BACKEND_URL.replace(/\/$/, '')}/api/subscribe/confirm/${token}`;

        // send confirmation email (may throw)
        try {
            await sendSubscriptionEmail(normalized, confirmURL);
        } catch (emailErr) {
            console.error('Failed to send subscription email', emailErr);
            // still return success so user doesn't get duplicate messages about server email issues
            return res.status(200).json({ message: 'Đã lưu địa chỉ email. Tuy nhiên gửi email xác nhận thất bại.' });
        }

        return res.status(200).json({ message: 'Vui lòng kiểm tra email để xác nhận đăng ký.' });
    } catch (err) {
        console.error('subscribe error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// GET /api/subscribe/confirm/:token
async function confirmSubscription(req, res) {
    try {
        const { token } = req.params;
        if (!token) return res.status(400).send('Invalid token');

        const subscriber = await Subscriber.findOne({ token, tokenExpires: { $gt: Date.now() } });
        if (!subscriber) return res.status(400).send('Token invalid or expired');

        subscriber.confirmed = true;
        subscriber.token = undefined;
        subscriber.tokenExpires = undefined;
        await subscriber.save();

        const FRONTEND_URL = process.env.FRONTEND_URL || process.env.REACT_APP_FRONTEND_URL || `http://localhost:3000`;
        return res.redirect(`${FRONTEND_URL.replace(/\/$/, '')}/?subscribed=1`);
    } catch (err) {
        console.error('confirmSubscription error', err);
        return res.status(500).send('Internal server error');
    }
}

// GET /api/subscribe (admin) -> list subscribers
async function listSubscribers(req, res) {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '50', 10);
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.email) filter.email = new RegExp(req.query.email, 'i');

        const total = await Subscriber.countDocuments(filter);
        const items = await Subscriber.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

        return res.json({ items, total, page, limit });
    } catch (err) {
        console.error('listSubscribers error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// DELETE /api/subscribe/:id (admin)
async function deleteSubscriber(req, res) {
    try {
        const { id } = req.params;
        await Subscriber.findByIdAndDelete(id);
        return res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('deleteSubscriber error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    subscribe,
    confirmSubscription,
    listSubscribers,
    deleteSubscriber,
};
