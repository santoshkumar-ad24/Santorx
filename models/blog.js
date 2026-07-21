const mongoose = require("mongoose");


const blogSchema = new mongoose.Schema({
  title: String,
  slug: String,
  category: String,
  featured: {
    type: Boolean,
    default: false
  },
  metaKeyword: String,
  metaDescription: String,
  imageUrl: String,
  content: String,
  Date: {
    type: Date,
    default: Date.now
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",   // <-- reference to admindb model
    required: true
  }

});

module.exports = mongoose.model("Blog", blogSchema);