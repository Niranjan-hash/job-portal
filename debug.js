// // debug-job.js
// require('dotenv').config();
// const mongoose = require('mongoose');
// const express = require('express');
// const app = express();

// console.log("🔍 DEBUG: Starting job save test...");
// console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Found" : "❌ Missing");

// async function testJobSave() {
//     try {
//         // 1. Connect to MongoDB
//         console.log("\n1. Connecting to MongoDB...");
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log("✅ Connected to MongoDB");
        
//         // 2. Define a SIMPLE schema
//         console.log("\n2. Creating simple schema...");
//         const simpleSchema = new mongoose.Schema({
//             title: String,
//             company: String,
//             location: String,
//             type: String,
//             salary: String,
//             description: String,
//             postedby: String
//         }, { timestamps: true });
        
//         const SimpleJob = mongoose.model('SimpleJob', simpleSchema);
        
//         // 3. Check current jobs
//         console.log("\n3. Checking current jobs...");
//         const countBefore = await SimpleJob.countDocuments({});
//         console.log(`   Jobs before: ${countBefore}`);
        
//         // 4. Try to save a job
//         console.log("\n4. Saving test job...");
//         const testJob = new SimpleJob({
//             title: "Test Developer",
//             company: "Test Corp",
//             location: "Remote",
//             type: "full time",
//             salary: "$100,000",
//             description: "Test job",
//             postedby: "test-user-123"
//         });
        
//         const savedJob = await testJob.save();
//         console.log("✅ Job saved!");
//         console.log(`   Job ID: ${savedJob._id}`);
        
//         // 5. Check again
//         const countAfter = await SimpleJob.countDocuments({});
//         console.log(`\n5. Jobs after: ${countAfter}`);
        
//         if (countAfter > countBefore) {
//             console.log("🎉 SUCCESS: Job was saved to database!");
            
//             // Show all jobs
//             const allJobs = await SimpleJob.find({});
//             console.log("\n📋 All jobs in 'simplejobs' collection:");
//             allJobs.forEach(job => {
//                 console.log(`   - ${job.title} (${job._id})`);
//             });
//         } else {
//             console.log("❌ FAILED: Job count didn't increase!");
//         }
        
//         // 6. Clean up
//         await SimpleJob.deleteOne({ _id: savedJob._id });
//         console.log("\n6. Cleaned up test job");
        
//         // 7. Test your actual model
//         console.log("\n7. Testing your actual JobDetail model...");
//         try {
//             const JobDetail = require('./backend/model/jobdetail');
//             const jobDetailCount = await JobDetail.countDocuments({});
//             console.log(`   Jobs in 'jobdetails' collection: ${jobDetailCount}`);
            
//             // Try to save with your model
//             const testJob2 = new JobDetail({
//                 title: "Test 2",
//                 company: "Test 2",
//                 location: "Remote",
//                 type: "full time",
//                 salary: "$90,000",
//                 description: "Test",
//                 postedby: "test-456"
//             });
            
//             await testJob2.save();
//             console.log("✅ Your model works!");
//             await JobDetail.deleteOne({ _id: testJob2._id });
            
//         } catch (modelError) {
//             console.error("❌ Your model error:", modelError.message);
//         }
        
//         // 8. Disconnect
//         await mongoose.disconnect();
//         console.log("\n✅ Debug completed!");
        
//     } catch (error) {
//         console.error("\n❌ ERROR:", error.message);
//         console.error("Stack:", error.stack);
//     }
// }

// testJobSave();