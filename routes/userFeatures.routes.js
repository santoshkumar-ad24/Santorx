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

// Clear specific history item
router.delete('/history/:blogId', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const mongoose = require('mongoose');
        await User.updateOne(
            { _id: req.user._id },
            { $pull: { history: { blog: new mongoose.Types.ObjectId(req.params.blogId) } } }
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('Delete history item error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Clear all history
router.delete('/history', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

        await User.updateOne(
            { _id: req.user._id },
            { $set: { history: [] } }
        );
        return res.json({ success: true });
    } catch (err) {
        console.error('Clear history error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
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

        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.json({ success: true, bookmarked: !exists });
        }

        const referer = req.get('Referrer') || `/blog/${slug}`;
        return res.redirect(referer);
    } catch (err) {
        console.error('Bookmark toggle error', err);
        return res.redirect('back');
    }
});

// Toggle like for a blog (add/remove)
router.post('/blogs/:slug/like', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const { slug } = req.params;
        const userId = req.user._id;

        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        // Check if user already liked
        const likeIndex = blog.likes.findIndex(like => like.userId.toString() === userId.toString());

        if (likeIndex > -1) {
            // Remove like
            blog.likes.splice(likeIndex, 1);
            await blog.save();
            return res.json({ success: true, liked: false, likeCount: blog.likes.length });
        } else {
            // Remove dislike if exists
            const dislikeIndex = blog.dislikes.findIndex(dislike => dislike.userId.toString() === userId.toString());
            if (dislikeIndex > -1) {
                blog.dislikes.splice(dislikeIndex, 1);
            }

            // Add like
            blog.likes.push({ userId });
            await blog.save();
            return res.json({ success: true, liked: true, likeCount: blog.likes.length, dislikeCount: blog.dislikes.length });
        }
    } catch (err) {
        console.error('Like toggle error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Toggle dislike for a blog (add/remove)
router.post('/blogs/:slug/dislike', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const { slug } = req.params;
        const userId = req.user._id;

        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        // Check if user already disliked
        const dislikeIndex = blog.dislikes.findIndex(dislike => dislike.userId.toString() === userId.toString());

        if (dislikeIndex > -1) {
            // Remove dislike
            blog.dislikes.splice(dislikeIndex, 1);
            await blog.save();
            return res.json({ success: true, disliked: false, dislikeCount: blog.dislikes.length });
        } else {
            // Remove like if exists
            const likeIndex = blog.likes.findIndex(like => like.userId.toString() === userId.toString());
            if (likeIndex > -1) {
                blog.likes.splice(likeIndex, 1);
            }

            // Add dislike
            blog.dislikes.push({ userId });
            await blog.save();
            return res.json({ success: true, disliked: true, dislikeCount: blog.dislikes.length, likeCount: blog.likes.length });
        }
    } catch (err) {
        console.error('Dislike toggle error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add comment to a blog
router.post('/blogs/:slug/comment', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const { slug } = req.params;
        const { comment } = req.body;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
        }

        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        const newComment = {
            userId: req.user._id,
            comment: comment.trim(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        blog.comments.push(newComment);
        await blog.save();

        // We need to return the populated comment so the frontend can display the author's name
        const commentToReturn = {
            ...newComment,
            _id: blog.comments[blog.comments.length - 1]._id,
            userId: {
                _id: req.user._id,
                name: req.user.name,
                profileImage: req.user.profileImage
            }
        };

        return res.json({ success: true, comment: commentToReturn, commentCount: blog.comments.length });
    } catch (err) {
        console.error('Comment add error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete comment from a blog
router.delete('/blogs/:slug/comment/:commentId', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });

        const { slug, commentId } = req.params;

        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        // Check if user is the comment owner
        if (comment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        blog.comments.id(commentId).deleteOne();
        await blog.save();

        return res.json({ success: true, commentCount: blog.comments.length });
    } catch (err) {
        console.error('Comment delete error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Toggle like for a comment
router.post('/blogs/:slug/comment/:commentId/like', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const { slug, commentId } = req.params;
        const userId = req.user._id;
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        
        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        
        const likeIndex = comment.likes.findIndex(like => like.userId.toString() === userId.toString());
        if (likeIndex > -1) {
            comment.likes.splice(likeIndex, 1);
            await blog.save();
            return res.json({ success: true, liked: false, likeCount: comment.likes.length });
        } else {
            const dislikeIndex = comment.dislikes.findIndex(dislike => dislike.userId.toString() === userId.toString());
            if (dislikeIndex > -1) comment.dislikes.splice(dislikeIndex, 1);
            comment.likes.push({ userId });
            await blog.save();
            return res.json({ success: true, liked: true, likeCount: comment.likes.length, dislikeCount: comment.dislikes.length });
        }
    } catch (err) {
        console.error('Comment like error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Toggle dislike for a comment
router.post('/blogs/:slug/comment/:commentId/dislike', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const { slug, commentId } = req.params;
        const userId = req.user._id;
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        
        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        
        const dislikeIndex = comment.dislikes.findIndex(dislike => dislike.userId.toString() === userId.toString());
        if (dislikeIndex > -1) {
            comment.dislikes.splice(dislikeIndex, 1);
            await blog.save();
            return res.json({ success: true, disliked: false, dislikeCount: comment.dislikes.length });
        } else {
            const likeIndex = comment.likes.findIndex(like => like.userId.toString() === userId.toString());
            if (likeIndex > -1) comment.likes.splice(likeIndex, 1);
            comment.dislikes.push({ userId });
            await blog.save();
            return res.json({ success: true, disliked: true, dislikeCount: comment.dislikes.length, likeCount: comment.likes.length });
        }
    } catch (err) {
        console.error('Comment dislike error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add reply to a comment
router.post('/blogs/:slug/comment/:commentId/reply', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const { slug, commentId } = req.params;
        const { reply, replyingTo } = req.body;
        if (!reply || reply.trim().length === 0) return res.status(400).json({ success: false, message: 'Reply cannot be empty' });
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        
        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        
        const newReply = {
            userId: req.user._id,
            reply: reply.trim(),
            replyingTo: replyingTo || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        comment.replies.push(newReply);
        await blog.save();
        
        const replyToReturn = {
            ...newReply,
            _id: comment.replies[comment.replies.length - 1]._id,
            userId: {
                _id: req.user._id,
                name: req.user.name,
                profileImage: req.user.profileImage
            }
        };
        
        return res.json({ success: true, reply: replyToReturn });
    } catch (err) {
        console.error('Reply add error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete a reply
router.delete('/blogs/:slug/comment/:commentId/reply/:replyId', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const { slug, commentId, replyId } = req.params;
        
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        
        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        
        const reply = comment.replies.id(replyId);
        if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
        
        if (reply.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        comment.replies.id(replyId).deleteOne();
        await blog.save();
        
        return res.json({ success: true });
    } catch (err) {
        console.error('Reply delete error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Toggle like for a reply
router.post('/blogs/:slug/comment/:commentId/reply/:replyId/like', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const { slug, commentId, replyId } = req.params;
        const userId = req.user._id;
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        
        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        
        const reply = comment.replies.id(replyId);
        if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
        
        const likeIndex = reply.likes.findIndex(like => like.userId.toString() === userId.toString());
        if (likeIndex > -1) {
            reply.likes.splice(likeIndex, 1);
            await blog.save();
            return res.json({ success: true, liked: false, likeCount: reply.likes.length });
        } else {
            const dislikeIndex = reply.dislikes.findIndex(dislike => dislike.userId.toString() === userId.toString());
            if (dislikeIndex > -1) reply.dislikes.splice(dislikeIndex, 1);
            reply.likes.push({ userId });
            await blog.save();
            return res.json({ success: true, liked: true, likeCount: reply.likes.length, dislikeCount: reply.dislikes.length });
        }
    } catch (err) {
        console.error('Reply like error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Toggle dislike for a reply
router.post('/blogs/:slug/comment/:commentId/reply/:replyId/dislike', async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'User not authenticated' });
        const { slug, commentId, replyId } = req.params;
        const userId = req.user._id;
        const blog = await Blog.findOne({ slug });
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
        
        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
        
        const reply = comment.replies.id(replyId);
        if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
        
        const dislikeIndex = reply.dislikes.findIndex(dislike => dislike.userId.toString() === userId.toString());
        if (dislikeIndex > -1) {
            reply.dislikes.splice(dislikeIndex, 1);
            await blog.save();
            return res.json({ success: true, disliked: false, dislikeCount: reply.dislikes.length });
        } else {
            const likeIndex = reply.likes.findIndex(like => like.userId.toString() === userId.toString());
            if (likeIndex > -1) reply.likes.splice(likeIndex, 1);
            reply.dislikes.push({ userId });
            await blog.save();
            return res.json({ success: true, disliked: true, dislikeCount: reply.dislikes.length, likeCount: reply.likes.length });
        }
    } catch (err) {
        console.error('Reply dislike error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get blog interactions (likes, dislikes, comments count)
router.get('/blogs/:slug/interactions', async (req, res) => {
    try {
        const { slug } = req.params;
        const blog = await Blog.findOne({ slug })
            .select('likes dislikes comments')
            .populate('comments.userId', 'name profileImage')
            .populate('comments.replies.userId', 'name profileImage');

        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        let userLiked = false;
        let userDisliked = false;
        let currentUserId = null;

        if (req.user) {
            currentUserId = req.user._id;
            userLiked = blog.likes.some(like => like.userId.toString() === req.user._id.toString());
            userDisliked = blog.dislikes.some(dislike => dislike.userId.toString() === req.user._id.toString());
        }

        // Sort comments by date (oldest first), but current user's comments first
        const sortedComments = blog.comments.sort((a, b) => {
            if (currentUserId) {
                const aIsUser = a.userId && a.userId._id.toString() === currentUserId.toString();
                const bIsUser = b.userId && b.userId._id.toString() === currentUserId.toString();
                if (aIsUser && !bIsUser) return -1;
                if (!aIsUser && bIsUser) return 1;
                // If both are the user's comments, sort newest first
                if (aIsUser && bIsUser) {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        // Also sort replies within each comment
        sortedComments.forEach(comment => {
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.sort((a, b) => {
                    if (currentUserId) {
                        const aIsUser = a.userId && a.userId._id.toString() === currentUserId.toString();
                        const bIsUser = b.userId && b.userId._id.toString() === currentUserId.toString();
                        
                        if (aIsUser && !bIsUser) return -1;
                        if (!aIsUser && bIsUser) return 1;
                        // If both are the user's replies, sort newest first
                        if (aIsUser && bIsUser) {
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        }
                    }
                    return new Date(a.createdAt) - new Date(b.createdAt);
                });
            }
        });

        return res.json({
            success: true,
            likeCount: blog.likes.length,
            dislikeCount: blog.dislikes.length,
            commentCount: blog.comments.length,
            userLiked,
            userDisliked,
            comments: sortedComments,
            currentUserId
        });
    } catch (err) {
        console.error('Get interactions error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
