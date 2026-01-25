const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    try {
        // Return cached connection if already connected
        if (cachedConnection) {
            console.log('✓ Using cached MongoDB connection');
            return cachedConnection;
        }

        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set. Please update your .env file.');
        }

        console.log('🔄 Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.DATABASE_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        cachedConnection = conn;
        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`✗ Database Connection Error: ${error.message}`);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
