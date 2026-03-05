const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDetail',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of critical details in case original docs change
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  
  status: {
    type: String,
    enum: ['applied', 'viewed', 'shortlisted', 'rejected', 'hired'],
    default: 'applied'
  },
  resumeUrl: { type: String }, // Link to resume file if we upload it, or just a flag
  
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate applications
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
