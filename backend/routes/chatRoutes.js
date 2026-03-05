const express = require('express');
const router = express.Router();
const JobDetail = require('../model/jobdetail');
const ChatLog = require('../model/ChatLog');
const { authenticateToken } = require('../middleware/auth');

// FAQ Predefined Responses
const FAQ = {
  apply: "To apply for a job, click on the 'View Details' button of any job listing and then click the 'Apply Now' button. You'll need to upload your resume if you haven't already.",
  login: "You can login by clicking the 'Login' button in the navigation bar using your registered email and password.",
  register: "To create an account, click 'Register' in the navigation bar and choose whether you are a Job Seeker or a Recruiter.",
  resume: "You can upload or update your resume in the 'Resume' section of your profile/dashboard.",
  track: "You can track your applications in the 'History' (for seekers) or 'Applied Jobs' section.",
  password: "If you forgot your password, please contact support or use the reset password link on the login page.",
  contact: "You can find recruiter contact information on the individual job details page under the 'Contact' section.",
  mern: "A MERN developer needs skills in MongoDB, Express.js, React.js, and Node.js. Focus on building projects that connect a frontend to a database.",
  frontend: "To become a frontend developer, focus on HTML, CSS, JavaScript, and a framework like React. Bootstrap or Tailwind CSS is also highly recommended.",
  backend: "To become a backend developer, learn Node.js, Express, and databases like MongoDB or PostgreSQL. Focus on API design and authentication."
};

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user.id : null;
    const lowerMessage = message.toLowerCase();
    let response = "";
    let foundMatch = false;

    // 1. Keyword Processing for Job Search
    const locations = ['chennai', 'bangalore', 'mumbai', 'delhi', 'pune', 'hyderabad', 'remote'];
    const roles = ['react', 'node', 'frontend', 'backend', 'fullstack', 'developer', 'python', 'java', 'mern'];
    
    let searchCriteria = {};
    
    locations.forEach(loc => {
      if (lowerMessage.includes(loc)) searchCriteria.location = new RegExp(loc, 'i');
    });
    
    roles.forEach(role => {
      if (lowerMessage.includes(role)) searchCriteria.title = new RegExp(role, 'i');
    });

    if (Object.keys(searchCriteria).length > 0) {
      const jobs = await JobDetail.find(searchCriteria).limit(3).lean();
      if (jobs.length > 0) {
        response = `I found some jobs for you: \n\n` + 
          jobs.map(j => `🔹 **${j.title}** at ${j.company} (${j.location})`).join('\n') +
          `\n\nClick on 'View Details' on the dashboard to see more.`;
        foundMatch = true;
      }
    }

    // 2. FAQ Handling
    if (!foundMatch) {
      if (lowerMessage.includes('apply')) { response = FAQ.apply; foundMatch = true; }
      else if (lowerMessage.includes('login')) { response = FAQ.login; foundMatch = true; }
      else if (lowerMessage.includes('register') || lowerMessage.includes('account')) { response = FAQ.register; foundMatch = true; }
      else if (lowerMessage.includes('resume')) { response = FAQ.resume; foundMatch = true; }
      else if (lowerMessage.includes('track') || lowerMessage.includes('status')) { response = FAQ.track; foundMatch = true; }
      else if (lowerMessage.includes('password')) { response = FAQ.password; foundMatch = true; }
      else if (lowerMessage.includes('contact')) { response = FAQ.contact; foundMatch = true; }
      else if (lowerMessage.includes('mern')) { response = FAQ.mern; foundMatch = true; }
      else if (lowerMessage.includes('frontend')) { response = FAQ.frontend; foundMatch = true; }
      else if (lowerMessage.includes('backend')) { response = FAQ.backend; foundMatch = true; }
    }

    // 3. Fallback / AI Placeholder
    if (!foundMatch) {
      response = "I'm sorry, I didn't quite catch that. I can help you find jobs (e.g., 'React jobs in Chennai') or answer questions about applications and account setup. What would you like to know?";
    }

    // Optional: Log the interaction
    await ChatLog.create({
      userId,
      message,
      response
    });

    res.json({ success: true, response });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
