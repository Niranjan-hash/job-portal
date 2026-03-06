import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiSettings,
  FiUser, 
  FiLock, 
  FiBell, 
  FiEye, 
  FiTrash2, 
  FiArrowLeft,
  FiAlertTriangle,
  FiMoon,
  FiSun,
  FiShield,
  FiCheckCircle,
  FiLoader
} from 'react-icons/fi';
import './settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // States
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    profilePublic: true
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Admin states
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ userid: '', password: '' });
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPreferences(response.data.user);
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch('http://localhost:5000/user/update-preferences', 
        { [key]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${key === 'emailNotifications' ? 'Notifications' : 'Privacy'} updated`);
    } catch (error) {
      toast.error("Failed to save setting");
      fetchUserData(); // Revert
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/user/change-password', 
        { 
          currentPassword: passwordForm.currentPassword, 
          newPassword: passwordForm.newPassword 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success("Password updated successfully");
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText.toLowerCase() !== 'delete') {
      return toast.error("Please type 'DELETE' to confirm");
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/user/delete-account', {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Account deleted permanently");
      localStorage.clear();
      navigate('/');
    } catch (error) {
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsAdminLoggingIn(true);
    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', adminCreds);
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        toast.success(response.data.message);
        setShowAdminModal(false);
        navigate('/admin');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Admin login failed");
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-loader-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}>
        <div className="pro-spinner"></div>
        <p style={{ marginTop: '20px', color: '#475569', fontWeight: '600' }}>Initializing Secure Settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-layout-full">
      {/* Sidebar */}
      <aside className="settings-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><FiSettings /></div>
          <div className="brand-text">
            <h2>Portal Settings</h2>
            <span>User Preferences</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <FiUser /> <span>Account & Profile</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiShield /> <span>Security & Login</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell /> <span>Notifications</span>
          </button>
          <button 
            className={`nav-link ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <FiSun /> <span>Appearance</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button onClick={() => setShowAdminModal(true)} className="admin-portal-trigger" style={{ marginBottom: '15px' }}>
            <FiShield /> <span>Admin Portal</span>
          </button>
          <button onClick={() => navigate('/dashboard')} className="back-to-dash">
            <FiArrowLeft /> <span>Return to Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="settings-main-portal">
        <header className="main-header-minimal">
          <div className="header-info">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h1>
            <p>Manage your account configuration and preferences</p>
          </div>
        </header>

        <section className="tab-content-area">
          {activeTab === 'account' && (
            <div className="settings-card-group">
               <div className="premium-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                  <div className="card-top">
                    <FiUser className="bell-icon" />
                    <h3>Detailed Profile</h3>
                  </div>
                  <div className="card-body">
                    <div className="setting-row">
                      <div className="row-text">
                        <h4>Manage your Identity</h4>
                        <p>Update your resume, education details, and professional experience.</p>
                      </div>
                      <FiArrowLeft style={{ transform: 'rotate(180deg)', color: 'var(--primary)' }} />
                    </div>
                  </div>
               </div>

              <div className="premium-card danger-zone-card">
                <div className="card-top">
                  <FiAlertTriangle className="danger-icon" />
                  <h3>Danger Zone</h3>
                </div>
                <div className="card-body">
                  <div className="setting-row">
                    <div className="row-text">
                      <h4>Permanently Deactivate Account</h4>
                      <p>This action is irreversible. All your job history and data will be wiped.</p>
                    </div>
                    <button className="del-btn-ultra" onClick={() => setShowDeleteModal(true)}>
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-card-group">
              <div className="premium-card">
                <div className="card-top">
                  <FiLock className="sec-icon" />
                  <h3>Update Security Credentials</h3>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePasswordChange} className="password-form-grid">
                    <div className="input-group-modern">
                      <label>Current Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="input-group-modern">
                      <label>New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="input-group-modern">
                      <label>Confirm New Password</label>
                      <input 
                        type="password" 
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <button type="submit" className="save-sec-btn" disabled={isSaving}>
                      {isSaving ? "Updating Credentials..." : "Update Password"}
                    </button>
                  </form>
                </div>
              </div>
              
              <div className="premium-card">
                <div className="card-top">
                  <FiCheckCircle className="ok-icon" />
                  <h3>Account Security Status</h3>
                </div>
                <div className="card-body">
                  <p style={{ color: 'var(--text-light)' }}>Your account is currently secure. Two-factor authentication is recommended for enhanced protection.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-card-group">
              <div className="premium-card">
                <div className="card-top">
                  <FiBell className="bell-icon" />
                  <h3>Communication Preferences</h3>
                </div>
                <div className="card-body">
                  <div className="setting-row">
                    <div className="row-text">
                      <h4>Job Alert Emails</h4>
                      <p>Receive notifications about jobs that match your specialized skills.</p>
                    </div>
                    <label className="pro-switch">
                      <input 
                        type="checkbox" 
                        checked={preferences.emailNotifications}
                        onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                      />
                      <span className="pro-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-card-group">
              <div className="premium-card">
                <div className="card-top">
                  <FiMoon className="theme-icon" />
                  <h3>Global Interface Theme</h3>
                </div>
                <div className="card-body">
                  <div className="theme-selector-grid">
                    <div className="theme-option active">
                      <div className="theme-preview light"></div>
                      <span style={{ fontWeight: '700' }}>Premium Light</span>
                    </div>
                    <div className="theme-option" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                      <div className="theme-preview dark"></div>
                      <span>Classic Dark</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="ultra-modal-overlay">
          <div className="ultra-modal-content">
            <FiAlertTriangle className="modal-warn-icon" />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Permanently Delete?</h2>
            <p style={{ margin: '15px 0', color: 'var(--text-light)' }}>Verification required. Type <strong>DELETE</strong> below to finalize account removal.</p>
            <input 
              type="text"
              className="modal-input-field"
              placeholder="Type DELETE..."
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
            />
            <div className="modal-button-strip">
              <button className="modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button 
                className="modal-confirm-del" 
                disabled={confirmDeleteText.toLowerCase() !== 'delete' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? "Deleting..." : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="ultra-modal-overlay">
          <div className="ultra-modal-content admin-modal">
            <FiShield className="modal-warn-icon" style={{ color: 'var(--admin-primary, #ef4444)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Admin Operations</h2>
            <p style={{ margin: '15px 0', color: 'var(--text-light)' }}>Enter administrative credentials to proceed.</p>
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
              <input 
                type="text"
                className="modal-input-field"
                placeholder="Admin UserID"
                value={adminCreds.userid}
                onChange={(e) => setAdminCreds({...adminCreds, userid: e.target.value})}
                required
              />
              <input 
                type="password"
                className="modal-input-field"
                placeholder="Admin Password"
                value={adminCreds.password}
                onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})}
                required
              />
              <div className="modal-button-strip" style={{ marginTop: '10px' }}>
                <button type="button" className="modal-cancel" onClick={() => setShowAdminModal(false)}>Cancel</button>
                <button 
                  type="submit"
                  className="modal-confirm-admin" 
                  disabled={isAdminLoggingIn}
                  style={{
                    backgroundColor: 'var(--admin-primary, #ef4444)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {isAdminLoggingIn ? "Authenticating..." : "Access Portal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
