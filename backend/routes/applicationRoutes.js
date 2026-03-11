const express = require('express');
const router = express.Router();
const Application = require('../model/application');
const JobDetail = require('../model/jobdetail');
const { authenticateToken } = require('../middleware/auth');

// POST /api/applications/apply/:jobId
router.post('/apply/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId;
    const { name, email, resumeUrl } = req.body; // Optional override fields

    // 1. Check if job exists
    const job = await JobDetail.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // 2. Prevent applying to own job
    if (job.postedby.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own job' });
    }

    // 3. Check if already applied
    const existingApplication = await Application.findOne({ jobId, userId });
    if (existingApplication) {
      return res.status(400).json({ success: false, message: 'You have already applied to this job' });
    }

    // 4. Create Application
    // Use the verified userName and email from the token to avoid identity spoofing
    const application = new Application({
      jobId,
      userId,
      applicantName: req.user.userName || name || 'Unknown Candidate',
      applicantEmail: req.user.userid || email || 'No Email',
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
        company: job.company, // Added company
        senderName: application.applicantName, 
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
    const applications = await Application.find({ userId: req.userId })
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
    const job = await JobDetail.findOne({ _id: application.jobId, postedby: req.userId.toString() });
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
      senderId: req.userId,
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

router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Verify job belongs to user
    const job = await JobDetail.findOne({ _id: jobId, postedby: req.userId.toString() });
    if (!job) {
      return res.status(403).json({ success: false, message: 'Not authorized or job not found' });
    }

    const mongoose = require('mongoose');
    const { sort, experience, skill, education, location, score } = req.query;

    // Build Match for Applications
    const matchStage = { jobId: new mongoose.Types.ObjectId(jobId) };
    
    // Sort logic
    let sortStage = { appliedAt: -1 }; // Default: Newest
    if (sort === 'oldest') {
      sortStage = { appliedAt: 1 };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'profiles',
          localField: 'userId',
          foreignField: 'userId',
          as: 'profileData'
        }
      },
      {
        $lookup: {
          from: 'jobdetails',
          localField: 'jobId',
          foreignField: '_id',
          as: 'jobData'
        }
      },
      {
        $addFields: {
          profile: { $arrayElemAt: ['$profileData', 0] },
          jobTitle: { $arrayElemAt: ['$jobData.title', 0] },
          company: { $arrayElemAt: ['$jobData.company', 0] }
        }
      }
    ];

    // Smart Filters based on Profile / Application fields
    const postLookupMatch = {};

    // 1. Experience Filter
    if (experience) {
      if (experience === '0-2') {
        postLookupMatch['profile.jobexpirience'] = { $regex: /^[0-2](\.\d+)?(\s|$)/ }; // Simple regex for numeric start
      } else if (experience === '2-5') {
        postLookupMatch['profile.jobexpirience'] = { $regex: /^[2-5](\.\d+)?(\s|$)/ };
      } else if (experience === '5+') {
        postLookupMatch['profile.jobexpirience'] = { $regex: /^([5-9]|\d{2,})(\.\d+)?(\s|$)/ };
      }
    }

    // 2. Skill Filter
    if (skill) {
      postLookupMatch['profile.skills'] = { $regex: new RegExp(skill, 'i') };
    }

    // 3. Education Filter
    if (education) {
      postLookupMatch['profile.degree'] = { $regex: new RegExp(education, 'i') };
    }

    // 4. Location Filter
    if (location) {
      postLookupMatch['profile.location'] = { $regex: new RegExp(location, 'i') };
    }

    // 5. Resume Score Filter
    if (score) {
      postLookupMatch.aiScore = { $gte: parseInt(score) };
    }

    if (Object.keys(postLookupMatch).length > 0) {
      pipeline.push({ $match: postLookupMatch });
    }

    pipeline.push({ $sort: sortStage });
    pipeline.push({
      $project: {
        profileData: 0,
        'profile._id': 0,
        'profile.userId': 0,
        'profile.__v': 0
      }
    });

    const applicants = await Application.aggregate(pipeline);
    
    res.json({ success: true, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
