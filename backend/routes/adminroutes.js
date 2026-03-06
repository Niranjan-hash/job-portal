const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../model/newuser');
const JobDetail = require('../model/jobdetail');
const Profile = require('../model/profile');
const Application = require('../model/application');
const Resume = require('../model/resumeschema');
const Notification = require('../model/notification');
const { authenticateAdmin } = require('../middleware/adminAuth');

// ADMIN LOGIN (Special Route)
router.post('/login', async (req, res) => {
    try {
        const { userid, password } = req.body;
        
        // This is a specialized admin login endpoint.
        // It bypasses the verified check and heavily checks the password.
        // In a real app, this should be highly secured, perhaps with 2FA or IP whitelisting.

        console.log("Admin Login Attempt:", req.body);
        const adminUser = await User.findOne({ userid, isAdmin: true });

        if (!adminUser) {
           console.log("Admin User not found for userid:", userid);
           return res.status(401).json({ success: false, message: "Invalid admin credentials" });
        }

        const bcrypt = require('bcrypt');
        const match = await bcrypt.compare(password, adminUser.password);

        if (!match) {
           console.log("Admin Password Mismatch for userid:", userid);
           return res.status(401).json({ success: false, message: "Invalid admin credentials" });
        }

        // Generate powerful Admin JWT token
        const token = jwt.sign(
            { id: adminUser._id, userid: adminUser.userid, isAdmin: true },
            process.env.ACCESS_TOKEN || 'fallback_secret',
            { expiresIn: "12h" } // Shorter expiry for admin
        );

        res.json({
            success: true,
            message: "Admin Login Successful",
            token,
            admin: {
                id: adminUser._id,
                userName: adminUser.userName,
                userid: adminUser.userid
            }
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: "Admin login failed" });
    }
});

// GET ALL USERS
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.json({ success: true, users });
    } catch (error) {
        console.error("Fetch users error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
});

// DELETE A USER (Admin override)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        
        // Prevent admin from deleting themselves
        if (userIdToDelete === req.userId.toString()) {
            return res.status(400).json({ success: false, message: "Admins cannot delete their own account from this panel." });
        }

        // Wipe associated data
        await Profile.deleteOne({ userId: userIdToDelete });
        await JobDetail.deleteMany({ postedby: userIdToDelete });
        await Application.deleteMany({ userId: userIdToDelete });
        await Resume.deleteOne({ userId: userIdToDelete });
        await Notification.deleteMany({ recipientId: userIdToDelete });
        
        // Finally remove the user
        await User.findByIdAndDelete(userIdToDelete);

        res.json({ success: true, message: "User and all associated data deleted successfully." });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ success: false, message: "Failed to delete user." });
    }
});

// GET ALL JOBS
router.get('/jobs', authenticateAdmin, async (req, res) => {
    try {
        const jobs = await JobDetail.find({}).sort({ createdAt: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        console.error("Fetch jobs error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch jobs" });
    }
});

// DELETE A JOB POST (Admin override)
router.delete('/jobs/:id', authenticateAdmin, async (req, res) => {
    try {
        const jobId = req.params.id;

        // Find the job first to log/notify if needed
        const job = await JobDetail.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        // Delete associated applications
        await Application.deleteMany({ jobId });
        
        // Delete the job
        await JobDetail.findByIdAndDelete(jobId);

        res.json({ success: true, message: "Job and all related applications deleted successfully." });
    } catch (error) {
        console.error("Delete job error:", error);
        res.status(500).json({ success: false, message: "Failed to delete job." });
    }
});

module.exports = router;
