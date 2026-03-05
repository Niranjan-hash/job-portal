const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const createDirectory = () => {
  const dir = 'uploads/profile-pics';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

createDirectory();

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pics');
  },
  filename: function (req, file, cb) {
    const userId = req.userId || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, JPEG, PNG, GIF, and WEBP images are allowed'), false);
  }
  
  if (file.size > maxSize) {
    return cb(new Error('Image size must be less than 2MB'), false);
  }
  
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

module.exports = upload;