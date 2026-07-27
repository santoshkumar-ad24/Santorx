const express = require('express');
const router = express.Router();
const GameScore = require('../models/GameScore');
const Blog = require('../models/blog'); // Ensure path is correct, might be 'blog' or 'Blog'

// Submit a new game score
router.post('/game/score', async (req, res) => {
    try {
        const { correctClicks, incorrectClicks, timeTaken, playerName } = req.body;
        
        // Calculate score: (correctClicks * 100) - (incorrectClicks * 20)
        // Ensure score doesn't go below 0
        let calculatedScore = Math.floor((correctClicks * 100) - (incorrectClicks * 20));
        if (calculatedScore < 0) calculatedScore = 0;

        const pName = req.user ? (req.user.name || 'Guest') : (playerName || 'Guest');
        const query = req.user ? { userId: req.user._id } : { playerName: pName, userId: null };

        const existingScore = await GameScore.findOne(query);

        if (existingScore) {
            // Update if score is higher, or if score is same but time is lower
            if (calculatedScore > existingScore.score || (calculatedScore === existingScore.score && timeTaken < existingScore.timeTaken)) {
                existingScore.score = calculatedScore;
                existingScore.timeTaken = timeTaken;
                existingScore.correctClicks = correctClicks;
                existingScore.incorrectClicks = incorrectClicks;
                existingScore.playedAt = Date.now();
                await existingScore.save();
            }
        } else {
            const newScore = new GameScore({
                userId: req.user ? req.user._id : null,
                playerName: pName,
                correctClicks,
                incorrectClicks,
                timeTaken,
                score: calculatedScore
            });
            await newScore.save();
        }

        res.status(200).json({ success: true, score: calculatedScore, message: 'Score saved successfully!' });
    } catch (error) {
        console.error("Error saving game score:", error);
        res.status(500).json({ success: false, message: 'Failed to save score.' });
    }
});

// Fetch leaderboard and featured blogs
router.get('/game/leaderboard', async (req, res) => {
    try {
        // 1. Fetch Top 3 Scores Globally
        const topScores = await GameScore.find()
            .sort({ score: -1, timeTaken: 1 }) // Highest score first, then lowest time
            .limit(3)
            .lean();

        // 2. Fetch Current User's Best Score (if logged in)
        let userBestScore = null;
        if (req.user) {
            userBestScore = await GameScore.findOne({ userId: req.user._id })
                .sort({ score: -1, timeTaken: 1 })
                .lean();
        }

        // 3. Fetch 3 Featured Blogs: 1 Recent, 1 Most Liked, 1 Random
        
        // Recent
        const recentBlog = await Blog.findOne().sort({ Date: -1 }).lean();
        
        // Most Liked (using aggregation to sort by array size)
        const mostLikedBlogs = await Blog.aggregate([
            { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
            { $sort: { likesCount: -1 } },
            { $limit: 1 }
        ]);
        const mostLikedBlog = mostLikedBlogs.length > 0 ? mostLikedBlogs[0] : null;

        // Random
        const randomBlogs = await Blog.aggregate([{ $sample: { size: 1 } }]);
        const randomBlog = randomBlogs.length > 0 ? randomBlogs[0] : null;

        // Compile unique blogs to send back (avoid duplicates if recent == most liked)
        let featuredBlogs = [];
        const seenIds = new Set();
        
        if (randomBlog) {
            featuredBlogs.push({ type: 'Surprise Me', ...randomBlog });
            seenIds.add(randomBlog._id.toString());
        }
        
        if (mostLikedBlog && !seenIds.has(mostLikedBlog._id.toString())) {
            featuredBlogs.push({ type: 'Most Liked', ...mostLikedBlog });
            seenIds.add(mostLikedBlog._id.toString());
        }
        
        if (recentBlog && !seenIds.has(recentBlog._id.toString())) {
            featuredBlogs.push({ type: 'Most Recent', ...recentBlog });
            seenIds.add(recentBlog._id.toString());
        }

        res.status(200).json({
            success: true,
            leaderboard: topScores,
            userBestScore,
            featuredBlogs: featuredBlogs.slice(0, 3) // ensure max 3
        });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
    }
});

module.exports = router;
