const express = require('express')
const JobDetail = require('../model/jobdetail')
const Profile = require('../model/profile')
const User = require('../model/newuser')
const { authenticateToken } = require('../middleware/auth')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { search, location, role, company, salary } = req.query
    const filter = {}

    // 1. Role / Title Search
    if (role || (search && search.trim())) {
      const query = role || search.trim();
      const regex = new RegExp(query, "i");
      // If role is specific, searching mostly title. If generic 'search', search multiple.
      if (role) {
        filter.title = regex;
      } else {
        filter.$or = [
          { title: regex },
          { company: regex },
          { type: regex },
          { salary: regex },
          { location: regex }
        ]
      }
    }

    // 2. Location (Direct match or regex)
    if (location && location.trim()) {
      filter.location = new RegExp(location.trim(), "i");
    }

    // 3. Company
    if (company && company.trim()) {
      filter.company = new RegExp(company.trim(), "i");
    }
    
    // 4. Salary
    if (salary && salary.trim()) {
       // Simple regex match for now, can be advanced range later
       filter.salary = new RegExp(salary.trim(), "i");
    }

    // 5. Date Filter (New Feature)
    const { dateFilter } = req.query;
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate, endDate;
      
      if (dateFilter === '24h') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
      } else if (dateFilter === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (dateFilter === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === '365d') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (startDate) {
        filter.createdAt = { $gte: startDate };
        if (endDate && dateFilter !== '24h') {
          filter.createdAt.$lt = endDate;
        }
      }
    }

    const jobs = await JobDetail.find(filter).lean()
    
    // Attach recruiter username to the payload
    const jobsWithRecruiters = await Promise.all(jobs.map(async (job) => {
        try {
            const user = await User.findById(job.postedby);
            return {
                ...job,
                postedbyName: user ? user.userName : 'Unknown User'
            };
        } catch (e) {
            return { ...job, postedbyName: 'Unknown User' };
        }
    }));

    res.json(jobsWithRecruiters)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// Secure user search route
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const query = search.trim();
      const regex = new RegExp(query, "i");
      filter.$or = [
        { name: regex },
        { email: regex }
      ];
    }

    // Project only safe fields
    const users = await Profile.find(filter)
      .select('name profilePic skills location bio projects')
      .lean();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router

