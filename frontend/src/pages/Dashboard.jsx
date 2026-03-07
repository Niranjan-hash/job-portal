import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import './dashboard.css';
import { useState, useEffect, useMemo } from "react";
import Joblist from "../component/Joblist";
import { useSearchbarVisibility } from "../hooks/useSearchbarVisibility";
import { 
  FiHome, 
  FiBriefcase, 
  FiFileText, 
  FiClock, 
  FiUser, 
  FiRepeat, 
  FiBell, 
  FiSettings, 
  FiLogOut,
  FiUsers,
  FiSearch,
  FiX,
  FiMapPin,
  FiFolder
} from "react-icons/fi";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

function Dashboard() {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    profilePicture: "",
    appliedJobs: 0,
    hasResume: false
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfilePic, setShowProfilePic] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { isVisible, show, hide } = useSearchbarVisibility();

  // Job Data State (Lifted from Joblist)
  const [joblist, setJoblist] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  // Search Filters
  const [filters, setFilters] = useState({
    search: '',
    location: ''
  });

  const uniqueTitles = useMemo(() => {
    if (!joblist || joblist.length === 0) return [];
    
    // Normalize and get unique titles
    const normalizedMap = new Map();
    joblist.forEach(job => {
      const title = job.title?.trim();
      if (title) {
        const lower = title.toLowerCase();
        if (!normalizedMap.has(lower)) {
          normalizedMap.set(lower, title); // Store first occurrence for display casing
        }
      }
    });
    
    return Array.from(normalizedMap.values());
  }, [joblist]);

  const uniqueLocations = useMemo(() => {
    if (!joblist || joblist.length === 0) return [];
    const locations = new Set();
    joblist.forEach(job => {
      if (job.location) {
        locations.add(job.location.trim());
      }
    });
    return Array.from(locations).sort();
  }, [joblist]);

  useEffect(() => {
    fetchUserData();
    fetchUnreadCount();
    fetchJobs();
  }, []);

  useGSAP(() => {
    if (loading) return;

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    
    // Animate header only if visible
    if (isVisible) {
      tl.fromTo('.top-header', 
        { y: -80, opacity: 0, scale: 0.98 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.2)' }
      )
      .fromTo('.horizontal-title-bar-container', 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.6 }, 
        "-=0.6"
      );
    }

    tl.fromTo('.main-content', 
        { opacity: 0, y: 30, filter: 'blur(8px)' }, 
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 }, 
        isVisible ? "-=0.4" : 0
      );
  }, [loading, isVisible]);

  useGSAP(() => {
    if (isMenuOpen) {
      const tl = gsap.timeline();
      tl.fromTo('.menu-overlay', 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        )
        .fromTo('.slide-menu', 
          { x: '-120%', opacity: 0 }, 
          { x: '0%', opacity: 1, duration: 0.6, ease: 'expo.out' }, 
          "-=0.2"
        )
        .fromTo('.menu-item', 
          { opacity: 0, x: -20 }, 
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: 'power3.out' }, 
          "-=0.4"
        );
    }
  }, [isMenuOpen]);

  // Dynamic Search with Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      setJobsError('');
      
      const params = new URLSearchParams();
      // Generic search for Title, Company, etc.
      if (filters.search) {
         params.append('search', filters.search);
      }
      if (filters.location) {
         params.append('location', filters.location);
      }
      
      const response = await axios.get(`http://localhost:5000/search?${params.toString()}`);
      setJoblist(response.data);
    } catch (err) {
      setJobsError("Failed to load jobs.");
      console.error(err);
    } finally {
      setJobsLoading(false);
    }
  };

  const performSearch = () => {
      fetchJobs();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const fetchUnreadCount = async () => {
    try {
       const token = localStorage.getItem('token');
       if (token) {
          const response = await axios.get('http://localhost:5000/api/notifications/unread-count', {
             headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
            setUnreadCount(response.data.count);
          }
       }
    } catch (error) {
       console.error("Failed to fetch unread count", error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/profile/my-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const profileData = response.data.profile || response.data.user || response.data;
      
      let profilePicture = "";
      const picData = profileData.profilePic;
      
      if (picData) {
        if (typeof picData === 'string') {
          profilePicture = picData.startsWith('http') ? picData : `http://localhost:5000${picData.startsWith('/uploads') ? '' : '/uploads/profile-pics/'}${picData}`;
        } else if (picData.filename) {
          profilePicture = `http://localhost:5000/uploads/profile-pics/${picData.filename}`;
        } else if (picData.url) {
          profilePicture = picData.url.startsWith('http') ? picData.url : `http://localhost:5000${picData.url}`;
        }
        setShowProfilePic(true);
      }

      setUserData({
        name: profileData.name || "User",
        email: profileData.email || "user@example.com",
        profilePicture: profilePicture,
        appliedJobs: profileData.appliedJobs || 0,
        hasResume: profileData.hasResume || false
      });

    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback
      setUserData({
        name: "User",
        email: "user@example.com",
        profilePicture: "",
        appliedJobs: 0,
        hasResume: false
      });
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  // Menu Handlers
  const handleEditProfile = () => { navigate('/profile'); setIsMenuOpen(false); };
  const handleUploadResume = () => { navigate('/resume'); setIsMenuOpen(false); };
  const handleViewResume = () => { navigate('/resume/view'); setIsMenuOpen(false); };
  const handleAppliedJobs = () => { navigate('/jobs/applied'); setIsMenuOpen(false); };
  const handleRecruiterHistory = () => { navigate('/history'); setIsMenuOpen(false); };
  const handleSwitchToRecruiter = () => { navigate('/recruiter'); setIsMenuOpen(false); };
  const toggleMenu = () => { setIsMenuOpen(!isMenuOpen); };
  const getInitials = () => {
    if (!userData.name) return 'U';
    const names = userData.name.split(' ');
    return names[0][0].toUpperCase();
  };
  const handleImageError = () => { setShowProfilePic(false); };

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div><p>Loading...</p></div>;
  }

  return (
    <div className="home_page">
      <div className={`menu-overlay ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)} />
      
      {/* Slide Menu */}
      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <div className="menu-profile">
            {showProfilePic && userData.profilePicture ? (
              <img src={userData.profilePicture} alt="Profile" className="menu-profile-pic" onError={handleImageError} />
            ) : (
              <div className="menu-profile-pic-placeholder">{getInitials()}</div>
            )}
            <div className="menu-profile-info">
              <h3>{userData.name}</h3>
              <span className="user-type">Job Seeker</span>
            </div>
          </div>
          <button className="menu-close-btn" onClick={toggleMenu}>×</button>
        </div>
        {/* Navigation Items (Keeping existing structure) */}
        <div className="menu-section">
          <h4 className="section-title">Navigation</h4>
          <div className="menu-items">
            <div className="menu-item" onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }}>
              <FiHome className="menu-item-icon" />
              <span>Dashboard</span>
            </div>
            <div className="menu-item" onClick={handleAppliedJobs}>
              <FiBriefcase className="menu-item-icon" />
              <span>Applied Jobs</span>
            </div>
            <div className="menu-item" onClick={handleRecruiterHistory}>
              <FiUsers className="menu-item-icon" />
              <span>Job Applicants</span>
            </div>
            <div className="menu-item" onClick={userData.hasResume ? handleViewResume : handleUploadResume}>
              <FiFileText className="menu-item-icon" />
              <span>{userData.hasResume ? 'View Resume' : 'Upload Resume'}</span>
            </div>
            <div className="menu-item" onClick={() => { navigate('/showroom'); setIsMenuOpen(false); }}>
              <FiFolder className="menu-item-icon" />
              <span>Project Showroom</span>
            </div>
            <div className="menu-item" onClick={handleRecruiterHistory}>
              <FiClock className="menu-item-icon" />
              <span>Recruiter History</span>
            </div>
          </div>
        </div>
        <div className="menu-section">
          <h4 className="section-title">Account</h4>
          <div className="menu-items">
            <div className="menu-item" onClick={handleEditProfile}>
              <FiUser className="menu-item-icon" />
              <span>Edit Profile</span>
            </div>
            <div className="menu-item" onClick={handleSwitchToRecruiter}>
              <FiRepeat className="menu-item-icon" />
              <span>Switch to Recruiter</span>
            </div>
            <div className="menu-item" onClick={() => { navigate('/notifications'); setIsMenuOpen(false); }}>
               <FiBell className="menu-item-icon" />
               <span>Notifications</span>
               {unreadCount > 0 && <span className="menu-badge" style={{ marginLeft: 'auto', backgroundColor: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8em' }}>{unreadCount}</span>}
            </div>
            <div className="menu-item" onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}>
              <FiSettings className="menu-item-icon" />
              <span>Settings</span>
            </div>
          </div>
        </div>
        <div className="menu-footer">
          <div className="menu-item logout" onClick={handleLogout}>
            <FiLogOut className="menu-item-icon" />
            <span>Logout</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        {isVisible && (
          <div className="top-header">
            <button className="menu-toggle-btn" onClick={toggleMenu}>
              <div style={{ width: '24px', height: '2px', background: 'currentColor', boxShadow: '0 7px 0 currentColor, 0 -7px 0 currentColor' }}></div>
            </button>
            
            <div className="header-center">
               {isSearchExpanded && (
                 <form onSubmit={handleSearch} className="search-form active">
                    <div className="search-bar-container">
                      <FiSearch className="search-icon-inside" />
                      <input 
                        type="text" 
                        name="search"
                        placeholder="Search Role, Company..." 
                        value={filters.search}
                        onChange={handleFilterChange}
                        autoFocus
                        className="search-input-field"
                      />
                      
                      <div className="location-input-section">
                        <div className="search-divider"></div>
                        <FiMapPin className="location-icon-inside" />
                        <input 
                          type="text" 
                          name="location"
                          placeholder="Location..." 
                          value={filters.location}
                          onChange={handleFilterChange}
                          className="location-input-field"
                          list="location-list"
                        />
                        <datalist id="location-list">
                          {uniqueLocations.map(loc => (
                            <option key={loc} value={loc} />
                          ))}
                        </datalist>
                      </div>

                      <button 
                        type="button" 
                        className="search-close-btn-pro"
                        onClick={() => {
                          setIsSearchExpanded(false);
                          setFilters({ search: '', location: '' });
                        }}
                        aria-label="Close search"
                      >
                        <FiX size={24} strokeWidth={3} /> X
                      </button>
                    </div>
                  </form>
               )}
            </div>
            
            <div className="header-right">
               {!isSearchExpanded && (
                <div 
                  className="search-toggle-btn"
                  onClick={() => setIsSearchExpanded(true)} 
                  title="Search"
                  style={{ color: '#4f46e5', border: '1px solid rgba(0,0,0,0.1)', background: 'white' }}
                >
                  <FiSearch />
                </div>
               )}

              <button className="recruiter-btn" onClick={handleSwitchToRecruiter}>Recruiter Mode</button>
              
              <div className="notification-bell" onClick={() => navigate('/notifications')}>
                <FiBell />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Unique Title Bar */}
        <div className="horizontal-title-bar-container">
          <div className="horizontal-title-bar">
            <div className="horizontal-title-bar-content">
              {uniqueTitles.concat(uniqueTitles).map((title, index) => (
                <div 
                  key={`${title}-${index}`} 
                  className={`title-pill ${filters.search === title ? 'active' : ''}`}
                  onClick={() => {
                    setFilters({ ...filters, search: title });
                    setIsSearchExpanded(true);
                    show();
                  }}
                >
                  {title}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="page-content">
          <div className="dashboard-layout">
            <div className="joblist-container">
              <Joblist 
                jobs={joblist}
                loading={jobsLoading}
                error={jobsError}
                showSearchbar={show} 
                hideSearchbar={hide} 
                onSearchChange={(title) => {
                  setFilters({ ...filters, search: title });
                  setIsSearchExpanded(true);
                  show();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>  
  );
}

export default Dashboard;