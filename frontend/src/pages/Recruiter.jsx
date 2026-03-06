import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FiBriefcase, 
    FiMapPin, 
    FiCheckSquare, 
    FiStar, 
    FiAlignLeft, 
    FiPhone, 
    FiArrowLeft,
    FiCheckCircle,
    FiPlusSquare
} from 'react-icons/fi';
import './recruiter.css';

function Recruiter() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [job, setJob] = useState({
        title: '',
        company: '',
        location: '',
        type: 'full time',
        salary: '',
        skills: '',
        description: '',
        companyContact: ''
    });

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setJob({ ...job, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please login first');
            navigate('/');
            return;
        }

        try {
            console.log('Posting job:', job);
            
            const response = await axios.post(
                'http://localhost:5000/api/jobs',
                job,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setJob({
                        title: '',
                        company: '',
                        location: '',
                        type: 'full time',
                        salary: '',
                        skills: '',
                        description: '',
                        companyContact: ''
                    });
                }, 3000);
            } else {
                setError(response.data.message || 'Failed to post job');
            }

        } catch (error) {
            console.error('Error:', error.response?.data || error.message);
            setError(error.response?.data?.message || 'Failed to post job');
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recruiter-page">
            <div className="recruiter-container">
                <button 
                   onClick={() => navigate('/dashboard')} 
                   className="back-nav-btn"
                   style={{
                       position: 'absolute',
                       top: '30px',
                       left: '30px',
                       background: 'transparent',
                       border: '1px solid #e2e8f0',
                       color: 'var(--recruiter-text)',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '8px',
                       cursor: 'pointer',
                       fontSize: '0.85rem',
                       padding: '10px 18px',
                       borderRadius: '30px',
                       fontWeight: '700',
                       boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                       zIndex: 10
                   }}
                >
                    <FiArrowLeft /> Back to Dashboard
                </button>

                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                    </div>
                )}

                <div className="page-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 className="page-title" style={{ margin: 0, border: 'none', padding: 0 }}>Post New Job</h2>
                    <p style={{ color: '#94a3b8', marginTop: '10px' }}>Reach the best talent for your team</p>
                </div>

                {error && <div className="error-alert">{error}</div>}

                {success ? (
                    <div className="success-message">
                        <div className="success-icon"><FiCheckCircle /></div>
                        <p className="success-text">Job posted successfully!</p>
                        <div className="form-buttons">
                            <button 
                                className="submit-btn"
                                onClick={() => navigate('/history')}
                            >
                                Manage Job Postings
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="recruiter-form">
                        <div className="form-group">
                            <label className="form-label">Job Title</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    placeholder="Software Engineer"
                                    name="title"
                                    value={job.title}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Company Name</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    placeholder="Tech Corp"
                                    name="company"
                                    value={job.company}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    placeholder="Remote / City, Country"
                                    name="location"
                                    value={job.location}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Salary Range</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    placeholder="e.g. 80k - 120k"
                                    name="salary"
                                    value={job.salary}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Job Type</label>
                            <div className="radio-group">
                                <label className={`radio-option ${job.type === 'full time' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="full time"
                                        checked={job.type === 'full time'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    Full Time
                                </label>
                                <label className={`radio-option ${job.type === 'part time' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="part time"
                                        checked={job.type === 'part time'}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    Part Time
                                </label>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Required Skills</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    placeholder="React, Node.js, TypeScript..."
                                    name="skills"
                                    value={job.skills}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Job Description</label>
                            <textarea
                                placeholder="Describe the role and responsibilities..."
                                name="description"
                                value={job.description}
                                onChange={handleChange}
                                disabled={loading}
                                rows="5"
                                maxLength={500}
                                className="form-textarea"
                            />
                            <div className={`char-count ${job.description.length === 500 ? 'limit' : ''}`}>
                                {job.description.length}/500 characters
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">Contact Details</label>
                            <div className="input-container">
                                <textarea
                                    placeholder="Email or phone number for applicants..."
                                    name="companyContact"
                                    value={job.companyContact}
                                    onChange={handleChange}
                                    disabled={loading}
                                    rows="2"
                                    className="form-textarea"
                                    style={{ minHeight: '80px' }}
                                />
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-btn"
                            >
                                {loading ? 'Publishing...' : 'Publish Job Posting'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate('/history')}
                                className="history-btn"
                            >
                                View History
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Recruiter;
