require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const { authenticatesocket } = require('./middleware/auth'); // ✅ FIX: lowercase

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
  }
});

io.use(authenticatesocket); // ✅ Use correct function name

const connectedUsers = new Map(); // ✅ Fix: Map not map

io.on('connection', (socket) => {
  console.log('🎉 NEW SOCKET CONNECTION!');
  console.log('- Socket ID:', socket.id);
  console.log('- User ID:', socket.userId || 'Not set');
  
  if (socket.userId) { // ✅ Fix: userId not userid
    connectedUsers.set(socket.userId, socket.id);
    console.log(`📝 Added ${socket.userId} to connected users`);
    
    socket.join(`user_${socket.userId}`);
    console.log(`🚪 User joined room: user_${socket.userId}`);
    
    // ✅ Fix: socket.emit not io.emmit
    socket.emit('welcome', {
      message: "You're connected to the socket",
      userId: socket.userId, // ✅ Fix: userId not userid
      socketId: socket.id, // ✅ Fix: socket.id not Socket.id
      timestamp: new Date()
    });
  }
  
  // ✅ Fix: Moved inside connection handler
  socket.on('disconnect', () => {
    console.log(`👋 Socket disconnected: ${socket.id}`);
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`🗑️ Removed ${socket.userId} from connected users`);
    }
  });
  
  // Add test endpoint
  socket.on('test', (data) => {
    console.log('Test from', socket.userId, ':', data);
    socket.emit('test-response', {
      message: `Hello ${socket.userId || 'anonymous'}!`,
      yourData: data
    });
  });
});

// Debug middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n📥 [${timestamp}] [${req.method}] ${req.url}`);
  console.log(`   📍 Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`   🔑 Auth: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  next();
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Content-Disposition'],
  exposedHeaders: ['Content-Disposition']
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Content-Disposition');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      return res.status(204).end();
    } else {
      return res.status(403).json({
        success: false,
        message: 'CORS: Origin not allowed'
      });
    }
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const createUploadsDir = () => {
  const dir = 'uploads/profile-pics';
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
};
createUploadsDir();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    // Drop stale unique indexes from previous schema versions
    const profileCollection = mongoose.connection.collection('profiles');
    const indexesToDrop = ['email_1', 'username_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        await profileCollection.dropIndex(indexName);
        console.log(`✅ Dropped stale index: ${indexName}`);
      } catch (err) {
        if (err.codeName !== 'IndexNotFound') {
          console.warn(`⚠️ Could not drop ${indexName}:`, err.message);
        }
      }
    }
  })
  .catch(err => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

const authRoutes = require("./routes/authroutes");
const jobRouter = require("./routes/JobPost");
const searchRouter = require("./routes/search");
const profileRouter = require('./routes/createprofile');
const resumeRoutes = require('./routes/resume');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminroutes');// ✅ Removed unused { Socket } import

app.use("/search", searchRouter);
app.use("/user", authRoutes);
app.use("/api/jobs", jobRouter);
app.use("/profile", profileRouter);
app.use("/resume", resumeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'Server is running',
    origin: req.headers.origin,
    allowedOrigins: allowedOrigins
  });
});

// Register Socket.io for routes
app.set('socketio', io);
app.set('connectedUsers', connectedUsers);

// Register Application Routes
const applicationRoutes = require('./routes/applicationRoutes');
app.use('/api/applications', applicationRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

app.get('/debug/uploads', (req, res) => {
  const uploadsDir = 'uploads/profile-pics';
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    res.json({
      directory: uploadsDir,
      fileCount: files.length,
      files: files.slice(0, 10)
    });
  } else {
    res.json({ error: 'Uploads directory does not exist' });
  }
});

app.post('/test-upload', (req, res) => {
  console.log('✅ Test upload endpoint hit');
  console.log('   Origin:', req.headers.origin);
  console.log('   Headers:', req.headers);
  
  res.json({ 
    success: true, 
    message: 'Test endpoint working',
    origin: req.headers.origin
  });
});

app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err.message);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      success: false, 
      message: 'CORS Error: Origin not allowed',
      allowedOrigins: allowedOrigins,
      yourOrigin: req.headers.origin
    });
  }
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    requestedUrl: req.url
  });
});

// ✅ FIX: server.listen not app.listen
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads/`);
  console.log(`🔧 Debug uploads: http://localhost:${PORT}/debug/uploads`);
  console.log(`🧪 Test endpoint: POST http://localhost:${PORT}/test-upload`);
  console.log(`\n✅ CORS configured for:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
});

// Export io to be used in routes
// Export io to be used in routes
module.exports = { app, server, io, connectedUsers };
