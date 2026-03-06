import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Resume.css';

function Resume() {
    const [loading, setLoading] = useState(false);
    const [resume, setResume] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userResume, setUserResume] = useState(null);
    const [myScores, setMyScores] = useState([]);

    // Fetch user's existing resume on component mount
    useEffect(() => {
        fetchUserResume();
        fetchMyScores();
    }, []);

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