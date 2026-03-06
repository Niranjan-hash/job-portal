import React, { useState } from 'react';
import axios from 'axios';
import { FiMapPin, FiBriefcase } from 'react-icons/fi';
import './joblist.css';

function Joblist({ jobs, loading, error, showSearchbar, hideSearchbar }) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  const applyForJob = async (jobId) => {
    try {
      setApplying(true);
      setApplyMsg('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setApplyMsg('Please login to apply');
        return;
      }

      // Fetch user's resume details first
      let resumeUrl = '';
      try {
        const resumeRes = await axios.get('http://localhost:5000/resume/user-resume', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resumeRes.data.success && resumeRes.data.data) {
          resumeUrl = resumeRes.data.data.fileName;
        }
      } catch (err) {
        console.log('No resume found to attach');
      }

      const response = await axios.post(
        `http://localhost:5000/api/applications/apply/${jobId}`,
        { resumeUrl }, 
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setApplyMsg('Applied successfully!');
      }
    } catch (err) {
      console.error(err);
      setApplyMsg((err.response?.data?.message || 'Failed to apply'));
    } finally {
      setApplying(false);
    }
  };

  if (selectedJob) {
    return (
      <div className="full">
        <button 
          className="back-btn" 
          onClick={() => {
            setSelectedJob(null);
            setApplyMsg('');
            showSearchbar();
          }}
        >
          ← Back to Jobs
        </button>
        <div className="job_detail">
          <h1>{selectedJob.title}</h1>
          <div className="company-name" style={{ fontSize: '1.2rem', color: '#000000', marginTop: '-20px', fontWeight: '600' }}>{selectedJob.company}</div>
          
          <div className="job-meta-grid">
            <div className="meta-item">
              <b>Location</b>
              <span>{selectedJob.location}</span>
            </div>
            <div className="meta-item">
              <b>Job Type</b>
              <span>{selectedJob.type}</span>
            </div>
            <div className="meta-item">
              <b>Salary Range</b>
              <span className="salary-value">{selectedJob.salary || "Not specified"}</span>
            </div>
            <div className="meta-item">
              <b>Posted On</b>
              <span>{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {selectedJob.skills && (
            <div className="skills-section">
              <b style={{ display: 'block', marginBottom: '10px', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', color: '#000000' }}>Required Skills</b>
              <div className="skills-tags">
                {selectedJob.skills.split(',').map((skill, i) => (
                  <span key={i} className="skill-tag">{skill.trim()}</span>
                ))}
              </div>
            </div>
          )}
          
          <div className="description-section">
             <b style={{ display: 'block', marginBottom: '10px', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', color: '#000000' }}>Job Description</b>
             <div className="description-content">
               {selectedJob.description}
             </div>
          </div>
          
          {selectedJob.companyContact && (
            <div className="contact-info" style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <b style={{ color: '#000000', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recruiter Contact</b>
              <div style={{ fontWeight: '700', marginTop: '5px', color: '#000000' }}>{selectedJob.companyContact}</div>
            </div>
          )}

          <div className="action-area" style={{ marginTop: '20px' }}>
             <button 
                className="apply-btn" 
                onClick={() => applyForJob(selectedJob._id)}
                disabled={applying}
              >
                {applying ? 'Applying...' : 'Apply for this Position'}
              </button>
              {applyMsg && <p className="apply-msg" style={{ marginTop: '15px', fontWeight: '600', color: applyMsg.includes('success') ? 'var(--accent)' : 'var(--danger)' }}>{applyMsg}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="joblist-container">
      {/* Removed "Available Jobs" Header as requested */}
      
      {loading && (
        <div className="loading-message">
          <div className="loader"></div>
          Loading jobs...
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && jobs.length === 0 && (
         <div style={{textAlign: 'center', margin: '20px', color: '#666'}}>
           No jobs found. Try adjusting your search.
         </div>
      )}

      <div className="jobs-grid">
        {jobs.map(job => (
          <div
            className="job-card"
            key={job._id}
            onClick={() => {
              setSelectedJob(job);
              hideSearchbar();
            }}
          >
            <h3 onClick={(e) => {
              e.stopPropagation();
              if (onSearchChange) onSearchChange(job.title);
            }}>{job.title}</h3>
            
            <div className="company-name">{job.company}</div>

            <div className="info-row">
              <FiMapPin /> {job.location}
            </div>
            
            <div className="info-row">
              <FiBriefcase /> {job.type}
            </div>
            
            <div className="salary-tag">
              {job.salary || 'Salary Not Specified'}
            </div>

            {job.skills && (
              <div className="card-skills">
                {job.skills.split(',').slice(0, 3).map((skill, i) => (
                  <span key={i} className="skill-tag skill-tag-sm">{skill.trim()}</span>
                ))}
              </div>
            )}
            
            <button className="view-details-btn">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Joblist;