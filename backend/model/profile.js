const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  dob: String,
  xgpa: String,
  xpassout: String,
  xigpa: String,
  xipassout: String,
  collagename: String,
  degree: String,
  department: String,
  collagegpa: String,
  collagepassout: String,
  location: String,
  email: {
    type: String,
    required: true
  },
  skills: String,
  internname: String,
  startdate: String,
  enddate: String,
  internlink: String,
  job: String,
  companyname: String,
  jobexpirience: String,
  companycontact: String,
  projects: [{
    title: { type: String, required: true },
    description: String,
    link: String
  }],
  
  // Profile Picture Field
  profilePic: {
    filename: String,
    path: String,
    mimeType: String,
    size: Number,
    uploadedAt: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);