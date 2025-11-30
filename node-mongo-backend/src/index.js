
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const locationRoutes = require('./routes/locationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const subscribeRoutes = require('./routes/subscribeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const scanRoutes = require('./routes/scanRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const { connectDB } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors()); 
app.use(express.json());

// Redirect GET /reset-password on backend to frontend reset page (useful when email links accidentally point to backend)
app.get('/reset-password', (req, res) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || process.env.REACT_APP_FRONTEND_URL || `http://localhost:3000`;
    const token = req.query.token;
    const target = token ? `${FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}` : FRONTEND_URL;
    return res.redirect(target);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vouchers', voucherRoutes);

// serve uploads folder and upload endpoint
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/uploads', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);


(async () => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Either stop the process using this port or set PORT in .env to a free port (e.g. 5001).`);
                process.exit(1);
            }
            console.error('Server error', err);
        });

        const shutdown = async () => {
            console.log('Shutting down...');
            await mongoose.disconnect();
            server.close(() => process.exit(0));
        };
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})();
