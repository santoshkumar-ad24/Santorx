const express = require('express');
const router = express.Router();

router.get('/banner728', (req, res) => {
    res.render('ads/banner728');
});

router.get('/banner468', (req, res) => {
    res.render('ads/banner468');
});

router.get('/banner320', (req, res) => {
    res.render('ads/banner320');
});

router.get('/banner250', (req, res) => {
    res.render('ads/banner250');
});

router.get('/banner160', (req, res) => {
    res.render('ads/banner160');
});
router.get('/nativeBanner', (req, res) => {
    res.render('ads/nativeBanner');
});

module.exports = router;