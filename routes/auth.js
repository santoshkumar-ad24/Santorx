const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
    "/google",
    (req, res, next) => {
        // Capture returnTo from query params and store in a short-lived cookie
        if (req.query.returnTo) {
            res.cookie('returnTo', req.query.returnTo, { httpOnly: true, maxAge: 5 * 60 * 1000 }); // 5 minutes
        }
        next();
    },
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/",
        session: false
    }),
    (req, res) => {
        // Generate JWT token
        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: '14d' }
        );

        // Set JWT in HTTP-only cookie
        res.cookie('userToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && !req.hostname.includes('localhost'),
            sameSite: 'lax',
            maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
        });

        // Retrieve returnTo from cookie, default to /
        let returnTo = req.cookies.returnTo || "/";
        res.clearCookie('returnTo');

        // Security: validate that returnTo is a safe internal URL
        if (!returnTo.startsWith("/") || returnTo.includes("://")) {
            returnTo = "/";
        }

        res.redirect(returnTo);
    }
);

router.get("/logout", (req, res) => {
    res.clearCookie('userToken');
    res.redirect("/");
});

module.exports = router;