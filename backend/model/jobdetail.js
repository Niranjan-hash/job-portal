const mongoose = require('mongoose');

const jobschema = new mongoose.Schema({          
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true },
  salary: { type: String },
  description: { type: String },
  postedby: { type: String, required: true }
}, { timestamps: true });

// ✅ FIX: Use consistent variable name
const JobDetail = mongoose.model("JobDetail", jobschema);
module.exports = JobDetail;  // Export JobDetail, not Job_detail