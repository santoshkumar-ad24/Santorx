require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Validate required Cloudinary environment variables
const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.warn(`⚠️  Missing Cloudinary environment variables: ${missingVars.join(', ')}`);
    console.warn('Please update your .env file with Cloudinary credentials');
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

console.log('✓ Cloudinary configured successfully');

module.exports = cloudinary;
