import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import './Resume.css';

function Resume() {
    const [loading, setLoading] = useState(false);
    const [resume, setResume] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userResume, setUserResume] = useState(null);
    const [generatingGeneralScore, setGeneratingGeneralScore] = useState(false);
    const [myScores, setMyScores] = useState([]);

    // Fetch user's existing resume on component mount
    useEffect(() => {
        fetchUserResume();
        fetchMyScores();
    }, []);

    useGSAP(() => {
        gsap.fromTo('.resume-card', 
            { opacity: 0, y: 30 }, 
            { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
        );
    }, []);

    useGSAP(() => {
        if (myScores.length > 0) {
            gsap.fromTo('.scores-list > div', 
                { opacity: 0, x: -20 }, 
                { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
            );
        }
    }, [myScores]);

    const fetchMyScores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/applications/my-applications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                // Show all applications to allow manual triggering of score
                setMyScores(response.data.applications);
            }
        } catch (err) {
            console.error("Failed to fetch compatibility scores", err);
        }
    };

    const handleGenerateScore = async (applicationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/ai/score/${applicationId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSuccess(`AI Analysis completed: ${response.data.score}%`);
                fetchMyScores(); // Refresh scores
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate AI score");
        }
    };

    const handleGenerateGeneralScore = async () => {
        try {
            setGeneratingGeneralScore(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/ai/general-score`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSuccess(`Resume structural analysis completed: ${response.data.score}%`);
                fetchUserResume(); // Refresh the resume data to show the new score
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to analyze resume structure");
        } finally {
            setGeneratingGeneralScore(false);
        }
    };

    const fetchUserResume = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(
                'http://localhost:5000/resume/user-resume',
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}` 
                    } 
                }
            );

            if (response.data.success && response.data.data) {
                setUserResume(response.data.data);
            }
        } catch (error) {
            console.log('No resume found');
        }
    };

    const handleChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (validateFile(file)) {
                setResume(file);
                setError('');
                setSuccess('');
            }
        }
    };

    const validateFile = (file) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        const maxSize = 5 * 1024 * 1024;
        
        if (!allowedTypes.includes(file.type)) {
            setError('Only PDF, DOC, DOCX, or TXT files are allowed');
            return false;
        }
        
        if (file.size > maxSize) {
            setError(`File too large! Maximum size is 5MB`);
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!resume) {
            setError('Please select a file first');
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const formData = new FormData();
            formData.append('resume', resume);
            
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Please login to upload resume');
                setLoading(false);
                return;
            }
            
            const response = await axios.post(
                'http://localhost:5000/resume/upload',
                formData,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}` 
                    } 
                }
            );
            
            if (response.data.success) {
                setSuccess('Resume uploaded successfully!');
                setResume(null);
                // Refresh the resume display
                fetchUserResume();
                
                // Clear file input
                const fileInput = document.querySelector('.file-input');
                if (fileInput) fileInput.value = '';
                
                setTimeout(() => {
                    setSuccess('');
                }, 5000);
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            setError('Upload failed. Please try again.');
        }
        
        setLoading(false);
    };

    const handleBrowseClick = () => {
        document.querySelector('.file-input').click();
    };

    const handleViewResume = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/resume/view/${userResume.fileName}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}` 
                    },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (error) {
            console.error('View error:', error);
            setError('Failed to open resume');
        }
    };

    const renderAiFeedback = (text) => {
        if (!text) return null;
        
        // Split by numbered sections like "1. **Section Name**"
        const sections = text.split(/(?=\d\.\s\*\*)/);
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {sections.map((section, index) => {
              // Extract header and content
              const headerMatch = section.match(/\d\.\s\*\*(.*?)\*\*/);
              const header = headerMatch ? headerMatch[1] : "";
              let content = section.replace(/\d\.\s\*\*(.*?)\*\*/, "").trim();
              
              // Handle bullet points
              const lines = content.split('\n').filter(line => line.trim());
              
              // Icon mapping for sections
              const getIcon = (h) => {
                if (h.includes('Strength')) return '✅';
                if (h.includes('Gap') || h.includes('Weakness') || h.includes('Critical')) return '❌';
                if (h.includes('Suggestion') || h.includes('Improvement') || h.includes('Roadmap')) return '💡';
                if (h.includes('Summary')) return '📝';
                if (h.includes('Score') || h.includes('Quality')) return '📊';
                return '🔹';
              };
    
              return (
                <div key={index} style={{ marginBottom: '5px' }}>
                  {header && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{getIcon(header)}</span>
                      <h4 style={{ margin: 0, color: '#0f172a', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {header}
                      </h4>
                    </div>
                  )}
                  <div style={{ paddingLeft: header ? '28px' : '0' }}>
                    {lines.map((line, lIdx) => {
                      const cleanLine = line.replace(/^\s*[-*•]\s+/, "").trim();
                      const isBullet = /^\s*[-*•]/.test(line);
                      
                      if (isBullet) {
                        return (
                          <div key={lIdx} style={{ display: 'flex', gap: '8px', marginBottom: '4px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#6366f1', fontWeight: 'bold' }}>•</span>
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', color: '#334155', fontWeight: '500' }}>
                              {cleanLine}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <p key={lIdx} style={{ margin: '0 0 8px 0', fontSize: '0.85rem', lineHeight: '1.6', color: '#334155', fontWeight: '500' }}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
    };

    return (
        <div className="resume-page">
        <div className="resume-container">
            <div className="resume-card">
                <div className="resume-header">
                    <h1 className="resume-title">Resume Manager</h1>
                    <p className="resume-subtitle">
                        Upload and manage your resume
                    </p>
                </div>

                {/* SHOW UPLOADED RESUME */}
                {userResume && (
                    <div className="current-resume-section">
                        <h3>Your Current Resume:</h3>
                        <div className="resume-display">
                            <div className="resume-info">
                                <div className="file-icon"></div>
                                <div className="file-details">
                                    <h4>{userResume.originalName}</h4>
                                    <p>
                                        {(userResume.fileSize / 1024).toFixed(2)} KB • 
                                        Uploaded: {new Date(userResume.uploadDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button 
                                className="view-resume-btn"
                                onClick={handleViewResume}
                            >
                                View Resume
                            </button>
                        </div>
                        
                        {/* GENERAL SCORE SECTION */}
                        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                               <h4 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>🤖</span> AI Resume Quality Analysis
                               </h4>
                               {userResume.generalAiScore > 0 ? (
                                  <span style={{
                                    backgroundColor: userResume.generalAiScore >= 80 ? '#2ecc71' : userResume.generalAiScore >= 50 ? '#f1c40f' : '#e74c3c',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontWeight: '800',
                                    fontSize: '0.9rem'
                                  }}>Score: {userResume.generalAiScore}%</span>
                               ) : (
                                  <button
                                    onClick={handleGenerateGeneralScore}
                                    disabled={generatingGeneralScore}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6366f1',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        cursor: generatingGeneralScore ? 'not-allowed' : 'pointer',
                                        opacity: generatingGeneralScore ? 0.7 : 1,
                                    }}
                                  >
                                    {generatingGeneralScore ? 'Analyzing...' : 'Generate Structural Score'}
                                  </button>
                               )}
                           </div>
                           
                           {userResume.generalAiFeedback && (
                               <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '12px', borderLeft: `5px solid ${userResume.generalAiScore >= 80 ? '#2ecc71' : userResume.generalAiScore >= 50 ? '#f1c40f' : '#e74c3c'}`, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                                  {renderAiFeedback(userResume.generalAiFeedback)}
                               </div>
                           )}
                           
                           {!userResume.generalAiFeedback && !generatingGeneralScore && (
                               <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                                   Get a standalone AI critique of your resume's formatting, metrics, and impact.
                               </p>
                           )}
                        </div>
                    </div>
                )}

                {/* AI COMPATIBILITY SCORES */}
                {myScores.length > 0 && (
                    <div className="compatibility-section" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: '#0f172a' }}>Job Compatibility Analysis</h3>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Based on your latest uploaded resume</span>
                        </div>
                        <div className="scores-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {myScores.map(scoreItem => (
                                <div key={scoreItem._id} style={{
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '15px', 
                                    backgroundColor: '#f8fafc', 
                                    borderRadius: '12px',
                                    borderLeft: `5px solid ${scoreItem.aiScore >= 80 ? '#2ecc71' : scoreItem.aiScore >= 50 ? '#f1c40f' : '#e74c3c'}`
                                }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#1e293b' }}>{scoreItem.jobTitle}</h4>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{scoreItem.company}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                        <div style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: '800', 
                                            color: scoreItem.aiScore >= 80 ? '#2ecc71' : scoreItem.aiScore >= 50 ? '#f1c40f' : '#e74c3c' 
                                        }}>
                                            {scoreItem.aiFeedback ? `${scoreItem.aiScore}%` : 'N/A'}
                                        </div>
                                        <button 
                                            onClick={() => handleGenerateScore(scoreItem._id)}
                                            style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#6366f1',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.65rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {scoreItem.aiFeedback ? 'Recalculate' : 'Analyze Now'}
                                        </button>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>AI Match Score</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Area */}
                <div 
                    className={`upload-drop-zone ${resume ? 'has-file' : ''}`}
                    onClick={handleBrowseClick}
                >
                    <input 
                        className="file-input"
                        type="file" 
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx,.txt"
                    />
                    
                    <div className="drop-zone-content">
                        <div className="upload-icon"></div>
                        
                        {resume ? (
                            <div className="file-selected">
                                <div className="file-name">{resume.name}</div>
                            </div>
                        ) : (
                            <>
                                <p className="drop-text">
                                    <span className="browse-link">Click to upload new resume</span>
                                </p>
                                <p className="drop-hint">
                                    Max 5MB
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <button 
                    className={`submit-btn ${loading ? 'loading' : ''} ${!resume ? 'disabled' : ''}`}
                    onClick={handleSubmit}
                    disabled={loading || !resume}
                >
                    {loading ? 'Uploading...' : 'Upload New Resume'}
                </button>
            </div>
        </div>
        </div>
    );
}

export default Resume;