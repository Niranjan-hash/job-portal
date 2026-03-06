require('dotenv').config(); // Load backend/.env
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../model/newuser'); // Path to your User model

const createAdmin = async () => {
  try {
    // 1. Connect to MongoDB using the URI from .env
    if (!process.env.MONGO_URI) {
        console.error("❌ MONGO_URI is not defined in your .env file.");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 2. Define your desired Admin Credentials here
    const adminId = 'admin';
    const plainPassword = 'password'; // Change this if you like
    
    // Check if it already exists
    const existingAdmin = await User.findOne({ userid: adminId });
    if (existingAdmin) {
      console.log(`⚠️ Admin user with userid '${adminId}' already exists.`);
      process.exit(0);
    }

    // 3. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // 4. Create the Admin User
    const newAdmin = new User({
      userName: 'System Administrator',
      userid: adminId,
      password: hashedPassword,
      isVerified: true,
      isAdmin: true,       // 👈 This makes the account an Admin
      emailNotifications: false,
      profilePublic: false
    });

    // 5. Save the user to the database
    await newAdmin.save();
    console.log(`🎉 Admin account successfully created!`);
    console.log(`=======================================`);
    console.log(`➡️ Admin Login ID : ${adminId}`);
    console.log(`➡️ Admin Password : ${plainPassword}`);
    console.log(`=======================================`);
    console.log(`(Please log in and optionally change this password later or delete this script once done)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
