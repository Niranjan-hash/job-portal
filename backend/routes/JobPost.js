const express = require("express");
const router = express.Router();
const JobDetail = require("../model/jobdetail");
const authenticateToken =require('../middleware/auth')

// POST – Create Job
router.post("/", authenticateToken, async (req, res) => {
  console.log("POST /api/postjob");
  console.log("Body:", req.body);
  
  try {
    const { title, company, location, type, salary, description } = req.body;

    // Validate
    if (!title || !company || !location || !type) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields" 
      });
    }

    console.log("💾 Creating job...");
    
    const job = await JobDetail.create({
      title,
      company,
      location,
      type,
      salary: salary,
      description: description,
      postedby: req.user.id
    });
    
    console.log("✅ JOB SAVED! ID:", job._id);
    
    res.status(201).json({
      success: true,
      message: "Job saved successfully",
      jobId: job._id,
      job: job
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("Full error:", error);
    
    res.status(500).json({ 
      success: false,
      message: "Failed to save job",
      error: error.message 
    });
  }
});
router.get("/", async (req, res) => {
  const jobs = await JobDetail.find();
  res.json(jobs);
});
// GET – All Jobs
router.get("/my-jobs", authenticateToken, async (req, res) => {
  const jobs = await JobDetail.find({ postedby: req.user.id });
  res.json(jobs);
});
// PUT /api/jobs/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updatedJob = await JobDetail.findOneAndUpdate(
            { 
                _id: req.params.id,
                postedby: req.user.id
            },
            req.body,
            { 
                new: true,
                runValidators: true  // Validate data before saving
            }
        );
        
        if (!updatedJob) {
            return res.status(404).json({ 
                message: 'Job not found or you are not authorized' 
            });
        }
        
        res.json(updatedJob);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
 router.delete('/:id',authenticateToken,async(req,res)=>{
  try{
    const deletedjob = await JobDetail.findOneAndDelete(
      {
        _id:req.params.id,
        postedby:req.user.id
      }
    )
       if (!deletedjob) {
      return res.status(404).json({
        message: 'Job not found or you are not authorized'
      });
    }

    res.json({ message: 'Job deleted successfully' });

  }catch(error){
    console.log(error)
  }
 })
module.exports = router;