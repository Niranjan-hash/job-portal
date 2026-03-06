import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    FiUsers, 
    FiBriefcase, 
    FiTrash2, 
    FiLogOut, 
    FiShield, 
    FiAlertCircle,
    FiCheckCircle 
} from 'react-icons/fi';
import './admin.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'jobs'
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Authenticate as admin
        const checkAdmin = () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                navigate('/'); // Or navigate back to settings
                return;
            }
            fetchData(activeTab);
        };
        checkAdmin();
    }, [activeTab, navigate]);

    const fetchData = async (tab) => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const endpoint = tab === 'users' ? '/api/admin/users' : '/api/admin/jobs';
            const response = await axios.get(`http://localhost:5000${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                if (tab === 'users') {
                    setUsers(response.data.users);
                } else {
                    setJobs(response.data.jobs);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to load ${tab}`);
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('adminToken');
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you absolutely sure you want to delete user "${userName}"? This will delete all their data, applied jobs, and posted jobs.`)) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSuccess('User deleted successfully.');
                fetchData('users');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const handleDeleteJob = async (jobId, jobTitle) => {
        if (!window.confirm(`Are you sure you want to delete the job post "${jobTitle}"? All applications to this job will also be removed.`)) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.delete(`http://localhost:5000/api/admin/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setSuccess('Job post deleted successfully.');
                fetchData('jobs');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete job.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 4000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/settings');
    };

    return (
        <div className="admin-dashboard-container">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <FiShield className="admin-shield" />
                    <h2>Admin Portal</h2>
                    <span className="admin-badge">Superuser</span>
                </div>

                <nav className="admin-nav">
                    <button 
                        className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <FiUsers /> Manage Users
                    </button>
                    <button 
                        className={`admin-nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <FiBriefcase /> Manage Jobs
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <FiLogOut /> Exit Admin Portal
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <h1>{activeTab === 'users' ? 'User Management' : 'Job Postings Management'}</h1>
                    <p className="admin-subtitle">
                        {activeTab === 'users' 
                            ? 'View and delete user accounts across the platform.' 
                            : 'Monitor and moderate all active job listings.'}
                    </p>
                </header>

                {error && (
                    <div className="admin-alert error">
                        <FiAlertCircle />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="admin-alert success">
                        <FiCheckCircle />
                        <span>{success}</span>
                    </div>
                )}

                <div className="admin-content-area">
                    {loading ? (
                        <div className="admin-loader">
                            <div className="spinner"></div>
                            <p>Loading {activeTab}...</p>
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email / UserID</th>
                                        <th>Status</th>
                                        <th>Joined Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan="5" className="empty-state">No users found.</td></tr>
                                    ) : users.map(user => (
                                        <tr key={user._id}>
                                            <td className="primary-cell">{user.userName}</td>
                                            <td>{user.userid}</td>
                                            <td>
                                                <span className={`status-pill ${user.isVerified ? 'verified' : 'unverified'}`}>
                                                    {user.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="action-cell">
                                                {!user.isAdmin && (
                                                    <button 
                                                        className="admin-delete-btn"
                                                        onClick={() => handleDeleteUser(user._id, user.userName)}
                                                        title="Delete User"
                                                    >
                                                        <FiTrash2 /> Delete
                                                    </button>
                                                )}
                                                {user.isAdmin && <span className="admin-label">Admin</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Company</th>
                                        <th>Location</th>
                                        <th>Posted Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.length === 0 ? (
                                        <tr><td colSpan="5" className="empty-state">No jobs found.</td></tr>
                                    ) : jobs.map(job => (
                                        <tr key={job._id}>
                                            <td className="primary-cell">{job.title}</td>
                                            <td>{job.company}</td>
                                            <td>{job.location}</td>
                                            <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                                            <td className="action-cell">
                                                <button 
                                                    className="admin-delete-btn"
                                                    onClick={() => handleDeleteJob(job._id, job.title)}
                                                    title="Delete Job Post"
                                                >
                                                    <FiTrash2 /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
