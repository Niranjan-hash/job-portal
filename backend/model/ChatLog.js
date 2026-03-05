const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for guest users
  },
  message: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'bot'],
    default: 'bot'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatLog', chatLogSchema);
