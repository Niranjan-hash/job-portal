const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/newuser");
const PendingUser = require('../model/pendinguser');
const transporter = require('../mailer');
const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { userName, userid, password } = req.body;
    
    // Check if user already exists
    const existUser = await User.findOne({ userid });
    if (existUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exists" 
      });
    }
    
    // Check if OTP already sent
    const pendingExists = await PendingUser.findOne({ userid });
    if (pendingExists) {
      return res.status(400).json({ 
        success: false, 
        message: "OTP already sent. Please check your email." 
      });
    }
    
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create pending user
    const pendingUser = new PendingUser({ 
      userName, 
      userid, 
      password: hashed, 
      otp,
      otpExpires: Date.now() + 2 * 60 * 1000  // 2 minutes
    });
    
    await pendingUser.save();
    
    // Send OTP email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: userid,
        subject: "OTP Verification",
        text: `Your OTP is: ${otp}. It will expire in 2 minutes.`
      });
      console.log("✅ OTP email sent to:", userid);
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError);
      // Don't fail signup if email fails, just log it
    }
    
    // Send response (without OTP for security)
    res.status(200).json({ 
      success: true, 
      message: "OTP sent to your email",
      userid: userid
    });
    
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Signup failed. Please try again." 
    });
  }
});

// OTP VERIFICATION
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp, userid } = req.body;
    
    // Find pending user
    const pendingUser = await PendingUser.findOne({ userid });
    
    if (!pendingUser) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found. Please sign up again."
      });
    }
    
    // Check if OTP matches
    if (pendingUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP"
      });
    }
    
    // Check if OTP expired
    if (pendingUser.otpExpires < Date.now()) {
      await PendingUser.deleteOne({ _id: pendingUser._id }); // Clean up expired
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }
    
    // OTP is valid - Create permanent user
    const newUser = new User({
      userName: pendingUser.userName,  // ✅ camelCase (matches both models)
      userid: pendingUser.userid,
      password: pendingUser.password,
      isVerified: true  // ✅ camelCase
    });
    
    await newUser.save();
    
    // Delete pending user
    await PendingUser.deleteOne({ _id: pendingUser._id });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, userid: newUser.userid },
      process.env.ACCESS_TOKEN || 'fallback_secret',
      { expiresIn: "24h" }
    );
    
    console.log("✅ User created:", newUser.userid);
    
    // Send success response
    res.status(201).json({
      success: true,
      message: "Account verified successfully",
      token,
      user: {
        id: newUser._id,
        userName: newUser.userName,  // ✅ camelCase
        userid: newUser.userid,
        isVerified: newUser.isVerified  // ✅ camelCase
      }
    });
    
  } catch (error) {
    console.error("OTP verification error:", error);
    console.error("Error details:", error.message);
    res.status(500).json({
      success: false,
      message: "OTP verification failed. Please try again."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { userid, password } = req.body;
    
    // Find user
    const user = await User.findOne({ userid });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {  // ✅ camelCase
      return res.status(403).json({ 
        success: false, 
        message: "Account not verified. Please verify your email." 
      });
    }
    
    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ 
        success: false, 
        message: "Incorrect password" 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, userid: user.userid },
      process.env.ACCESS_TOKEN || 'fallback_secret',
      { expiresIn: "24h" }
    );
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        userName: user.userName,  // ✅ camelCase
        userid: user.userid,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Login failed. Please try again." 
    });
  }
});

// RESEND OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { userid } = req.body;
    
    if (!userid) {
      return res.status(400).json({ 
        success: false, 
        message: "Email is required" 
      });
    }
    
    // Find pending user
    const pendingUser = await PendingUser.findOne({ userid });
    
    if (!pendingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "No pending registration found" 
      });
    }
    
    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update pending user with new OTP
    pendingUser.otp = newOtp;
    pendingUser.otpExpires = Date.now() + 2 * 60 * 1000; // Reset to 2 minutes
    await pendingUser.save();
    
    // Send new OTP email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: userid,
        subject: "New OTP Verification",
        text: `Your new OTP is: ${newOtp}. It will expire in 2 minutes.`
      });
      console.log("✅ New OTP sent to:", userid);
    } catch (emailError) {
      console.error("❌ Failed to resend email:", emailError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to resend OTP email" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "New OTP sent to your email",
      userid: userid
    });
    
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to resend OTP. Please try again." 
    });
  }
});

module.exports = router;