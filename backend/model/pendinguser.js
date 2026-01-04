const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema({
  userName: {  // ✅ camelCase
    type: String,
    required: true
  },
  userid: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  otpExpires: {  // ✅ camelCase
    type: Date,
    required: true
  }
}, { timestamps: true });

const PendingUser = mongoose.model("PendingUser", pendingSchema);
module.exports = PendingUser;