import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        type: '',
        salary: '',
        description: ''
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
                'http://localhost:5000/api/postjob',
                job,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Response:', response.data);

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setJob({
                        title: '',
                        company: '',
                        location: '',
                        type: '',
                        salary: '',
                        description: ''
                    });
                }, 2000);
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
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner"></div>
                    </div>
                )}

                <h2 className="page-title">📝 Post New Job</h2>

                {error && (
                    <div className="error-alert">
                        ⚠️ {error}
                    </div>
                )}

                {success ? (
                    <div className="success-message">
                        <div className="success-icon">✅</div>
                        <p className="success-text">Job posted successfully!</p>
                        <button 
                            className="history-btn"
                            onClick={() => navigate('/history')}
                        >
                            📋 View Your Jobs
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="recruiter-form">
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Job Title *"
                                name="title"
                                value={job.title}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Company Name *"
                                name="company"
                                value={job.company}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Location *"
                                name="location"
                                value={job.location}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Job Type *</label>
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

                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Salary (e.g., $50,000)"
                                name="salary"
                                value={job.salary}
                                onChange={handleChange}
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <textarea
                                placeholder="Job Description"
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

                        <div className="form-buttons">
                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-btn"
                            >
                                {loading ? '⏳ Posting...' : '🚀 Post Job'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate('/history')}
                                className="history-btn"
                            >
                                📋 View History
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Recruiter;