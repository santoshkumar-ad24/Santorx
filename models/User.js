const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: String,

    email: {
        type: String,
        unique: true
    },

    googleId: String,

    profileImage: String,

    provider: {
        type: String,
        default: "google"
    },

    joinedAt: {
        type: Date,
        default: Date.now
    },

    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog"
    }],

    history: [{
        blog: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Blog"
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }]

});

module.exports = mongoose.model("User", userSchema);