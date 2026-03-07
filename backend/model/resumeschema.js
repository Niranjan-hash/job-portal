const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: {  // camelCase, not lowercase
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'  // Optional: reference to User model
    },
    originalName: {  // Capital N
        type: String,
        required: true
    },
    fileName: {  // Capital N
        type: String,
        required: true
    },
    filePath: {  // Capital P
        type: String,
        required: true
    },
    fileType: {  // Capital T
        type: String,
        required: true
    },
    fileSize: {  // Capital S and Number type
        type: Number,
        required: true
    },
    extractedText: {  // Capital T
        type: String,
        default: ''
    },
    generalAiScore: {
        type: Number,
        default: 0
    },
    generalAiFeedback: {
        type: String,
        default: ''
    },
    uploadDate: {  // Better name than 'update'
        type: Date,
        default: Date.now
    }
});

// Create and export the MODEL (not schema)
const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;  // Export the MODEL