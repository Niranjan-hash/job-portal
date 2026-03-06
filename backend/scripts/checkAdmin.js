require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../model/newuser');

const checkAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI is not defined in your .env file.");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    
    const admins = await User.find({ isAdmin: true });
    console.log("Admins found:", admins);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    process.exit(1);
  }
};

checkAdmin();
