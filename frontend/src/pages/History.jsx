import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './History.css';

function History() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingJob, setEditingJob] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '', 
        company: '', 
        location: '', 
        type: '', 
        salary: '', 
        description: ''
    });
    const [deletingId, setDeletingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchRecruiterJobs();
    }, []);

    const fetchRecruiterJobs = async () => {
        try {
            setLoading(true);
            setError('');
            
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/jobs/my-jobs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setJobs(response.data);
            
        } catch (err) {
            console.error('Error:', err);
            
            if (err.response?.status === 401) {
                navigate('/login');
            } else {
                setError(err.response?.data?.error || 'Failed to load jobs');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job?')) {
            return;
        }

        try {
            setDeletingId(jobId);
            const token = localStorage.getItem('token');
            
            await axios.delete(`http://localhost:5000/api/jobs/${jobId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
            
            alert('Job deleted successfully!');
        } catch (err) {
            console.error('Error deleting job:', err);
            
            if (err.response?.status === 401) {
                alert('Session expired. Please login again.');
                navigate('/login');
            } else if (err.response?.status === 404) {
                alert('Job not found or already deleted.');
            } else {        
                alert('Failed to delete job. Please try again.');
            }
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (job) => {
        setEditingJob(job._id);
        setEditForm({
            title: job.title || '',
            company: job.company || '',
            location: job.location || '',
            type: job.type || 'full time',
            salary: job.salary || '',
            description: job.description || ''
        });
    };

    const handleUpdate = async (jobId) => {
        if (!editForm.title.trim() || !editForm.company.trim() || 
            !editForm.location.trim() || !editForm.type.trim()) {
            alert('Please fill all required fields: Title, Company, Location, and Type');
            return;
        }

        try {
            setUpdatingId(jobId);
            const token = localStorage.getItem('token');
            
            const response = await axios.put(
                `http://localhost:5000/api/jobs/${jobId}`,
                editForm,
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );
            
            setJobs(prevJobs => prevJobs.map(job => 
                job._id === jobId ? response.data : job
            ));
            
            setEditingJob(null);
            alert('Job updated successfully!');
        } catch (err) {
            console.error('Error updating job:', err);
            
            if (err.response?.status === 401) {
                alert('Session expired. Please login again.');
                navigate('/login');
            } else if (err.response?.status === 404) {
                alert('Job not found or you are not authorized to edit it.');
            } else if (err.response?.status === 400) {
                alert('Invalid data. Please check your input.');
            } else {
                alert('Failed to update job. Please try again.');
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingJob(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handlePostNewJob = () => {
        navigate('/recruiter');
    };

    if (loading) {
        return (
            <div className="loading-state">
                <div className="loader"></div>
                <p className="loading-text">Loading your jobs...</p>
            </div>
        );
    }

    return (
        <div className="history-page">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">📋 My Posted Jobs</h1>
                <div className="header-controls">
                    <button 
                        onClick={handlePostNewJob}
                        className="action-button btn-new-job"
                    >
                        📝 Post New Job
                    </button>
                    <button 
                        onClick={handleBackToDashboard}
                        className="action-button btn-dashboard"
                    >
                        ⬅️ Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="error-alert">
                    <div>⚠️ {error}</div>
                    <button onClick={fetchRecruiterJobs} className="action-button btn-save">
                        🔄 Retry
                    </button>
                </div>
            )}

            {/* No Jobs Message */}
            {!error && jobs.length === 0 && (
                <div className="empty-state">
                    <p className="empty-text">You haven't posted any jobs yet.</p>
                    <button 
                        onClick={handlePostNewJob}
                        className="btn-first-job"
                    >
                        🚀 Post Your First Job
                    </button>
                </div>
            )}

            {/* Jobs List */}
            <div className="jobs-container">
                {jobs.map(job => (
                    <div key={job._id} className="job-item">
                        {editingJob === job._id ? (
                            /* EDIT MODE */
                            <div className="job-edit">
                                <h3 className="edit-title">✏️ Edit Job</h3>
                                
                                <div className="edit-form">
                                    <div className="form-field">
                                        <input
                                            type="text"
                                            name="title"
                                            value={editForm.title}
                                            onChange={handleInputChange}
                                            placeholder="Job Title *"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <input
                                            type="text"
                                            name="company"
                                            value={editForm.company}
                                            onChange={handleInputChange}
                                            placeholder="Company Name *"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <input
                                            type="text"
                                            name="location"
                                            value={editForm.location}
                                            onChange={handleInputChange}
                                            placeholder="Location *"
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <label>Job Type *</label>
                                        <div className="radio-group">
                                            <label className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="full time"
                                                    checked={editForm.type === 'full time'}
                                                    onChange={handleInputChange}
                                                />
                                                Full Time
                                            </label>
                                            <label className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value="part time"
                                                    checked={editForm.type === 'part time'}
                                                    onChange={handleInputChange}
                                                />
                                                Part Time
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div className="form-field">
                                        <input
                                            type="text"
                                            name="salary"
                                            value={editForm.salary}
                                            onChange={handleInputChange}
                                            placeholder="Salary (e.g., $50,000)"
                                            className="form-input"
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <textarea
                                            name="description"
                                            value={editForm.description}
                                            onChange={handleInputChange}
                                            placeholder="Job Description"
                                            className="form-textarea"
                                            rows="4"
                                        />
                                    </div>
                                    
                                    <div className="action-buttons">
                                        <button 
                                            onClick={() => handleUpdate(job._id)}
                                            disabled={updatingId === job._id}
                                            className="action-button btn-save"
                                        >
                                            {updatingId === job._id ? '⏳ Saving...' : '💾 Save Changes'}
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            disabled={updatingId === job._id}
                                            className="action-button btn-cancel"
                                        >
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* VIEW MODE */
                            <div className="job-view">
                                <h3 className="job-title">{job.title}</h3>
                                
                                <div className="job-info">
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
                                        <span className="info-value salary-value">{job.salary || 'Not specified'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">📝 Description:</span>
                                    </div>
                                    <div className="job-description-box">
                                        {job.description}
                                    </div>
                                </div>
                                
                                <div className="job-footer">
                                    <span>
                                        📅 Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                                    </span>
                                    <div className="action-buttons">
                                        <button 
                                            onClick={() => handleEdit(job)}
                                            className="action-button btn-edit"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(job._id)}
                                            disabled={deletingId === job._id}
                                            className="action-button btn-delete"
                                        >
                                            {deletingId === job._id ? '⏳ Deleting...' : '🗑️ Delete'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default History;