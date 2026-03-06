const express = require('express');
const router = express.Router();
const path = require('path'); // Added path
const fs = require('fs'); // Added fs
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/uploadresume');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const Resume = require('../model/resumeschema'); // Capital R, singular

router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    // 1. Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file'
      });
    }

    // 2. Check if user already has a resume
    let existingResume = await Resume.findOne({ userId: req.userId });

    if (existingResume) {
      // 3. Update existing resume
      existingResume = await Resume.findOneAndUpdate(
        { userId: req.userId },
        {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          uploadDate: new Date() // Update timestamp
        },
        { new: true } // Return updated document
      );

      console.log('✅ Updated existing resume');

    } else{
        existingResume = new Resume({
            userId: req.userId ,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: req.file.path,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          uploadDate: new Date() // Update timestamp
        })
        
      await existingResume.save();
      console.log('✅ Created new resume');
    }
        // 5. Send success response
    res.status(200).json({
      success: true,
      message: existingResume ? 'Resume updated successfully' : 'Resume uploaded successfully',
      data: {
        id: existingResume._id,
        originalName: existingResume.originalName,
        fileName: existingResume.fileName,
        fileSize: existingResume.fileSize,
        uploadDate: existingResume.uploadDate
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // 6. Handle errors
    res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred'
    });
  }
});
// Add this route to your existing resume.js file

// GET user's resume info
router.get('/user-resume', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.userId });
        
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'No resume found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: resume._id,
                originalName: resume.originalName,
                fileName: resume.fileName,
                fileType: resume.fileType,
                fileSize: resume.fileSize,
                uploadDate: resume.uploadDate
            }
        });
    } catch (error) {
        console.error('Get resume error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/view/:filename', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({ 
            fileName: req.params.filename
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }

        const filePath = path.join(__dirname, '..', resume.filePath);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        if (resume.fileType === 'application/pdf' || resume.fileName.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
        } else {
            res.setHeader('Content-Type', resume.fileType || 'application/octet-stream');
        }
        res.setHeader('Content-Disposition', `inline; filename="${resume.originalName}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('View error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to view file'
        });
    }
});

async function extractTextFromFile(filePath, mimeType) {
    try {
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) return '';

        const dataBuffer = fs.readFileSync(fullPath);

        if (mimeType === 'application/pdf') {
            const data = await pdf(dataBuffer);
            return data.text || '';
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            filePath.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer: dataBuffer });
            return result.value || '';
        }
        return '';
    } catch (error) {
        console.error('Text extraction error:', error);
        return '';
    }
}

module.exports = router;
