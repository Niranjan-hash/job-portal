const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Application = require('../model/application');
const Profile = require('../model/profile');
const JobDetail = require('../model/jobdetail');

// AI Scoring Logic (Fuzzy Keyword Matching)
const calculateAIScore = (profile, job, resume) => {
  const normalize = (str) => (str || "").toLowerCase().replace(/[/\\;:-]/g, ',').split(',').map(s => s.trim()).filter(s => s);
  
  const jobSkills = normalize(job.skills);
  const profileSkillsArr = normalize(profile.skills);
  const profileSkillsSearchStr = profileSkillsArr.join(" ");
  const resumeText = resume && resume.extractedText ? resume.extractedText.toLowerCase() : "";
  
  if (jobSkills.length === 0) return { score: 50, feedback: "No specific skills were listed for this job to compare against." };

  let matchCount = 0;
  jobSkills.forEach(jskill => {
    // 1. Direct contains check in Profile
    if (profileSkillsSearchStr.includes(jskill)) {
      matchCount++;
      return;
    }
    
    // 2. Direct contains check in Resume Text
    if (resumeText.includes(jskill)) {
       matchCount++;
       return;
    }
    
    // 3. Cross-check for partial matches
    const hasPartialMatch = profileSkillsArr.some(pskill => 
      pskill.includes(jskill) || jskill.includes(pskill)
    );
    
    if (hasPartialMatch) {
      matchCount += 0.8; // Partial credit
    }
  });

  const score = Math.min(100, Math.round((matchCount / jobSkills.length) * 100));
  
  let feedback = "";
  if (score > 80) {
    feedback = "Excellent match! Your profile aligns strongly with the core technical requirements for this role.";
  } else if (score > 50) {
    feedback = "Good match. You have several relevant skills, though adding more specifics to your profile could help.";
  } else if (score > 20) {
    feedback = "Fair match. You have some related skills, but consider highlighting more project experience in this area.";
  } else if (score > 0) {
    feedback = "Minimal match. Some common technical ground was found, but the core requirements differ.";
  } else {
    feedback = "No direct skill match found. Ensure your profile skills are explicitly listed to improve your score.";
  }

  return { score: score || 0, feedback };
};

// GET AI SCORE for an application
router.get('/score/:applicationId', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    // Only recruiter or the applicant can see the score
    const profile = await Profile.findOne({ userId: application.userId });
    const job = await JobDetail.findById(application.jobId);
    const ResumeSchema = require('../model/resumeschema');
    const resume = await ResumeSchema.findOne({ userId: application.userId });

    if (!profile || !job) {
      return res.status(404).json({ success: false, message: "Profile or Job not found" });
    }

    const { score, feedback } = calculateAIScore(profile, job, resume);
    
    // Update application with the score
    application.aiScore = score;
    application.aiFeedback = feedback;
    await application.save();

    res.json({
      success: true,
      score,
      feedback
    });
  } catch (error) {
    console.error("AI Scoring Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI score" });
  }
});

module.exports = router;
