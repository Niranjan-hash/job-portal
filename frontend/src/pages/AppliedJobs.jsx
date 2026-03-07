import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { io } from "socket.io-client";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { FiLoader } from 'react-icons/fi';
import '../component/joblist.css'; // Reusing joblist css for consistency

function AppliedJobs() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingScore, setGeneratingScore] = useState(null);
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

  useGSAP(() => {
    if (!loading && applications.length > 0) {
      gsap.fromTo('.job-card', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [loading, applications]);

  const handleGenerateScore = async (applicationId) => {
    try {
      setGeneratingScore(applicationId);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/ai/score/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`AI Score generated: ${response.data.score}%`);
        setApplications(prev => prev.map(app => 
          app._id === applicationId 
            ? { ...app, aiScore: response.data.score, aiFeedback: response.data.feedback } 
            : app
        ));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate AI score");
    } finally {
      setGeneratingScore(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#2ecc71'; 
    if (score >= 50) return '#f1c40f'; 
    return '#e74c3c'; 
  };

  return (
    <div className="joblist-container" style={{ backgroundColor: 'var(--bg-main)', color: 'white', minHeight: '100vh', padding: '40px' }}>
      <div className="joblist-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ color: 'white' }}>My Applications</h1>
        <button onClick={() => navigate('/dashboard')} className="back-btn" style={{ background: 'transparent' }}>Back to Dashboard</button>
      </div>

      {loading && <div className="loading-message">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="applied-jobs-list" style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {applications.length === 0 && !loading && <p>You haven't applied to any jobs yet.</p>}
        
        {applications.map(app => (
          <div className="job-card" key={app._id} style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: '30px', 
            alignItems: 'stretch',
            width: '100%',
            padding: '25px',
            textAlign: 'left',
            flexWrap: 'wrap',
            minHeight: '280px'
          }}>
            {/* Left side: Job Info */}
            <div style={{ flex: '0 0 300px' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '1.4rem', color: 'var(--primary)' }}>{app.jobTitle}</h3>
              <div className="info-row" style={{ marginBottom: '10px' }}>
                <span className="info-label" style={{ opacity: 0.7, fontSize: '0.9rem' }}>Company:</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{app.company}</span>
              </div>
              <div className="info-row" style={{ marginBottom: '10px' }}>
                <span className="info-label" style={{ opacity: 0.7, fontSize: '0.9rem' }}>Applied:</span>
                <span className="info-value">{new Date(app.appliedAt).toLocaleDateString()}</span>
              </div>
              <div className="info-row" style={{ marginBottom: '20px' }}>
                <span className="info-label" style={{ opacity: 0.7, fontSize: '0.9rem' }}>Status:</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
                  <span className={`info-value status-badge ${app.status}`} style={{ margin: 0 }}>{app.status}</span>
                  {app.aiScore ? (
                    <span style={{
                      backgroundColor: getScoreColor(app.aiScore),
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '800'
                    }}>
                      AI Score: {app.aiScore}%
                    </span>
                  ) : null}
                </div>
              </div>

              {!app.aiFeedback && (
                <button 
                  onClick={() => handleGenerateScore(app._id)}
                  disabled={generatingScore === app._id}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    cursor: generatingScore === app._id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {generatingScore === app._id ? "Processing Analysis..." : "Generate AI Analysis"}
                </button>
              )}
            </div>
            
            {/* Right side: AI Feedback */}
            <div style={{ flex: '1', minWidth: '0' }}>
              {app.aiFeedback ? (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  height: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🤖</span>
                    <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem', fontWeight: '800' }}>AI Resume Quality Analysis</h4>
                  </div>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    paddingRight: '10px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e0 transparent'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.95rem', 
                      color: '#000000', 
                      fontWeight: '500', 
                      lineHeight: '1.7', 
                      whiteSpace: 'pre-line' 
                    }}>
                      {app.aiFeedback}
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '2px dashed rgba(255, 255, 255, 0.1)',
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textAlign: 'center'
                }}>
                  <div>
                    <FiLoader style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>Match analysis will appear here once generated.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AppliedJobs;
