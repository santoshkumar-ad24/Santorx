const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/blogsDB"),{
    useNewUrlParser : true,
    useUnifiedTopology: true
};

const blogSchema = new mongoose.Schema({
    title: String,
    slug: String,
    category: String,
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