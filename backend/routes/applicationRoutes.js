const express = require('express');
const router = express.Router();
const Application = require('../model/application');
const JobDetail = require('../model/jobdetail');
const { authenticateToken } = require('../middleware/auth');

// POST /api/applications/apply/:jobId
router.post('/apply/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    const { name, email, resumeUrl } = req.body; // Optional override fields

    // 1. Check if job exists
    const job = await JobDetail.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // 2. Prevent applying to own job
    if (job.postedby === userId) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own job' });
    }

    // 3. Check if already applied
    const existingApplication = await Application.findOne({ jobId, userId });
    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'You have already applied to this job' });
    }

    // 4. Create Application
    // Ideally we fetch user details from User model if not provided, but for now we trust client or defaults
    const application = new Application({
      jobId,
      userId,
      applicantName: name || req.user.userName || 'Unknown Candidate', // Fallback
      applicantEmail: email || req.user.userid || 'No Email',
      jobTitle: job.title,
      company: job.company,
      resumeUrl: resumeUrl || '',
      status: 'applied'
    });

    await application.save();

    console.log(`✅ Application received: ${userId} -> ${jobId}`);

    // 5. Send Real-time Notification via Socket.io
    const io = req.app.get('socketio');
    const connectedUsers = req.app.get('connectedUsers');
    
    // logic to find recruiter's socketId
    // We need to know who posted the job -> job.postedby (which is a userId string/ObjectId)
    const recruiterId = job.postedby.toString(); // Ensure string
    
    // Check if recruiter is online
    // connectedUsers is a Map<userId, socketId>
    // Ensure we match the type (string vs ObjectId)
    const recruiterSocketId = connectedUsers.get(recruiterId);

    // Create Notification in DB
    const Notification = require('../model/notification');
    const notification = new Notification({
      recipientId: recruiterId,
      senderId: userId,
      type: 'NEW_APPLICATION',
      message: `New applicant for ${job.title}: ${application.applicantName}`,
      data: {
        applicationId: application._id,
        jobId: job._id,
        jobTitle: job.title,
        applicantName: application.applicantName,
        resumeUrl: application.resumeUrl,
        appliedAt: application.appliedAt
      }
    });
    await notification.save();

    if (recruiterSocketId) {
      console.log(`📡 Sending notification to recruiter ${recruiterId} at socket ${recruiterSocketId}`);
      io.to(recruiterSocketId).emit('notification', notification); // Emit full object
    } else {
      console.log(`📴 Recruiter ${recruiterId} is not online. Notification skipped (or save to DB for later).`);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('❌ Apply Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/applications/my-applications
// For Job Seekers to see what they applied to
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/applications/:applicationId/status
// For Recruiters to update status (Shortlist, Reject, etc.)
router.patch('/:applicationId/status', authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body; // 'shortlisted', 'rejected', 'hired', 'applied'
    
    if (!['applied', 'viewed', 'shortlisted', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify the recruiter owns the job associated with this application
    const job = await JobDetail.findOne({ _id: application.jobId, postedby: req.user.id });
    if (!job) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();
    
    console.log(`✅ Application status updated: ${applicationId} -> ${status}`);

    // Notify Job Seeker
    const io = req.app.get('socketio');
    const connectedUsers = req.app.get('connectedUsers');
    const seekerId = application.userId.toString();
    const seekerSocketId = connectedUsers.get(seekerId);

    // Create Notification in DB
    const Notification = require('../model/notification');
    const notification = new Notification({
      recipientId: seekerId,
      senderId: req.user.id,
      type: 'STATUS_UPDATE',
      message: `Your application for ${job.title} has been ${status}`,
      data: {
        applicationId,
        jobId: job._id,
        jobTitle: job.title,
        status: status,
        company: job.company
      }
    });
    await notification.save();

    if (seekerSocketId) {
      console.log(`📡 Sending status update to seeker ${seekerId}`);
      io.to(seekerSocketId).emit('notification', notification);
    }

    res.json({ success: true, application });

  } catch (error) {
    console.error('❌ Status Update Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/applications/job/:jobId
// For Recruiters to see who applied to a specific job
router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Verify job belongs to user
    const job = await JobDetail.findOne({ _id: jobId, postedby: req.user.id });
    if (!job) {
      return res.status(403).json({ success: false, message: 'Not authorized or job not found' });
    }

    const mongoose = require('mongoose');
    const applicants = await Application.aggregate([
      { $match: { jobId: new mongoose.Types.ObjectId(jobId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'profiles',
          localField: 'userId',
          foreignField: 'userId',
          as: 'profileData'
        }
      },
      {
        $addFields: {
          profile: { $arrayElemAt: ['$profileData', 0] }
        }
      },
      {
        $project: {
          profileData: 0,
          'profile._id': 0,
          'profile.userId': 0,
          'profile.__v': 0
        }
      }
    ]);
    
    res.json({ success: true, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
