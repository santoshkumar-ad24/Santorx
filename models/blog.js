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
  },
  likes: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  dislikes: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      dislikedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      comment: String,
      likes: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          },
          likedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      dislikes: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          },
          dislikedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      replies: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
          },
          reply: String,
          replyingTo: String,
          likes: [
            {
              userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
              }
            }
          ],
          dislikes: [
            {
              userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
              }
            }
          ],
          createdAt: {
            type: Date,
            default: Date.now
          },
          updatedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]

});

module.exports = mongoose.model("Blog", blogSchema);