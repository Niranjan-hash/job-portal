import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from "socket.io-client";
import '../component/joblist.css'; // Reusing joblist css for consistency

function AppliedJobs() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();

    // Socket Setup for Real-time Updates
    const token = localStorage.getItem('token');
    let socket = null;
    
    if (token) {
        socket = io("http://localhost:5000", {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('notification', (data) => {
            if (data.type === 'STATUS_UPDATE') {
                console.log("📝 Status update received:", data);
                
                // Update local list
                setApplications(prev => prev.map(app => 
                    app._id === data.data.applicationId 
                        ? { ...app, status: data.data.status } 
                        : app
                ));
                
                toast.info(`Update: ${data.message}`);
            }
        });
    }

    return () => {
        if (socket) socket.disconnect();
    };
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
         navigate('/');
         return;
      }

      const response = await axios.get("http://localhost:5000/api/applications/my-applications", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApplications(response.data.applications);
    } catch (err) {
      console.error(err);
      setError("Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="joblist-container" style={{ backgroundColor: 'var(--bg-main)', color: 'white', minHeight: '100vh', padding: '40px' }}>
      <div className="joblist-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ color: 'white' }}>My Applications</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn" style={{ background: 'transparent' }}>Back to Dashboard</button>
      </div>

      {loading && <div className="loading-message">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="jobs-grid">
        {applications.length === 0 && !loading && <p>You haven't applied to any jobs yet.</p>}
        
        {applications.map(app => (
          <div className="job-card" key={app._id}>
            <h3>{app.jobTitle}</h3>
            <div className="info-row">
              <span className="info-label">Company:</span>
              <span className="info-value">{app.company}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Applied:</span>
              <span className="info-value">{new Date(app.appliedAt).toLocaleDateString()}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`info-value status-badge ${app.status}`}>{app.status}</span>
                {app.aiFeedback && (
                  <span style={{
                    backgroundColor: app.aiScore >= 80 ? '#2ecc71' : app.aiScore >= 50 ? '#f1c40f' : '#e74c3c',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '800'
                  }}>
                    AI: {app.aiScore}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AppliedJobs;
