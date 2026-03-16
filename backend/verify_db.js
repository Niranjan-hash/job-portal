const mongoose = require('mongoose');
const JobDetail = require('./model/jobdetail');
const User = require('./model/newuser');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobportal';

async function verify() {
    await mongoose.connect(MONGO_URI);
    const jobs = await JobDetail.find({});
    console.log(`Total jobs: ${jobs.length}`);
    
    const users = await User.find({ userid: { $in: ['userofa12345@gmail.com', 'userofb12345@gmail.com'] } });
    
    for (const user of users) {
        const userJobs = jobs.filter(j => j.postedby.toString() === user._id.toString());
        console.log(`User: ${user.userid} (${user.userName}) - Jobs: ${userJobs.length}`);
        userJobs.slice(0, 5).forEach(j => {
            console.log(`  - ${j.title} @ ${j.company}`);
        });
    }
    
    await mongoose.disconnect();
}

verify();
