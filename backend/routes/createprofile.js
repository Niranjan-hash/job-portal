const express = require('express');
const router = express.Router();
const Profile = require('../model/profile');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/uploadprofile');
const fs = require('fs');
const path = require('path');

// Debug function
const debug = (message, type = 'INFO') => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [${type}] ${message}`);
};

// Create profile
router.post('/create', authenticateToken, async (req, res) => {
  const requestId = req.requestId || Date.now().toString();
  debug(`[${requestId}] Profile create request`, 'REQUEST');
  
  try {
    const userId = req.userId;
    
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const existingProfile = await Profile.findOne({ userId });
    
const mongoose = require('mongoose');

// ... (existing debug function)

// In the /create route:
    if (req.body.email) {
      const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      debug(`[${requestId}] Checking email uniqueness for ${req.body.email} (excluding ${userIdObj})`, 'INFO');
      
      const emailTaken = await Profile.findOne({ 
        email: req.body.email, 
        userId: { $ne: userIdObj } 
      });
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    let profile;
    let message;
    
    if (existingProfile) {
      profile = await Profile.findOneAndUpdate(
        { userId },
        { ...req.body, userId },
        { new: true, runValidators: true }
      );
      message = 'Profile updated successfully';
    } else {
      profile = new Profile({ ...req.body, userId });
      await profile.save();
      message = 'Profile created successfully';
    }
    
    debug(`[${requestId}] Profile saved`, 'SUCCESS');
    
    res.status(200).json({
      success: true,
      message,
      profile
    });
    
  } catch (error) {
    debug(`[${requestId}] Error: ${error.message}`, 'ERROR');
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get profile
router.get('/my-profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await Profile.findOne({ userId }).lean();
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      profile
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user profile by ID (for recruiters)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ userId }).lean();
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      profile
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Upload profile picture
router.post('/upload-profile-pic', 
  authenticateToken, 
  upload.single('profilePic'), 
  async (req, res) => {
    const requestId = req.requestId || Date.now().toString();
    debug(`[${requestId}] Upload request started`, 'UPLOAD');
    debug(`[${requestId}] Headers: ${JSON.stringify(req.headers)}`, 'DEBUG');
    
    try {
      if (!req.file) {
        debug(`[${requestId}] No file received`, 'ERROR');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      debug(`[${requestId}] File received: ${req.file.originalname}`, 'SUCCESS');
      
      const userId = req.userId;
      let profile = await Profile.findOne({ userId });

      if (!profile) {
        debug(`[${requestId}] Profile not found for userId: ${userId}, creating skeleton profile`, 'INFO');
        profile = new Profile({
          userId,
          name: "User", // Default placeholder
          email: "user@example.com" // Default placeholder
        });
      }

      // Delete old picture
      if (profile.profilePic && profile.profilePic.path && fs.existsSync(profile.profilePic.path)) {
        fs.unlinkSync(profile.profilePic.path);
      }

      // Update profile
      profile.profilePic = {
        filename: req.file.filename,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };

      await profile.save();

      const imageUrl = `/uploads/profile-pics/${req.file.filename}`;
      debug(`[${requestId}] Upload successful: ${imageUrl}`, 'SUCCESS');

      res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          filename: req.file.filename,
          url: imageUrl,
          size: req.file.size,
          mimeType: req.file.mimetype
        }
      });

    } catch (error) {
      debug(`[${requestId}] Upload error: ${error.message}`, 'ERROR');
      
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
);

// Get profile picture
router.get('/profile-pic', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await Profile.findOne({ userId }).select('profilePic');
    
    if (!profile || !profile.profilePic || !profile.profilePic.filename) {
      return res.status(404).json({
        success: false,
        message: 'No profile picture'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        filename: profile.profilePic.filename,
        url: `/uploads/profile-pics/${profile.profilePic.filename}`,
        mimeType: profile.profilePic.mimeType,
        size: profile.profilePic.size
      }
    });

  } catch (error) {
    console.error('Get profile pic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete profile picture
router.delete('/delete-profile-pic', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await Profile.findOne({ userId });
    
    if (!profile || !profile.profilePic || !profile.profilePic.path) {
      return res.status(404).json({
        success: false,
        message: 'No profile picture found'
      });
    }

    if (fs.existsSync(profile.profilePic.path)) {
      fs.unlinkSync(profile.profilePic.path);
    }

    profile.profilePic = {
      filename: "",
      path: "",
      mimeType: "",
      size: 0,
      uploadedAt: null
    };

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;