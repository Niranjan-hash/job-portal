const mongoose = require('mongoose');

// Define schema
const userSchema = new mongoose.Schema({
  userName: {  // ✅ camelCase (consistent with PendingUser)
    type: String,
    required: true
  },
  userid: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {  // ✅ camelCase (consistent with PendingUser)
    type: Boolean,
    default: false 
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  profilePublic: {
    type: Boolean,
    default: true
  },
  resetOtp: {
    type: String,
    default: null
  },
  resetOtpExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Create model
const User = mongoose.model("User", userSchema);

// Export model
module.exports = User;