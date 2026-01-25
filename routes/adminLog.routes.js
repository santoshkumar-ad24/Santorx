const express = require('express');
const bcrypt = require('bcrypt');
const admindb = require('../models/adminDB');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const router = express.Router();
const { validateString } = require('../middleware/inputValidator');


router.get("/login", (req,res)=> {
    const message = "";
    res.render('adminLogin', {message});
})


router.post('/login', async (req, res, next) => {
    try {
        const { username, password, name } = req.body;
        
        if (!validateString(name, 1, 50)) {
            return res.status(400).render('adminLogin', { message: 'Invalid admin name' });
        }
        if (!validateString(username, 1, 50)) {
            return res.status(400).render('adminLogin', { message: 'Invalid username' });
        }
        if (!validateString(password, 6, 100)) {
            return res.status(400).render('adminLogin', { message: 'Invalid password' });
        }
        
        const adminName = name.toLowerCase();
        const isAdmin = await admindb.findOne({});
        
        if (!isAdmin) {
            const saltRounds = 14;
            const salt = await bcrypt.genSalt(saltRounds);
            const hash = await bcrypt.hash(password, salt);
            
            await admindb.create({
                adminName,
                adminUser: username,
                password: hash
            });
        }
        
        const adminCheck = await admindb.findOne({ adminName, adminUser: username });
        if (!adminCheck) {
            return res.status(400).render('adminLogin', { message: 'Invalid AdminName or UserName or PassWord.' });
        }
        
        const checkPwd = await bcrypt.compare(password, adminCheck.password);
        if (!checkPwd) {
            return res.status(400).render('adminLogin', { message: 'Invalid AdminName or UserName or PassWord.' });
        }
        
        const token = jwt.sign({ id: adminCheck._id }, process.env.JWT_SECRET || 'santoshCheck', { expiresIn: '1h' });
        
        res.cookie('Authtoken', token, {
            maxAge: 60 * 60 * 1000,
            secure: true,
            httpOnly: true
        });
        
        res.redirect('/admin/details');
    } catch (error) {
        next(error);
    }
})

module.exports = router;