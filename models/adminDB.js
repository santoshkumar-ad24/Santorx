const mongoose = require('mongoose');

const adminSchema =new mongoose.Schema({
    adminImage: {
        type: String,
        default: "https://res.cloudinary.com/dn2cdy2ea/image/upload/v1767070412/Profile%20Image.png"
    },
    adminName: String,
    adminUser: String,
    password: String,
    adminBio: String,
    Date : {
        type: Date,
        default: Date.now
    }
});

const admin = mongoose.model("admin", adminSchema);
module.exports = admin;