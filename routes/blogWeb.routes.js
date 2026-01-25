const express = require("express");
const router = express.Router();
const blogDB = require("../models/blog")
const admindb = require("../models/adminDB");
const userFeedbackDB = require("../models/userFeedback");
const userConatctDB = require("../models/userContact");
const authMiddleware = require("../middleware/adminChecker");
const { validateEmail, validateString, sanitizeInput } = require("../middleware/inputValidator");


router.get("/", async (req, res) => {
    const blog = await blogDB.find({
        content: { $nin: [null, ""] }
    })
        .sort({ createdAt: -1 });
    const featured = Math.floor(Math.random() * blog.length);
    res.render('index', {
        blog,
        featured
    });
});

router.get("/blog", async (req, res) => {
    const blog = await blogDB.find({ content: { $nin: [null, ""] } })
        .sort({ createdAt: -1 });
    res.render('my_blog', { blog });
})

router.get("/about", async (req, res) => {
    res.render('about');
})

router.get("/contact", (req, res) => {
    res.render('contact');
})


router.post("/feedback", async (req, res, next) => {
    try {
        const { firstName, lastName, email, message } = req.body;
        
        if (!validateString(firstName, 1, 50)) {
            return res.status(400).json({ success: false, message: 'First name is invalid' });
        }
        if (!validateString(lastName, 1, 50)) {
            return res.status(400).json({ success: false, message: 'Last name is invalid' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Email is invalid' });
        }
        if (!validateString(message, 10, 5000)) {
            return res.status(400).json({ success: false, message: 'Message must be between 10 and 5000 characters' });
        }
        
        const sanitizedData = {
            firstName: sanitizeInput(firstName),
            lastName: sanitizeInput(lastName),
            email: email.trim(),
            message: sanitizeInput(message)
        };
        
        const feedbackDB = await userFeedbackDB.findOne({ email: sanitizedData.email });
        if (feedbackDB) {
            await feedbackDB.updateOne(sanitizedData);
        } else {
            await userFeedbackDB.create(sanitizedData);
        }
        res.redirect('/');
    } catch (error) {
        next(error);
    }
})


router.post('/contact-inquiry', async (req, res, next) => {
    try {
        const { name, email, inquiry, message } = req.body;
        
        if (!validateString(name, 1, 100)) {
            return res.status(400).json({ success: false, message: 'Name is invalid' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Email is invalid' });
        }
        if (!validateString(inquiry, 1, 200)) {
            return res.status(400).json({ success: false, message: 'Inquiry is invalid' });
        }
        if (!validateString(message, 10, 5000)) {
            return res.status(400).json({ success: false, message: 'Message must be between 10 and 5000 characters' });
        }
        
        const sanitizedData = {
            name: sanitizeInput(name),
            email: email.trim(),
            inquiry: sanitizeInput(inquiry),
            message: sanitizeInput(message)
        };
        
        const ContactDB = await userConatctDB.findOne({ email: sanitizedData.email });
        if (ContactDB) {
            await userConatctDB.updateOne(sanitizedData);
        } else {
            await userConatctDB.create(sanitizedData);
        }
        res.redirect('/contact');
    } catch (error) {
        next(error);
    }
})





router.get("/blog/:slug", async (req, res) => {
    const slug = req.params.slug;
    const blog = await blogDB.findOne({ slug: slug }).populate("adminId", "adminImage adminName adminBio");
    
    const blogList = await blogDB.find({ content: { $nin: [null, ""] } })
        .sort({ createdAt: -1 });
    if (blog) {
        res.render('blog', { blog,blogList});

    }
    else {
        return res.status(404).render('404', { message: "Blog not found" });
    }
})

module.exports = router;