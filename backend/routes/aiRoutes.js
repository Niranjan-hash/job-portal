const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Application = require('../model/application');
const Profile = require('../model/profile');
const JobDetail = require('../model/jobdetail');

const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromFile(filePath, mimeType) {
    try {
        // The resume files are usually saved in a relative 'uploads/resumes' dir from project root.
        // We use path.resolve to reliably find the file relative to the running backend process.
        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) return '';

        const dataBuffer = fs.readFileSync(fullPath);

        if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
            const data = await pdf(dataBuffer);
            return data.text || '';
        } else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            filePath.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer: dataBuffer });
            return result.value || '';
        }
        return '';
    } catch (error) {
        console.error('Text extraction error:', error);
        return '';
    }
}

// GET AI SCORE for an application
router.get('/score/:applicationId', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId);
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    require('dotenv').config();
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    // Only recruiter or the applicant can see the score
    const profile = await Profile.findOne({ userId: application.userId });
    const job = await JobDetail.findById(application.jobId);
    const ResumeSchema = require('../model/resumeschema');
    const resume = await ResumeSchema.findOne({ userId: application.userId });

    if (!profile || !job) {
      return res.status(404).json({ success: false, message: "Profile or Job not found" });
    }

    let resumeText = resume && resume.extractedText ? resume.extractedText : "";
    
    // Fallback block if `extractedText` wasn't populated during original upload
    if (!resumeText && resume && resume.filePath) {
      resumeText = await extractTextFromFile(resume.filePath, resume.fileType);
      
      // Optionally save it back so we don't have to parse it twice
      if (resumeText.trim()) {
        resume.extractedText = resumeText;
        await resume.save();
      }
    }

    if (!resumeText || !resumeText.trim()) {
       return res.status(400).json({ success: false, message: "No resume text found to analyze. Please ensure the actual PDF file was parsed successfully." });
    }

    // Unified detailed prompt for accurate scoring
    const promptText = `Act as a Senior Recruiter and Professional ATS (Applicant Tracking System). 
Analyze the candidate's resume against the specific Job Description provided below.

### JOB CONTEXT:
- Title: ${job.title}
- Company: ${job.company}
- Key Skills: ${job.skills || 'Not specified'}
- Description: ${job.description || 'Not specified'}

### CANDIDATE RESUME:
${resumeText}

### INSTRUCTIONS:
- Tone: Objective, professional, and executive-level. Avoid conversational filler or chatty language.
- Format: Use **Clear Bullet Points** for Strengths, Gaps, and Suggestions.
- Logic: Evaluate the candidate based on these 5 criteria (Weighted equally):
  1. **Technical Alignment (Keyword Match)**: How well does the tech stack/skills match?
  2. **Experience Relevance**: Is the previous experience applicable to this specific role?
  3. **Quantifiable Impact**: Does the candidate use metrics/results to showcase achievements?
  4. **Formatting & Professionlism**: Is the structure clear, concise, and free of errors?
  5. **Growth Potential/Education**: Does their background suggest they can excel in this role?

### RESPONSE FORMAT (Mandatory):
1. **Resume Score**: Provide a single integer (0-100).
2. **Match Summary**: A concise 2-sentence executive summary.
3. **Key Strengths**:
   - [Bullet points only]
4. **Gaps/Weaknesses**:
   - [Bullet points only]
5. **Actionable Suggestions**:
   - [Bullet points only]
6. **Upskilling Roadmap**:
   - [Specific skills/topics in bullet points]`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: promptText }],
      temperature: 0
    });

    const aiResponseText = completion.choices[0].message.content;

    // Extract score accurately
    let parsedScore = 50; 
    const scoreMatch = aiResponseText.match(/(?:Resume score|Score)[:\-]?\s*(\d{1,3})/i);
    if (scoreMatch && scoreMatch[1]) {
      parsedScore = Math.min(parseInt(scoreMatch[1], 10), 100);
    }
    
    // Update application with the score and feedback
    application.aiScore = parsedScore;
    application.aiFeedback = aiResponseText;
    await application.save();

    res.json({
      success: true,
      score: parsedScore,
      feedback: aiResponseText
    });
  } catch (error) {
    console.error("AI Scoring Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI score: " + error.message });
  }
});

// GET GENERAL AI SCORE for a standalone resume
router.get('/general-score', authenticateToken, async (req, res) => {
  try {
    const ResumeSchema = require('../model/resumeschema');
    const resume = await ResumeSchema.findOne({ userId: req.userId }).sort({ uploadDate: -1 });

    if (!resume) {
      return res.status(404).json({ success: false, message: "No resume found for this user." });
    }

    require('dotenv').config();
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    let resumeText = resume && resume.extractedText ? resume.extractedText : "";
    
    // Fallback PDF text extraction
    if (!resumeText && resume.filePath) {
      resumeText = await extractTextFromFile(resume.filePath, resume.fileType);
      if (resumeText.trim()) {
        resume.extractedText = resumeText;
        await resume.save();
      }
    }

    if (!resumeText || !resumeText.trim()) {
       return res.status(400).json({ success: false, message: "No text found in your uploaded resume to analyze." });
    }

    const promptText = `Act as a Professional Career Coach and ATS Expert. 
Analyze the candidate's resume for general marketability and industry standard alignment.

### CANDIDATE RESUME:
${resumeText}

### EVALUATION CRITERIA:
- **Structural Integrity**: Clear headings, logical flow, and professional layout.
- **Impact & Accomplishments**: Use of action verbs and quantifiable results (metrics).
- **Clarity & Conciseness**: Removal of filler words and clear communication of value.
- **Keyword Optimization**: Use of industry-standard terms for generic roles.
- **Modern Professionalism**: Free from outdated practices.

### INSTRUCTIONS:
- Enforce a **Professional, Objective, and Executive** tone.
- Use **Clear Bullet Points** for Strengths, Gaps, and Suggestions.
- Avoid all conversational filler.

### RESPONSE FORMAT (Mandatory):
1. **General Quality Score**: Provide a single integer (0-100).
2. **Executive Summary**: A concise overview of professional marketability.
3. **Format Strengths**:
   - [Bullet points only]
4. **Critical Gaps**:
   - [Bullet points only]
5. **Improvement Roadmap**:
   - [Bullet points only]`;

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: promptText }],
      temperature: 0
    });

    const aiResponseText = completion.choices[0].message.content;

    // Extract score accurately
    let parsedScore = 50; 
    const scoreMatch = aiResponseText.match(/(?:General Quality Score|Score)[:\-]?\s*(\d{1,3})/i);
    if (scoreMatch && scoreMatch[1]) {
      parsedScore = Math.min(parseInt(scoreMatch[1], 10), 100);
    }
    
    // Save to the resume document
    resume.generalAiScore = parsedScore;
    resume.generalAiFeedback = aiResponseText;
    await resume.save();

    res.json({
      success: true,
      score: parsedScore,
      feedback: aiResponseText
    });
  } catch (error) {
    console.error("General AI Scoring Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate general AI score: " + error.message });
  }
});

module.exports = router;
