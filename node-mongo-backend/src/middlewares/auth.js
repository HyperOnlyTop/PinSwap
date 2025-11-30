const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        if (!authHeader) {
            return res.status(403).json({ message: 'No token provided!' });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

        // Use same fallback secret as token generation to avoid mismatches when JWT_SECRET isn't set in env
        const SECRET = process.env.JWT_SECRET || 'secret';

        jwt.verify(token, SECRET, (err, decoded) => {
            if (err) {
                console.error('JWT verification failed:', err && err.message);
                return res.status(401).json({ message: 'Unauthorized!' });
            }
            req.userId = decoded.id || decoded.sub;
            next();
        });
    } catch (err) {
        console.error('verifyToken error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return next();
        return res.status(403).json({ message: 'Require Admin Role!' });
    } catch (err) {
        console.error('isAdmin error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const isAdminOrBusiness = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin' || user.role === 'business') return next();
        return res.status(403).json({ message: 'Require Admin or Business Role!' });
    } catch (err) {
        console.error('isAdminOrBusiness error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isAdminOrBusiness,
};