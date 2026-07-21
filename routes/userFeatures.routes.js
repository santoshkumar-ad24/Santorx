const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Blog = require('../models/blog');

// Bookmarks page
router.get('/bookmarks', async (req, res) => {
    try {
        if (!req.user) {
            return res.render('bookmark', { user: null, bookmarks: [], loggedIn: false });
        }

        const user = await User.findById(req.user._id).populate({ path: 'bookmarks', options: { sort: { Date: -1 } } }).lean();
        const bookmarks = user && user.bookmarks ? user.bookmarks : [];
        return res.render('bookmark', { user: req.user, bookmarks, loggedIn: true });
    } catch (err) {
        console.error('Bookmarks error', err);
        return res.status(500).render('bookmark', { user: req.user || null, bookmarks: [], loggedIn: !!req.user });
    }
});

// History page
router.get('/history', async (req, res) => {
    try {
        if (!req.user) {
            return res.render('history', { user: null, history: [], loggedIn: false });
        }

        const user = await User.findById(req.user._id).populate({ path: 'history.blog' }).lean();
        let history = [];
        if (user && Array.isArray(user.history)) {
            history = user.history
                .map(h => ({ ...h.blog, viewedAt: h.viewedAt }))
                .filter(item => item && item._id)
                .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
        }

        return res.render('history', { user: req.user, history, loggedIn: true });
    } catch (err) {
        console.error('History error', err);
        return res.status(500).render('history', { user: req.user || null, history: [], loggedIn: !!req.user });
    }
});

// Toggle bookmark for a blog (add/remove)
router.post('/bookmarks/toggle/:slug', async (req, res) => {
    try {
        if (!req.user) return res.redirect('/auth/google');
        const slug = req.params.slug;
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.redirect('back');

        const userId = req.user._id;
        const exists = await User.findOne({ _id: userId, bookmarks: blog._id });
        if (exists) {
            await User.updateOne({ _id: userId }, { $pull: { bookmarks: blog._id } });
        } else {
            await User.updateOne({ _id: userId }, { $push: { bookmarks: blog._id } });
        }

        const referer = req.get('Referrer') || `/blog/${slug}`;
        return res.redirect(referer);
    } catch (err) {
        console.error('Bookmark toggle error', err);
        return res.redirect('back');
    }
});

module.exports = router;
