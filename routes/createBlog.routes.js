const express = require("express");
const router = express.Router();
const blogDB = require("../models/blog");
const admindb = require("../models/adminDB");
const userConatctDB = require("../models/userContact");
const userFeedbackDB = require("../models/userFeedback");
const slugify = require("slugify");
const multer = require("multer");

const authMiddleware = require('../middleware/adminChecker');
const { validateString, sanitizeInput } = require('../middleware/inputValidator');

router.get("/details",authMiddleware ,async (req,res)=>{
    const admin = await admindb.findOne({_id: req.adminID});
    if(!admin) return res.status(400).redirect('/admin/login')
    res.render('admin-details',{adminImage: admin.adminImage, adminName: admin.adminName, adminUser: admin.adminUser,joinDate: admin.Date.toDateString()});
})


router.get("/dashboard",authMiddleware,async (req,res)=> {
    const blog = await blogDB.find({content: {$nin: [null, ""]}})
        .populate("adminId","adminImage")
        .sort({createdAt: -1});
    

        res.render('admin-dashboard', {blog});


})
router.get("/dashboard/feedback",authMiddleware, async (req,res)=>{
    const blog = await blogDB.find({content: {$nin: [null, ""]}})
        .populate("adminId","adminImage")
        .sort({createdAt: -1});
    const userFeedback = await userFeedbackDB.find().sort({createdAt: -1});

    res.render("adm-feedback", {userFeedback, blog})
})

router.get("/dashboard/contact-inqury",authMiddleware, async (req,res)=>{
    const userContact = await userConatctDB.find().sort({createdAt: -1});

    res.render("adm-inqury", {userContact})
})

router.get("/dashboard/create-blog", authMiddleware,(req,res)=> {
    res.render('create-blog');
})


router.post("/postBlog", authMiddleware, async (req, res, next) => {
    try {
        const { title, category, keyword, description, content, image } = req.body;
        
        if (!validateString(title, 5, 200)) {
            return res.status(400).json({ success: false, message: 'Title must be between 5 and 200 characters' });
        }
        if (!validateString(category, 1, 100)) {
            return res.status(400).json({ success: false, message: 'Category is invalid' });
        }
        if (!validateString(keyword, 1, 500)) {
            return res.status(400).json({ success: false, message: 'Keywords are invalid' });
        }
        if (!validateString(description, 10, 500)) {
            return res.status(400).json({ success: false, message: 'Description must be between 10 and 500 characters' });
        }
        if (!validateString(content, 20, 50000)) {
            return res.status(400).json({ success: false, message: 'Content must be between 20 and 50000 characters' });
        }
        
        const admin = await admindb.findOne({ _id: req.adminID });
        if (!admin) return res.status(404).render('/admin/login', { message: 'Unauthorized' });
        
        const sanitizedData = {
            title: sanitizeInput(title),
            category: sanitizeInput(category),
            metaKeyword: sanitizeInput(keyword),
            metaDescription: sanitizeInput(description),
            content: content,
            imageUrl: image,
            adminId: admin._id
        };
        
        await blogDB.create({
            ...sanitizedData,
            slug: slugify(sanitizedData.title, { lower: true, strict: true })
        });
        
        res.redirect('/admin/dashboard/create-blog');
    } catch (error) {
        next(error);
    }
});


router.get("/dashboard/edit/:id", authMiddleware,async (req,res)=> {
    const id = req.params.id;
    const blog = await blogDB.findOne({_id: id});
    if(!blog) redirect("/admin/dashboard");
    res.render("edit-blog", {blog});
});

router.post("/dashboard/edit/:id", authMiddleware, async (req, res, next) => {
    try {
        const id = req.params.id;
        const { title, category, keyword, description, content, image } = req.body;
        
        if (!validateString(title, 5, 200)) {
            return res.status(400).json({ success: false, message: 'Title must be between 5 and 200 characters' });
        }
        if (!validateString(category, 1, 100)) {
            return res.status(400).json({ success: false, message: 'Category is invalid' });
        }
        if (!validateString(keyword, 1, 500)) {
            return res.status(400).json({ success: false, message: 'Keywords are invalid' });
        }
        if (!validateString(description, 10, 500)) {
            return res.status(400).json({ success: false, message: 'Description must be between 10 and 500 characters' });
        }
        if (!validateString(content, 20, 50000)) {
            return res.status(400).json({ success: false, message: 'Content must be between 20 and 50000 characters' });
        }
        
        const admin = await admindb.findOne({ _id: req.adminID });
        if (!admin) return res.status(404).render('/admin/login', { message: 'Unauthorized' });
        
        const sanitizedData = {
            title: sanitizeInput(title),
            slug: slugify(sanitizeInput(title), { lower: true, strict: true }),
            category: sanitizeInput(category),
            metaKeyword: sanitizeInput(keyword),
            metaDescription: sanitizeInput(description),
            content: content,
            imageUrl: image,
            updatedAt: Date.now(),
            adminId: admin._id
        };
        
        await blogDB.findOneAndUpdate({ _id: id }, sanitizedData);
        res.redirect('/admin/dashboard');
    } catch (error) {
        next(error);
    }
});

router.post("/dashboard/delete/:id", authMiddleware, async (req, res, next) => {
    try {
        const id = req.params.id;
        const result = await blogDB.findOneAndDelete({ _id: id });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        res.redirect('/admin/dashboard');
    } catch (error) {
        next(error);
    }
});


module.exports = router;