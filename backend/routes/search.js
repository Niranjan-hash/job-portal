const express = require('express')
const JobDetail = require('../model/jobdetail')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { search, location } = req.query
    const filter = {}

    if (location) {
      filter.location = location
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i")
      filter.$or = [
        { title: regex },
        { company: regex },
        { type: regex },
        { salary: regex }
      ]
    }

    const jobs = await JobDetail.find(filter).lean()
    res.json(jobs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
