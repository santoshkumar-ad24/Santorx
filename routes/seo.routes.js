const express = require('express');
const path = require('path');
const router = express.Router();

// Serve robots.txt
router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.sendFile(path.join(__dirname, '../robots.txt'));
});

// Serve sitemap.xml
router.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.sendFile(path.join(__dirname, '../sitemap.xml'));
});

module.exports = router;
