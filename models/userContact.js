const mongoose = require("mongoose");

const userConatctSchema =new mongoose.Schema({
    name: String,
    email: String,
    inquiry: String,
    message: String,
    Date : {
        type: Date,
        default: Date.now
    }
});

const userConatct = mongoose.model("userContact", userConatctSchema);
module.exports = userConatct;