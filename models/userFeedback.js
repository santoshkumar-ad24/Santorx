const mongoose = require('mongoose');

const feedbackSchema =new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    message: String,
    Date : {
        type: Date,
        default: Date.now
    }
});

const feedback = mongoose.model("feedback", feedbackSchema);
module.exports = feedback;