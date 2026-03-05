
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const uploadDir = 'uploads/resumes';


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created directory: ${uploadDir}`);
}


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
   
    const fileExt = path.extname(file.originalname);
    

    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
      let userId = 'unknown';
    if (req.userId) {
        userId = req.userId;
    } else if (req.body && req.body.userId) {
        userId = req.body.userId;
    } else if (req.query && req.query.userId) {
        userId = req.query.userId;
    }
    const newFilename = `${req.userId}-${timestamp}-${random}${fileExt}`;
    
    cb(null, newFilename);
  }
});


const fileFilter = function(req, file, cb) {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
  }
};


const limits = {
  fileSize: 5 * 1024 * 1024,
  files: 1
};


const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = upload;