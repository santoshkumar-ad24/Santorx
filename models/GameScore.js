const mongoose = require("mongoose");

const gameScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    playerName: {
        type: String,
        required: true,
        default: "Guest"
    },
    correctClicks: {
        type: Number,
        default: 0
    },
    incorrectClicks: {
        type: Number,
        default: 0
    },
    timeTaken: {
        type: Number, // Time taken in seconds
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    playedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("GameScore", gameScoreSchema);
