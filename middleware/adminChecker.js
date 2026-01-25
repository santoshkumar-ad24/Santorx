const jwt = require('jsonwebtoken');

const authMiddleware = ((req,res,next)=>{
    const token = req.cookies.Authtoken;
    if(!token) return res.redirect('/admin/login');
    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.adminID = decoded.id;
        next();
    }catch (err) {
    if (err.name === "TokenExpiredError") {
      res.clearCookie("authToken");
      return res.redirect('/admin/login?message=Session expired, please log in again');
    }
    return res.redirect('/admin/login');
  }


})

module.exports = authMiddleware;