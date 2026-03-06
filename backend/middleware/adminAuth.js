const jwt = require("jsonwebtoken");
const User = require('../model/newuser');

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication token required" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN || 'fallback_secret');
    
    // Find user in database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(403).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if user is an admin
    if (!user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: "Access Denied: Admin privileges required." 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error("Admin Auth middleware error:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token has expired. Please login again." 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: "Authentication failed" 
    });
  }
};

module.exports = { authenticateAdmin };
