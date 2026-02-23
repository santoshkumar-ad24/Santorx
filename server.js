
require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const compression = require("compression");
const app = express();

// Connect to Database
connectDB();

// Routes
const blogWebRouter = require('./routes/blogWeb.routes');
const createBlogRouter = require('./routes/createBlog.routes');
const cloudinaryRouter = require('./routes/cloudinary.routes');
const adminLog = require('./routes/adminLog.routes');
const seoRouter = require('./routes/seo.routes');

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============ SECURITY MIDDLEWARE ============
// Enable Helmet for security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
          "'self'",
          "https://cdn.jsdelivr.net"   // allow Quill JS from jsDelivr
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net" ,
           "https://cdnjs.cloudflare.com" // allow Quill CSS from jsDelivr
        ],


            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net"   // allow source map requests
        ]

        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    frameguard: { action: 'deny' },
    nosniff: true,
    xssFilter: true,
}));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(compression());
// ============ VIEW ENGINE ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============ BODY PARSER MIDDLEWARE ============
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ============ STATIC FILES ============
app.use(express.static(path.join(__dirname, 'public')));

// ============ COOKIE PARSER ============
app.use(cookieParser());

// ============ REQUEST LOGGING ============
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============ ROUTES ============
app.use('/', seoRouter);
app.use('/', blogWebRouter);
app.use('/admin', createBlogRouter);
app.use('/cloud', cloudinaryRouter);
app.use('/admin', adminLog);

// ============ HEALTH CHECK ENDPOINT ============
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});


// ============ 404 HANDLER ============
app.use((req, res) => {
    // Check if the request accepts HTML
    if (req.accepts('html')) {
        res.status(404).render('404', {
            statusCode: 404,
            errorTitle: 'Page Not Found',
            errorMessage: `The page "${req.path}" doesn't exist. It might have been moved or deleted.`
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Route not found',
            path: req.path
        });
    }
});

// ============ ERROR HANDLING MIDDLEWARE ============
app.use(errorHandler);

// ============ SERVER START ============
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║       🚀 Blog Web Server Started       ║
╠════════════════════════════════════════╣
║ URL: http://localhost:${PORT}
║ Environment: ${NODE_ENV}
║ Status: Running ✓
╚════════════════════════════════════════╝
    `);
});

// ============ GRACEFUL SHUTDOWN ============
process.on('SIGTERM', () => {
    console.log('\n[SIGTERM] Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown...');
        process.exit(1);
    }, 10000);
});

process.on('SIGINT', () => {
    console.log('\n[SIGINT] Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// ============ UNHANDLED REJECTION ============
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[Unhandled Rejection] ${reason}`);
    // In production, log this to monitoring service
});

// ============ UNCAUGHT EXCEPTION ============
process.on('uncaughtException', (error) => {
    console.error(`[Uncaught Exception] ${error.message}`);
    process.exit(1);
});
