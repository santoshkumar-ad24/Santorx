
require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const app = express();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

require("./config/passport");

// Trust proxy when running behind a reverse proxy (required for secure cookies)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(passport.initialize());
app.use(cookieParser()); // Moved cookie-parser here to ensure req.cookies is available

// JWT Authentication Middleware
app.use(async (req, res, next) => {
    const token = req.cookies.userToken;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            req.user = user;
            res.locals.user = user;
        } catch (err) {
            console.error("JWT Verification Error:", err);
            req.user = null;
            res.locals.user = null;
        }
    } else {
        req.user = null;
        res.locals.user = null;
    }
    next();
});
// Connect to Database
connectDB();

// Routes
const blogWebRouter = require('./routes/blogWeb.routes');
const createBlogRouter = require('./routes/createBlog.routes');
const cloudinaryRouter = require('./routes/cloudinary.routes');
const adminLog = require('./routes/adminLog.routes');
const userFeaturesRouter = require('./routes/userFeatures.routes');


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
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://www.googletagmanager.com",
                "https://www.clarity.ms",
                "https://scripts.clarity.ms",
                "https://j.clarity.ms",
                "https://k.clarity.ms",
                "https://*.clarity.ms"



            ],

            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],

            imgSrc: [
                "'self'",
                "data:",
                "https:",
                "https://www.google-analytics.com",
                "https://lh3.googleusercontent.com",
                "https://*.googleusercontent.com"
            ],

            connectSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://www.google-analytics.com",
                "https://www.googletagmanager.com",
                "https://analytics.google.com",
                "https://stats.g.doubleclick.net",
                "https://www.google.com",
                "https://accounts.google.com",
                "https://*.googleusercontent.com",
                "https://www.clarity.ms",
                "https://scripts.clarity.ms",
                "https://j.clarity.ms",
                "https://k.clarity.ms",
                "https://*.clarity.ms"

            ]
        }
    },

    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },

    frameguard: { action: 'deny' },
    nosniff: true,
    xssFilter: true
}));


// ============ VIEW ENGINE ============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============ BODY PARSER MIDDLEWARE ============
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ============ STATIC FILES ============
app.use(express.static(path.join(__dirname, 'public')));

// ============ REQUEST LOGGING ============
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============ ROUTES ============
app.use('/', blogWebRouter);
app.use('/', userFeaturesRouter);
app.use('/admin', createBlogRouter);
app.use('/cloud', cloudinaryRouter);
app.use('/admin', adminLog);
app.use("/auth", require("./routes/auth"));

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
