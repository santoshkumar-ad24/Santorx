const express = require('express');
const router = express.Router();

const upload = require('../middleware/quillUpload');
const path = require('path');

const admindb = require('../models/adminDB')
const authMiddleware = require('../middleware/adminChecker')

const cloudinary = require('../config/cloud_key');



router.post("/upload-image", upload.single("image"), authMiddleware,async (req, res, next) => {

    console.log(path.parse(req.file.originalname).name); 
        const cloudUpload = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
        asset_folder: "BlogImage",
        public_id: path.parse(req.file.originalname).name,
        transformation: [
            { width: 800, height: 600, format: "webp",quality: "auto" }
        ],
        resource_type: "image",
        secure: true,
    }
    );
    const imageUrl = cloudUpload.secure_url;
    console.log(imageUrl);

    res.json({ url: imageUrl });

});

router.post("/admin/details/uploader-img",upload.single("profile"), authMiddleware,async (req,res, next)=>{
     console.log(path.parse(req.file.originalname).name);
    const cloudUpload = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
        asset_folder: "BlogProfileImage",
        public_id: path.parse(req.file.originalname).name,
        transformation: [
            { width: 400, height: 500, format: "webp",quality: "auto" }
        ],
        resource_type: "image",
        secure: true,
    });
    const imageUrl = cloudUpload.secure_url;
    const admin = await admindb.findOne({_id: req.adminID});
    if(!admin) return res.status(404).redirect('/admin/login');
    console.log(imageUrl)
    admin.adminImage = imageUrl;
    await admin.save();
    console.log(admin);
    res.redirect('/admin/details');

})



module.exports = router;