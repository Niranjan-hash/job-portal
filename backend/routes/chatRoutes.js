const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const JobDetail = require('../model/jobdetail');
const ChatLog = require('../model/ChatLog');

// ============================================================
// AI-POWERED CHATBOT — GPT-4.1-mini + Hybrid Job DB Search
// ============================================================

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const SYSTEM_PROMPT = `You are an intelligent AI assistant integrated inside a MERN stack Job Portal platform.

Your role combines two responsibilities:

1. A general AI assistant similar to ChatGPT that can answer questions from many fields.
2. A professional job and career assistant that helps users search for jobs, prepare for interviews, and improve their skills.

Your responses must always be clear, helpful, and easy to understand.

---

PERFORMANCE RULE (HYBRID AI ARCHITECTURE)

To provide fast responses and reduce unnecessary AI usage, answers should follow this priority order:

1. Cached responses for frequently asked questions.
2. Database results for job search queries.
3. AI-generated responses only when the answer cannot be found in cache or database.

This architecture helps reduce response time, avoid rate limits, and reduce API cost.

---

INTENT DETECTION

Before answering any question, determine the user’s intent.

There are three main types of requests:

1. Knowledge or explanation questions
2. Job search requests
3. Career guidance questions

---

JOB SEARCH REQUESTS (DATABASE PRIORITY)

If the user asks for jobs, prioritize retrieving results from the job database instead of generating answers with AI.

Examples:

Find React developer jobs
Show data analyst jobs
Backend developer jobs in Chennai
Remote Node.js jobs

Respond on the FIRST line with: "[JOB_SEARCH: <search term>]".
The response should include:

Job title
Company name
Location

Encourage the user to view job details and apply.

---

FAQ QUESTIONS (CACHE PRIORITY)

If the question is a common platform question, answer using cached responses.

Examples:

How to apply for a job
How to login
How to reset password
How to upload a resume

These answers should be short, clear, and direct.

---

KNOWLEDGE QUESTIONS (AI FALLBACK)

If the question requires explanation or knowledge that is not available in the cache or database, generate a helpful explanation using AI.

Examples:

What is data analysis
Explain artificial intelligence
What is React
Explain REST API

Provide:

Definition
Explanation
Examples if helpful

Never show job listings for these questions.

---

CAREER GUIDANCE

If the user asks about career paths or skills required for a role, provide structured advice.

Examples:

How to become a data analyst
What skills are needed for a React developer
How to start a career in AI

Include:

Overview of the role
Required skills
Technologies to learn
Suggested learning roadmap

---

---

SKILL DETECTION AND CAREER RECOMMENDATION

When users mention their skills, technologies they know, or tools they have experience with, analyze those skills and suggest suitable career paths.

CAREER RECOMMENDATION PROCESS
Step 1 – Identify user skills mentioned.
Step 2 – Match skills with common industry roles.
Step 3 – Suggest suitable career paths.
Step 4 – Provide additional skills to improve chances.

Use this format:
Detected Skills: [List]
Recommended Careers: [Numbered List]
Skills to Improve: [List]

---

SKILL GAP ANALYSIS

If a user wants to become a specific professional, analyze the difference between current and required skills.
Format:
Current Skills: [List]
Missing Skills: [List]
Suggested Learning Path: [Numbered steps]

---

CAREER ROADMAP GENERATION

When users ask about a career field, provide a structured roadmap including:
- Role overview
- Core skills required
- Technologies to learn
- Recommended certifications
- Project ideas to experience

---

PORTFOLIO PROJECT SUGGESTIONS

Suggest useful projects based on skills. Explain what technologies should be used.
Example for MERN: Job portal, Task system.

---

ADVANCED CAREER ASSISTANCE

PROBLEM SOLVING RESPONSE FORMAT

When a user asks about a technical issue, system problem, programming error, or implementation challenge, respond using a structured problem-solving format.

Your response should include the following sections:

1. PROBLEM IDENTIFICATION
Clearly describe the problem based on the user's question. Explain what the issue is and in which situation it usually occurs.

2. CAUSE OF THE PROBLEM
Explain the possible reasons why the problem occurs. Identify common causes such as: Incorrect logic, Performance issues, Improper architecture, API limitations, Database inefficiency, Network delays. Provide a short explanation for each cause.

3. EFFICIENT METHOD TO SOLVE
Suggest the most efficient method to solve the problem. Explain why this method is better compared to other approaches. Focus on: Performance improvement, Reducing system load, Better architecture, Scalability.

4. STEP-BY-STEP SOLUTION
Provide clear steps to implement the solution. Each step should be easy to understand and follow.

5. IMPLEMENTATION EXAMPLE
If the problem is related to programming or system architecture, provide an example implementation using simple code snippets. The code should be clean and easy to understand.

6. FINAL SOLUTION SUMMARY
End the response with a short summary explaining the final solution and why it works.

---

RESPONSE STYLE

Your tone must be:

Friendly
Professional
Helpful

Use structured formatting when possible such as:

Headings
Bullet points
Step-by-step explanations

Avoid unnecessarily long responses. Keep it SHORT and CONCISE. Maximum 5-8 lines.

---

FINAL ROLE

You must behave as:

• A ChatGPT-like AI assistant capable of answering questions from any domain.
• A professional job portal assistant helping users find jobs, improve skills, and grow their careers.

Always prioritize fast and efficient responses by using cached answers and database results whenever possible before generating AI responses.`;

// ─── JOB SEARCH INTENT DETECTION ─────────────────────────────
const JOB_SEARCH_TRIGGER = '[JOB_SEARCH:';

async function fetchMatchingJobs(searchTerm) {
  try {
    const term = searchTerm.trim();
    const jobs = await JobDetail.find({
      $or: [
        { title: new RegExp(term, 'i') },
        { skills: new RegExp(term, 'i') },
        { location: new RegExp(term, 'i') },
      ]
    }).limit(5).lean();
    return jobs;
  } catch (err) {
    console.error('Job search error:', err);
    return [];
  }
}

function formatJobResults(jobs, searchTerm) {
  if (jobs.length === 0) {
    return `😔 No jobs found for "${searchTerm}" right now.\n\nTry browsing all listings on the Dashboard — new jobs are posted regularly! 🚀`;
  }
  return `🔍 Here are jobs matching **"${searchTerm}"**:\n\n` +
    jobs.map((j, i) => `${i + 1}. **${j.title}** at ${j.company} — 📍 ${j.location}`).join('\n') +
    `\n\n➡️ Go to your Dashboard to view full details and apply!`;
}

// ─── RETRY WITH EXPONENTIAL BACKOFF ───────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callOpenAIWithRetry(messages, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 300, // Reduced token limits for faster generation
        temperature: 0.5, // Lower temp for faster, more predictable completion
      });
      return completion.choices[0].message.content.trim();
    } catch (err) {
      const isRateLimit = err?.status === 429;
      const isLast = attempt === retries;

      if (isRateLimit && !isLast) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt}/${retries})`);
        await sleep(delay);
      } else {
        throw err; // rethrow for caller to handle
      }
    }
  }
}

// ─── LOCAL KB FALLBACK (when OpenAI is unavailable) ───────────
function localFallback(message) {
  const m = message.toLowerCase();
  if (m.includes('apply')) return `To apply for a job:\n📌 Dashboard → View Details → Click Apply → Submit\n\nTrack status in "Applied Jobs" section. ✅`;
  if (m.includes('resume')) return `To upload your resume:\n📌 Dashboard → Resume section → Upload PDF (max 5MB) → Save\n\n💡 A complete resume improves your AI match score!`;
  if (m.includes('login') || m.includes('sign in')) return `To login: Click "Login" → Enter email & password → Sign In.\n\nForgot password? Use the Reset Password link.`;
  if (m.includes('register') || m.includes('sign up')) return `To register: Click "Register" → Choose Job Seeker or Recruiter → Fill details → Verify OTP → Done! 🎉`;
  if (m.includes('mern')) return `MERN Stack skills:\n1. MongoDB 2. Express.js 3. React.js 4. Node.js 5. REST APIs 6. JWT Auth\n\nPath: JS → Node → Express → MongoDB → React → Projects`;
  if (m.includes('react') && !m.includes('job')) return `React.js is a JavaScript library by Meta for building UIs.\n\nKey concepts: Components, JSX, Props, State, Hooks (useState, useEffect), Virtual DOM, React Router.`;
  if (m.includes('javascript') || m.includes(' js ')) return `JavaScript is the language of the web.\n\nKey topics: Variables, Arrow Functions, Promises, Async/Await, DOM, ES6+, Closures, Event Loop.`;
  if (m.includes('node')) return `Node.js is a JS runtime for building servers.\n\nFeatures: Non-blocking I/O, npm packages, great for REST APIs and real-time apps.`;
  if (m.includes('interview')) return `Common interview tips:\n• Practice on LeetCode / HackerRank\n• Review data structures & algorithms\n• Build projects to show in interviews\n• Use STAR method for HR questions`;
  if (m.includes('frontend')) return `Frontend Developer skills:\nHTML5, CSS3, JavaScript (ES6+), React.js, REST APIs, Responsive Design, Git.\n\nPath: HTML → CSS → JS → React → Portfolio Projects`;
  if (m.includes('backend')) return `Backend Developer skills:\nNode.js, Express.js, MongoDB/PostgreSQL, JWT Auth, REST APIs, Cloud basics, Git.`;
  if (m.includes('hi') || m.includes('hello') || m.includes('hey')) return `👋 Hello! I'm your Career Assistant.\n\nI can help with job search, career guidance, tech questions & more!\n\nWhat would you like to know? 😊`;
  return `🤔 I'm having a moment — could you try rephrasing your question?\n\nYou can ask me about:\n• Finding jobs • Career roadmaps\n• Tech concepts • Interview prep • Resume tips`;
}


// ─── MAIN ROUTE ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // If no Groq API key, use local fallback immediately
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_api_key_here') {
      const fallback = localFallback(message);
      await ChatLog.create({ userId, message, response: fallback }).catch(() => {});
      return res.json({ success: true, response: fallback });
    }

    // ─── ⚡ FAST PATH 1: CACHED FAQ PRIORITY (<10ms) ───
    const lowerMsg = message.toLowerCase();
    const isFAQ = ['apply', 'resume', 'login', 'sign in', 'register', 'sign up', 'password'].some(kw => lowerMsg.includes(kw));
    
    if (isFAQ) {
      const fastResponse = localFallback(message);
      // ONLY return fast local response if it's NOT the generic fallback error
      if (!fastResponse.startsWith('🤔') && !fastResponse.startsWith('👋')) {
        await ChatLog.create({ userId, message, response: fastResponse }).catch(() => {});
        return res.json({ success: true, response: fastResponse });
      }
    }

    // ─── ⚡ FAST PATH 2: DIRECT DB SEARCH PRIORITY (<100ms) ───
    const isJobSearch = ['find', 'search', 'show', 'looking', 'job', 'developer', 'role'].some(kw => lowerMsg.includes(kw)) && lowerMsg.split(' ').length < 8;
    
    if (isJobSearch) {
      const dbJobs = await fetchMatchingJobs(message);
      if (dbJobs.length > 0) {
        const fastJobResponse = formatJobResults(dbJobs, message);
        await ChatLog.create({ userId, message, response: fastJobResponse }).catch(() => {});
        return res.json({ success: true, response: fastJobResponse });
      }
    }

    // ─── 3: AI FALLBACK (takes ~1-3s) ───
    // Build conversation messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-4).map(h => ({  // Reduced history size for speed
        role: h.type === 'user' ? 'user' : 'assistant',
        content: h.text
      })),
      { role: 'user', content: message }
    ];

    // Call Groq AI with automatic retry on rate limit
    let aiResponse;
    try {
      aiResponse = await callOpenAIWithRetry(openaiMessages, 3);
    } catch (err) {
      const groqErrorMessage = err?.error?.message || err?.message || "Unknown Groq API Error";
      // All retries failed — use local fallback instead of error message
      if (err?.status === 429) {
        console.warn('Groq rate limit / quota — passing error to user');
        return res.json({ success: true, response: `⚠️ Groq Error (429 Rate Limit/Quota):\n${groqErrorMessage}\n\n*Check your billing dashboard.*` });
      } else if (err?.status === 401) {
        return res.json({ success: true, response: `🔑 Invalid Groq API key. Check your GROQ_API_KEY in the .env file.\nDetails: ${groqErrorMessage}` });
      } else if (err?.status === 402) {
        return res.json({ success: true, response: `💳 Groq API quota exceeded.\nDetails: ${groqErrorMessage}` });
      } else {
        return res.json({ success: true, response: `❌ Groq Error:\n${groqErrorMessage}` });
      }
    }

    // If Groq failed after retries, use local KB fallback
    if (!aiResponse) {
      const fallback = localFallback(message);
      await ChatLog.create({ userId, message, response: fallback }).catch(() => {});
      return res.json({ success: true, response: fallback });
    }

    let finalResponse = aiResponse;

    // Hybrid job search: detect [JOB_SEARCH: term] from AI response
    if (aiResponse.includes(JOB_SEARCH_TRIGGER)) {
      const searchMatch = aiResponse.match(/\[JOB_SEARCH:\s*([^\]]+)\]/i);
      if (searchMatch) {
        const searchTerm = searchMatch[1].trim();
        const jobs = await fetchMatchingJobs(searchTerm);
        const jobBlock = formatJobResults(jobs, searchTerm);
        finalResponse = aiResponse.replace(/\[JOB_SEARCH:[^\]]+\]/i, '').trim();
        finalResponse = jobBlock + (finalResponse ? `\n\n${finalResponse}` : '');
      }
    }

    await ChatLog.create({ userId, message, response: finalResponse }).catch(() => {});
    res.json({ success: true, response: finalResponse });

  } catch (error) {
    console.error('Chat API Error:', error);
    const errorMessage = error?.message || 'Server crashed during response generation.';
    res.json({ success: true, response: `🚨 Internal Error: ${errorMessage}\n\nAre you sure you restarted the Node server after saving .env?` });
  }
});


module.exports = router;
