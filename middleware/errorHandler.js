// Central error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const isHtmlRequest = req.accepts('html');

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
        
        if (isHtmlRequest) {
            return res.status(400).render('404', {
                statusCode: 400,
                errorTitle: 'Validation Error',
                errorMessage: errorMessage
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        if (isHtmlRequest) {
            return res.status(400).render('404', {
                statusCode: 400,
                errorTitle: 'Invalid Request',
                errorMessage: 'Invalid ID format'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        if (isHtmlRequest) {
            return res.status(401).render('404', {
                statusCode: 401,
                errorTitle: 'Authentication Failed',
                errorMessage: 'Invalid token'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        if (isHtmlRequest) {
            return res.status(401).render('404', {
                statusCode: 401,
                errorTitle: 'Session Expired',
                errorMessage: 'Your session has expired. Please login again.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Generic error response
    if (isHtmlRequest) {
        return res.status(statusCode).render('404', {
            statusCode: statusCode,
            errorTitle: statusCode === 500 ? 'Server Error' : 'Error',
            errorMessage: err.message || 'Something went wrong. Please try again.'
        });
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
