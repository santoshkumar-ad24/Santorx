module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.user) {
            return next();
        }
        // Save the URL the user is trying to access
        res.cookie('returnTo', req.originalUrl, { httpOnly: true, maxAge: 5 * 60 * 1000 }); // 5 minutes
        
        // The frontend uses a modal, so if it's an API request, return 401
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ error: 'You must be logged in to perform this action' });
        }
        // For regular navigation, redirect to home
        res.redirect('/');
    },
    ensureGuest: function (req, res, next) {
        if (!req.user) {
            return next();
        }
        res.redirect('/');
    }
};
