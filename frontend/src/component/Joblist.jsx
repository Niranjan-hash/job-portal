import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './joblist.css';

function Joblist({ showSearchbar, hideSearchbar }) {
  const [joblist, setJoblist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get("http://localhost:5000/api/jobs");
      setJoblist(response.data);
    } catch (err) {
      setError("Failed to load jobs. Please try again.");
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedJob) {
    return (
      <div className="full">
        <button 
          className="back-btn" 
          onClick={() => {
            setSelectedJob(null);
            showSearchbar();
          }}
        >
          ⬅ Back to Jobs
        </button>
        <div className="job_detail">
          <h1 className="title">{selectedJob.title}</h1>
          
          <p>
            <b>🏢 Company:</b> 
            <span>{selectedJob.company}</span>
          </p>
          
          <p>
            <b>📍 Location:</b> 
            <span>{selectedJob.location}</span>
          </p>
          
          <p>
            <b>🕐 Type:</b> 
            <span>{selectedJob.type}</span>
          </p>
          
          <p>
            <b>💰 Salary:</b> 
            <span className="salary-value">{selectedJob.salary || "Not specified"}</span>
          </p>
          
          <p><b>📝 Description:</b></p>
          <div className="description-content">
            {selectedJob.description}
          </div>
          
          <p>
            <b>📅 Posted:</b> 
            <span>{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
          </p>
          
          <button className="apply-btn">🚀 Apply Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="joblist-container">
      <div className="joblist-header">
        <h1>💼 Available Jobs</h1>
      </div>

      {loading && (
        <div className="loading-message">
          <div className="loader"></div>
          ⏳ Loading jobs...
        </div>
      )}
      
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <button 
        className="refresh-btn" 
        onClick={fetchJobs}
        disabled={loading}
      >
        🔄 Refresh Jobs
      </button>

      <div className="jobs-grid">
        {joblist.map(job => (
          <div
            className="job-card"
            key={job._id}
            onClick={() => {
              setSelectedJob(job);
              hideSearchbar();
            }}
          >
            <h3>{job.title}</h3>
            
            <div className="info-row">
              <span className="info-label">🏢 Company:</span>
              <span className="info-value">{job.company}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">📍 Location:</span>
              <span className="info-value">{job.location}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">🕐 Type:</span>
              <span className="info-value">{job.type}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">💰 Salary:</span>
              <span className="info-value salary-value">
                {job.salary || 'Not specified'}
              </span>
            </div>
            
            <button className="view-details-btn">
              👁️ View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Joblist;