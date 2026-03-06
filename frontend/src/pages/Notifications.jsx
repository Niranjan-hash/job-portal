import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FiBell, 
  FiTrash2, 
  FiArrowLeft, 
  FiBriefcase, 
  FiCheckCircle, 
  FiClock,
  FiChevronRight
} from 'react-icons/fi';
import './notification.css'

const Notifications = () => {
  const [apiUrl] = useState('http://localhost:5000');

  const getFullImageUrl = (imageData) => {
    if (!imageData) return '';
    if (typeof imageData === 'string') {
      if (imageData.startsWith('http')) return imageData;
      if (imageData.startsWith('/uploads')) return `${apiUrl}${imageData}`;
      return `${apiUrl}/uploads/profile-pics/${imageData}`;
    }
    if (imageData?.filename) {
      return `${apiUrl}/uploads/profile-pics/${imageData.filename}`;
    }
    return '';
  };
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfilePic, setUserProfilePic] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${apiUrl}/profile/my-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = response.data.profile || response.data.user || response.data;
        if (profileData.profilePic) {
          setUserProfilePic(profileData.profilePic);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification removed');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.type === 'NEW_APPLICATION' && notification.data?.jobId) {
      navigate(`/job/${notification.data.jobId}/applicants`);
    } else if (notification.type === 'STATUS_UPDATE') {
      navigate('/jobs/applied');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_APPLICATION': return <FiBriefcase className="type-icon application" />;
      case 'STATUS_UPDATE': return <FiCheckCircle className="type-icon status" />;
      default: return <FiBell className="type-icon default" />;
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-glass-container">
        <header className="notifications-header">
          <div className="header-title-group">
            <h1>Activity Center</h1>
            <p>Stay updated with your latest career movements</p>
          </div>
          <button onClick={() => navigate(-1)} className="back-btn-modern">
            <FiArrowLeft /> <span>Return</span>
          </button>
        </header>
        
        {loading ? (
          <div className="loading-state-modern">
            <div className="modern-spinner"></div>
            <p style={{ color: 'var(--text-light)', fontWeight: '600' }}>Fetching your updates...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-wrapper">
              <FiBell />
            </div>
            <h3>All Caught Up!</h3>
            <p>Your notifications will appear here as soon as they arrive.</p>
            <button onClick={() => navigate('/dashboard')} className="explore-btn">Return to Dashboard</button>
          </div>
        ) : (
          <div className="notifications-list-modern">
            {notifications.map(notification => (
              <div 
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
              >
                <div className="card-left">
                  <div className="icon-badge">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                
                <div className="card-center">
                  <div className="card-top-aligned">
                    {notification.data?.senderPic || (notification.type === 'STATUS_UPDATE' && userProfilePic) ? (
                      <img src={getFullImageUrl(notification.data?.senderPic || userProfilePic)} alt="Sender" className="sender-avatar-small" />
                    ) : (
                      <div className="sender-avatar-placeholder">
                        {notification.data?.senderName ? notification.data.senderName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="sender-info-group">
                      <span className="type-label">{notification.type.replace('_', ' ')}</span>
                      <span className="sender-name">{notification.data?.senderName || 'System'}</span>
                    </div>
                    <span className="time-ago">
                      <FiClock /> {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="card-title">
                    {notification.type === 'NEW_APPLICATION' ? 'Application Received' : 
                     notification.type === 'STATUS_UPDATE' ? 'Application Review' : 'System Update'}
                  </h4>
                  <p className="card-message">{notification.message}</p>
                </div>
                
                <div className="card-right">
                  <button 
                    onClick={(e) => deleteNotification(notification._id, e)}
                    className="action-btn delete"
                    title="Remove"
                  >
                    <FiTrash2 />
                  </button>
                  <FiChevronRight className="arrow-indicator" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
