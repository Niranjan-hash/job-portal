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
    FiCheckCircle,
    FiActivity,
    FiClock,
    FiEye,
    FiX
} from 'react-icons/fi';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import './admin.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'jobs'
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Activity Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userActivity, setUserActivity] = useState(null);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityLoading, setActivityLoading] = useState(false);

    const getTimeframeBadge = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

        if (diffHours <= 24) return { text: 'Past 24 Hours', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
        if (diffDays <= 2) return { text: 'Past 2 Days', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
        if (diffDays <= 7) return { text: 'Past Week', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
        if (diffDays <= 30) return { text: 'Past Month', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
        if (diffDays <= 365) return { text: 'Past Year', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
        return { text: 'Older', color: 'var(--admin-text-muted)', bg: 'rgba(0,0,0,0.05)' };
    };

    useEffect(() => {
        // Authenticate as admin
        const checkAdmin = () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                navigate('/settings'); // FIXED redirect to settings instead of login
                return;
            }
            fetchData(activeTab);
        };
        checkAdmin();
    }, [activeTab, navigate]);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        
        tl.fromTo('.admin-sidebar', 
            { x: -100, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.6 }
          )
          .fromTo('.admin-topbar', 
            { y: -30, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.5 }, 
            "-=0.4"
          )
          .fromTo('.stat-card',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
            "-=0.2"
          )
          .fromTo('.admin-data-panel', 
            { y: 40, opacity: 0, filter: 'blur(8px)' }, 
            { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7 }, 
            "-=0.3"
          );
    }, []);

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
                navigate('/settings'); // FIXED redirect
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

    const handleViewActivity = async (user) => {
        setSelectedUser(user);
        setShowActivityModal(true);
        setActivityLoading(true);
        setUserActivity(null);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`http://localhost:5000/api/admin/users/${user._id}/activity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data.success) {
                setUserActivity(response.data.activity);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load user activity.');
        } finally {
            setActivityLoading(false);
            setTimeout(() => setError(''), 4000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/settings');
    };

    const getCurrentTime = () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-dashboard-layout">
            {/* Extended Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-brand-section">
                    <FiShield className="admin-shield-icon" />
                    <div className="admin-brand-text">
                        <h2>Admin Console</h2>
                        <span className="admin-badge-pro">Superuser Level</span>
                    </div>
                </div>

                <nav className="admin-nav-menu">
                    <button 
                        className={`admin-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <FiUsers /> <span>Manage Users</span>
                    </button>
                    <button 
                        className={`admin-nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <FiBriefcase /> <span>Manage Jobs</span>
                    </button>
                </nav>

                <div className="admin-sidebar-bottom">
                    <button className="admin-exit-btn" onClick={handleLogout}>
                        <FiLogOut /> <span>Exit Console</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main-view">
                
                {/* Topbar sticky header */}
                <header className="admin-topbar">
                    <div className="admin-topbar-title">
                        <h1>{activeTab === 'users' ? 'User Directory' : 'Job Postings Record'}</h1>
                        <p>Real-time insights and moderation tools.</p>
                    </div>
                    <div className="admin-topbar-actions">
                    </div>
                </header>

                <div className="admin-content-pad">
                    
                    {/* Summary Cards */}
                    <div className="admin-stats-row">
                        <div className="stat-card blue-accent">
                            <div className="stat-info">
                                <h3>Total {activeTab === 'users' ? 'Registered Users' : 'Active Jobs'}</h3>
                                <div className="stat-value">
                                    {loading ? '--' : (activeTab === 'users' ? users.length : jobs.length)}
                                </div>
                            </div>
                            <div className="stat-icon-wrap">
                                {activeTab === 'users' ? <FiUsers /> : <FiBriefcase />}
                            </div>
                        </div>


                        {activeTab === 'users' && (
                            <div className="stat-card red-accent">
                                <div className="stat-info">
                                    <h3>Total Admins</h3>
                                    <div className="stat-value">
                                        {loading ? '--' : users.filter(u => u.isAdmin).length}
                                    </div>
                                </div>
                                <div className="stat-icon-wrap">
                                    <FiShield />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="admin-notification error">
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="admin-notification success">
                            <FiCheckCircle />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Data Panel */}
                    <div className="admin-data-panel">
                        <div className="panel-header">
                            <h3>{activeTab === 'users' ? 'Platform Users List' : 'Platform Job Listings'}</h3>
                        </div>
                        
                        {loading ? (
                            <div className="admin-spinner-box">
                                <div className="radar-spinner"></div>
                                <p>Syncing {activeTab}...</p>
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="admin-table-wrapper">
                                <table className="modern-admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email / UserID</th>
                                            <th>Total Jobs</th>
                                            <th>Status</th>
                                            <th>Joined Date</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="empty-view">
                                                    <FiUsers className="empty-icon" />
                                                    <div>No users found in database.</div>
                                                </td>
                                            </tr>
                                        ) : users.map(user => (
                                            <tr key={user._id}>
                                                <td className="data-primary">{user.userName}</td>
                                                <td className="data-secondary" style={{ color: '#e2e8f0' }}>{user.userid}</td>
                                                <td className="data-primary" style={{ fontWeight: 'bold' }}>{user.totalJobs ?? 0}</td>
                                                <td>
                                                    <span className={`status-badge ${user.isVerified ? 'badge-verified' : 'badge-pending'}`}>
                                                        {user.isVerified ? 'Verified' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="data-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="admin-actions-group">
                                                        <button 
                                                            className="admin-btn admin-btn-info"
                                                            onClick={() => handleViewActivity(user)}
                                                            title="View Activity"
                                                        >
                                                            <FiEye /> Activity
                                                        </button>
                                                        {!user.isAdmin ? (
                                                            <button 
                                                                className="admin-btn admin-btn-danger"
                                                                onClick={() => handleDeleteUser(user._id, user.userName)}
                                                                title="Delete User"
                                                            >
                                                                <FiTrash2 /> Terminate
                                                            </button>
                                                        ) : (
                                                            <div className="admin-status-label">Admin Privileges</div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="admin-table-wrapper">
                                <table className="modern-admin-table">
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
                                            <tr>
                                                <td colSpan="5" className="empty-view">
                                                    <FiBriefcase className="empty-icon" />
                                                    <div>No job posts currently active.</div>
                                                </td>
                                            </tr>
                                        ) : jobs.map(job => (
                                            <tr key={job._id}>
                                                <td className="data-primary">{job.title}</td>
                                                <td className="data-secondary" style={{ color: '#e2e8f0' }}>{job.company}</td>
                                                <td className="data-secondary">{job.location}</td>
                                                <td className="data-secondary">{new Date(job.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="admin-actions-group">
                                                        <button 
                                                            className="admin-btn admin-btn-danger"
                                                            onClick={() => handleDeleteJob(job._id, job.title)}
                                                            title="Delete Job Post"
                                                        >
                                                            <FiTrash2 /> Remove Post
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* User Activity Modal Overlay */}
            {showActivityModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
                    <div className="admin-data-panel" style={{ width: '90%', maxWidth: '800px', borderRadius: '16px', border: '1px solid var(--admin-glass-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        
                        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--admin-text)' }}>
                                Activity Monitor: <span style={{ color: 'var(--admin-accent)' }}>{selectedUser?.userName}</span>
                            </h2>
                            <button onClick={() => setShowActivityModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>
                                <FiX />
                            </button>
                        </div>
                        
                        <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
                            {activityLoading ? (
                                <div className="admin-spinner-box" style={{ height: '200px' }}>
                                    <div className="radar-spinner"></div>
                                    <p>Loading activity logs...</p>
                                </div>
                            ) : userActivity ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    
                                    {/* Jobs Posted Section */}
                                    <div>
                                        <h3 style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px', color: 'var(--admin-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                            <FiBriefcase style={{ color: 'var(--admin-accent)' }} /> Jobs Created ({userActivity.jobsPosted.length})
                                        </h3>
                                        {userActivity.jobsPosted.length === 0 ? (
                                            <p style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic', padding: '16px', background: 'var(--admin-surface-hover)', borderRadius: '8px' }}>No jobs posted by this user.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                                {userActivity.jobsPosted.map(job => {
                                                    const badge = getTimeframeBadge(job.createdAt);
                                                    return (
                                                        <div key={job._id} style={{ padding: '16px', border: '1px solid var(--admin-border)', borderRadius: '8px', background: 'var(--admin-surface-hover)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <h4 style={{ margin: '0 0 6px 0', color: 'var(--admin-primary)', fontSize: '1.1rem' }}>{job.title}</h4>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.color }}>
                                                                    {badge.text}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', display: 'flex', gap: '20px' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><strong>Company:</strong> {job.company}</span>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiClock /> {new Date(job.createdAt).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Applications Section */}
                                    <div>
                                        <h3 style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px', color: 'var(--admin-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                            <FiActivity style={{ color: '#10b981' }} /> Applications Submitted ({userActivity.applications.length})
                                        </h3>
                                        {userActivity.applications.length === 0 ? (
                                            <p style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic', padding: '16px', background: 'var(--admin-surface-hover)', borderRadius: '8px' }}>No applications found.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '12px' }}>
                                                {userActivity.applications.map(app => {
                                                    const badge = getTimeframeBadge(app.createdAt || app.appliedAt || Date.now());
                                                    return (
                                                        <div key={app._id} style={{ padding: '16px', border: '1px solid var(--admin-border)', borderRadius: '8px', background: 'var(--admin-surface-hover)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <h4 style={{ margin: '0 0 6px 0', color: '#10b981', fontSize: '1.1rem' }}>Applied for Job ID: {app.jobId?._id || app.jobId}</h4>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', backgroundColor: badge.bg, color: badge.color }}>
                                                                    {badge.text}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', display: 'flex', gap: '20px' }}>
                                                                <span><strong>Status:</strong> {app.status || 'Applied'}</span>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiClock /> {new Date(app.createdAt || app.appliedAt || Date.now()).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-primary)' }}>
                                    <FiAlertCircle style={{ fontSize: '40px', opacity: 0.5, marginBottom: '16px' }} />
                                    <p>Failed to load activity details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
