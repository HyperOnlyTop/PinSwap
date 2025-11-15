const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/PinSwap';
    try {
        console.log('Connecting to MongoDB URI:', uri);
        // Set deprecation-related options for Mongoose 5.x compatibility
        // If you upgrade to Mongoose 6+, these options are no longer needed and will be ignored.
        mongoose.set('useFindAndModify', false);
        mongoose.set('useCreateIndex', true);

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };