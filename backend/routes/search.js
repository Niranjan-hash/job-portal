const express = require('express')
const JobDetail = require('../model/jobdetail')
const Profile = require('../model/profile')
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

    const jobs = await JobDetail.find(filter).lean()
    res.json(jobs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

router.get('/users', async (req, res) => {
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

    const users = await Profile.find(filter).lean();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
