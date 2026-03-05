const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model, or just store as ID
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['NEW_APPLICATION', 'STATUS_UPDATE', 'SYSTEM'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Object, // Flexible for job details, application IDs, etc.
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
