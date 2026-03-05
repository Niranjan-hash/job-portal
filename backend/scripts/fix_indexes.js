require("dotenv").config();
const mongoose = require("mongoose");

async function fix() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected");

    const profileCollection = mongoose.connection.collection('profiles');
    
    console.log("Attempting to drop 'username_1' index...");
    try {
      await profileCollection.dropIndex('username_1');
      console.log("✅ Dropped 'username_1' index");
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log("ℹ️ Index 'username_1' already gone.");
      } else {
        console.error("❌ Error dropping username_1:", err.message);
      }
    }

    console.log("Attempting to drop 'email_1' index...");
    try {
      await profileCollection.dropIndex('email_1');
      console.log("✅ Dropped 'email_1' index");
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log("ℹ️ Index 'email_1' already gone.");
      } else {
        console.error("❌ Error dropping email_1:", err.message);
      }
    }

    console.log("\nDone. You can now try uploading/saving again.");
    process.exit(0);
  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    process.exit(1);
  }
}

fix();
