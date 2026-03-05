const jwt = require("jsonwebtoken");
const User = require('../model/newuser');

const authenticateToken = async (req, res, next) => {
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

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false,
        message: "Account not verified. Please verify your email." 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    
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
const authenticatesocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    console.log('🔑 Socket auth - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('❌ No token provided');
      return next(new Error('Authentication token required'));
    }
    
    // Verify token
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN || 'fallback_secret');
    
    console.log('✅ Token verified for user:', decode.id);
    
    // ✅ CRITICAL FIX: Attach to socket object
    socket.userId = decode.id;      // ✅ This makes socket.userId available
    socket.userEmail = decode.email; // ✅ This makes socket.userEmail available
    
    console.log('📋 Socket now has:', {
      userId: socket.userId,
      userEmail: socket.userEmail
    });
    
    next(); // Allow connection
    
  } catch (error) {
    console.error('❌ Socket auth error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired. Please login again.'));
    }
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    
    return next(new Error('Authentication failed: ' + error.message));
  }
};

module.exports = {authenticateToken,authenticatesocket};