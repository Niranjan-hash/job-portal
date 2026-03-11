import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import '../component/joblist.css'; // Reusing joblist css
import defaultProfile from '../assets/default-profile.png';

function JobApplicants() {
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
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Profile Modal State
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicantProfile, setApplicantProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  
  // Sorting and Filtering State
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({
    experience: '',
    skill: '',
    education: '',
    location: '',
    score: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, [jobId, sort, filters]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
         navigate('/login');
         return;
      }

      const params = new URLSearchParams({ sort });
      if (filters.experience) params.append('experience', filters.experience);
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.education) params.append('education', filters.education);
      if (filters.location) params.append('location', filters.location);
      if (filters.score) params.append('score', filters.score);

      const response = await axios.get(`http://localhost:5000/api/applications/job/${jobId}?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setApplicants(response.data.applicants);
    } catch (err) {
      console.error(err);
      setError("Failed to load applicants or unauthorized.");
    } finally {
      setLoading(false);
    }
  };

  useGSAP(() => {
    // Initial entrance for header and filters
    gsap.fromTo('.joblist-header', 
      { opacity: 0, y: -20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power4.out' }
    );
    
    gsap.fromTo('.filter-panel', 
      { opacity: 0, scale: 0.98, y: 20 }, 
      { opacity: 1, scale: 1, y: 0, duration: 1, delay: 0.2, ease: 'expo.out' }
    );

    if (!loading && applicants.length > 0) {
      gsap.fromTo('.applicant-card', 
        { 
          opacity: 0, 
          y: 40,
          rotationX: -10,
          perspective: 1000
        }, 
        { 
          opacity: 1, 
          y: 0, 
          rotationX: 0,
          duration: 0.8, 
          stagger: {
            each: 0.1,
            from: "start"
          }, 
          ease: 'power3.out' 
        }
      );
    }
  }, [loading, applicants]);

  useGSAP(() => {
    if (showModal) {
      const tl = gsap.timeline();
      tl.fromTo('.applicant-profile-modal-overlay',
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      ).fromTo('.applicant-profile-modal-content', 
        { opacity: 0, scale: 0.9, y: 30, rotationX: 15 }, 
        { opacity: 1, scale: 1, y: 0, rotationX: 0, duration: 0.6, ease: 'back.out(1.2)' },
        "-=0.2"
      );
    }
  }, [showModal]);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/applications/${applicationId}/status`, { status: newStatus }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success(`Applicant ${newStatus}`);
      fetchApplicants();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleGenerateScore = async (applicationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/ai/score/${applicationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`AI Score generated: ${response.data.score}%`);
        // Update local state
        setApplicants(applicants.map(app => 
          app._id === applicationId ? { ...app, aiScore: response.data.score, aiFeedback: response.data.feedback } : app
        ));
        
        if (selectedApplicant && selectedApplicant._id === applicationId) {
          setSelectedApplicant(prev => ({ 
            ...prev, 
            aiScore: response.data.score, 
            aiFeedback: response.data.feedback 
          }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate AI score");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#2ecc71'; // Green
    if (score >= 50) return '#f1c40f'; // Yellow/Orange
    return '#e74c3c'; // Red
  };

  const openProfile = async (applicant) => {
    setSelectedApplicant(applicant);
    setShowModal(true);
    
    if (applicant.userId) {
      try {
        setFetchingProfile(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/profile/user/${applicant.userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.data.success) {
          setApplicantProfile(response.data.profile);
        }
      } catch (err) {
        console.error("Failed to fetch applicant profile:", err);
      } finally {
        setFetchingProfile(false);
      }
    }
  };

  const closeProfile = () => {
    setShowModal(false);
    setSelectedApplicant(null);
    setApplicantProfile(null);
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
            if (h.includes('Gap') || h.includes('Weakness')) return '❌';
            if (h.includes('Suggestion') || h.includes('Improvement')) return '💡';
            if (h.includes('Roadmap')) return '🚀';
            if (h.includes('Summary')) return '📝';
            if (h.includes('Score') || h.includes('Quality')) return '📊';
            return '🔹';
          };

          return (
            <div key={index} style={{ marginBottom: '10px' }}>
              {header && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getIcon(header)}</span>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {header}
                  </h4>
                </div>
              )}
              <div style={{ paddingLeft: header ? '32px' : '0' }}>
                {lines.map((line, lIdx) => {
                  const cleanLine = line.replace(/^\s*[-*•]\s+/, "").trim();
                  const isBullet = /^\s*[-*•]/.test(line);
                  
                  if (isBullet) {
                    return (
                      <div key={lIdx} style={{ display: 'flex', gap: '10px', marginBottom: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#6366f1', fontWeight: 'bold' }}>•</span>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: '#334155', fontWeight: '500' }}>
                          {cleanLine}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p key={lIdx} style={{ margin: '0 0 10px 0', fontSize: '0.95rem', lineHeight: '1.6', color: '#334155', fontWeight: '500' }}>
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
    <div className="joblist-container" style={{ 
      backgroundColor: '#0f172a', 
      backgroundImage: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.05), transparent), radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.05), transparent)',
      color: 'white', 
      minHeight: '100vh',
      padding: '40px 60px'
    }}>
      <div className="joblist-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'}}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{color: 'white', margin: 0, fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px'}}>Job Applicants</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '500' }}>Review and shortlist the best talent for your team.</p>
        </div>
        
        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
           <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: showFilters ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: showFilters ? '0 10px 20px rgba(99, 102, 241, 0.3)' : 'none'
            }}
          >
            <span>Filter Applicants</span>
            <span style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
          </button>

          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <span style={{color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600'}}>Sort by:</span>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white', outline: 'none', cursor: 'pointer' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="filter-panel" style={{ 
          background: 'rgba(30, 41, 59, 0.4)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '30px', 
          borderRadius: '24px', 
          marginBottom: '40px', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '25px',
          alignItems: 'end',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Experience</label>
            <select 
              value={filters.experience} 
              onChange={(e) => setFilters({...filters, experience: e.target.value})}
              style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.6)', color: 'white', fontWeight: '600', outline: 'none', transition: 'all 0.3s' }}
            >
              <option value="">Any Experience</option>
              <option value="0-2">0-2 Years</option>
              <option value="2-5">2-5 Years</option>
              <option value="5+">5+ Years</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Skill Keyword</label>
            <input 
              type="text" 
              placeholder="e.g. React, Node.js" 
              value={filters.skill} 
              onChange={(e) => setFilters({...filters, skill: e.target.value})}
              style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.6)', color: 'white', fontWeight: '600', outline: 'none', transition: 'all 0.3s' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Education</label>
            <input 
              type="text" 
              placeholder="e.g. B.Tech, MCA" 
              value={filters.education} 
              onChange={(e) => setFilters({...filters, education: e.target.value})}
              style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.6)', color: 'white', fontWeight: '600', outline: 'none', transition: 'all 0.3s' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Location</label>
            <input 
              type="text" 
              placeholder="e.g. Chennai, Remote" 
              value={filters.location} 
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(15, 23, 42, 0.6)', color: 'white', fontWeight: '600', outline: 'none', transition: 'all 0.3s' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Min Match Score ({filters.score || 0}%)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={filters.score || 0} 
                onChange={(e) => setFilters({...filters, score: e.target.value})}
                style={{ flex: 1, cursor: 'pointer', accentColor: '#6366f1' }}
              />
            </div>
          </div>

          <button 
            onClick={() => setFilters({ experience: '', skill: '', education: '', location: '', score: '' })}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '12px', 
              border: 'none', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              fontWeight: '800', 
              cursor: 'pointer',
              transition: 'all 0.3s',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {loading && <div className="loading-message">Loading applicants...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="jobs-grid">
        {applicants.length === 0 && !loading && <p>No applicants yet for this job.</p>}
        
        {applicants.map(app => (
          <div className="job-card applicant-card" key={app._id} style={{
            cursor: 'default',
            padding: '25px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.98)', /* High-end card feel on dark background */
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            transformStyle: 'preserve-3d',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.borderColor = '#6366f1';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
          }}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '15px'}}>
               {app.profile?.profilePic ? (
                 <img 
                   src={getFullImageUrl(app.profile.profilePic)} 
                   alt="Profile" 
                   style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1', padding: '2px', background: 'white'}}
                 />
               ) : (
                 <img 
                   src={defaultProfile} 
                   alt="Profile" 
                   style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1', padding: '2px', background: 'white'}}
                 />
               )}
               <div style={{flex: 1}}>
                  <h3 style={{margin: 0, fontSize: '1.2rem', color: '#000000'}}>{app.profile?.name || app.applicantName}</h3>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#6366f1', fontSize: '0.85rem' }}>{app.jobTitle} • {app.company}</p>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px'}}>
                    <span className={`status-badge ${app.status}`}>{app.status}</span>
                    {app.aiFeedback && (
                      <span style={{
                        backgroundColor: getScoreColor(app.aiScore),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}>
                        AI: {app.aiScore}%
                      </span>
                    )}
                  </div>
               </div>
            </div>
            
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{app.profile?.email || app.applicantEmail}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Applied:</span>
              <span className="info-value">{new Date(app.appliedAt).toLocaleDateString()}</span>
            </div>

            <div className="info-row" style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
               <button 
                 onClick={() => openProfile(app)}
                 style={{
                   padding: '10px',
                   backgroundColor: '#1e293b',
                   color: '#fff',
                   border: 'none',
                   borderRadius: '8px',
                   cursor: 'pointer',
                   flex: 1,
                   fontWeight: '600'
                 }}
               >
                 View Profile
               </button>
               {!app.aiFeedback && (
                 <button 
                   onClick={() => handleGenerateScore(app._id)}
                   style={{
                     padding: '10px',
                     backgroundColor: '#6366f1',
                     color: '#fff',
                     border: 'none',
                     borderRadius: '8px',
                     cursor: 'pointer',
                     flex: 1,
                     fontWeight: '600'
                   }}
                 >
                   Gen AI Score
                 </button>
               )}
            </div>
            
            <div className="applicant-actions" style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
              {app.status === 'applied' && (
                <>
                  <button 
                    className="apply-btn"
                    style={{backgroundColor: '#2ecc71', flex: 1}}
                    onClick={() => handleUpdateStatus(app._id, 'shortlisted')}
                  >
                    Shortlist
                  </button>
                  <button 
                    className="apply-btn"
                    style={{backgroundColor: '#e74c3c', flex: 1}}
                    onClick={() => handleUpdateStatus(app._id, 'rejected')}
                  >
                    Reject
                  </button>
                </>
              )}
              {app.status === 'shortlisted' && (
                 <button 
                    className="apply-btn"
                    style={{backgroundColor: '#3498db', flex: 1}}
                    onClick={() => handleUpdateStatus(app._id, 'hired')}
                  >
                    Hire Candidate
                  </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Applicant Profile Modal */}
      {showModal && selectedApplicant && (
        <div className="applicant-profile-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }} onClick={closeProfile}>
          <div className="applicant-profile-modal-content" style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            padding: '50px',
            borderRadius: '32px',
            width: '95%',
            maxWidth: '850px',
            maxHeight: '85vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 30px 100px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            perspective: '1000px'
          }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={closeProfile}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
               {/* Avatar Placeholder */}
               {selectedApplicant.profile?.profilePic ? (
                  <img 
                    src={getFullImageUrl(selectedApplicant.profile.profilePic)} 
                    alt="Profile" 
                    style={{width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #6366f1', padding: '3px', background: 'white'}}
                  />
               ) : (
                  <img 
                    src={defaultProfile} 
                    alt="Profile" 
                    style={{width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #6366f1', padding: '3px', background: 'white'}}
                  />
               )}
               <div>
                  <h2 style={{margin: 0, color: '#0f172a', fontSize: '1.8rem'}}>{selectedApplicant.profile?.name || selectedApplicant.applicantName}</h2>
                  <p style={{margin: '5px 0', color: '#64748b', fontWeight: '500'}}>{selectedApplicant.profile?.email || selectedApplicant.applicantEmail}</p>
                  <div style={{display: 'flex', gap: '10px', marginTop: '8px'}}>
                    <span className={`status-badge ${selectedApplicant.status}`}>
                        {selectedApplicant.status}
                    </span>
                    {selectedApplicant.profile?.location && (
                        <span style={{fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px'}}>
                            📍 {selectedApplicant.profile.location}
                        </span>
                    )}
                  </div>
               </div>
            </div>

             <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                {/* AI ANALYSIS SECTION */}
                <h3 style={{marginTop: '10px', marginBottom: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px'}}>AI Compatibility Analysis</h3>
                {selectedApplicant.aiScore > 0 ? (
                  <div style={{
                    padding: '18px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '16px',
                    border: `2px solid ${getScoreColor(selectedApplicant.aiScore)}`,
                    marginBottom: '25px'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                      <span style={{fontWeight: '800', color: '#166534', fontSize: '1.1rem'}}>Match Quality</span>
                      <span style={{ fontSize: '2rem', fontWeight: '900', color: getScoreColor(selectedApplicant.aiScore) }}>{selectedApplicant.aiScore}%</span>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      {renderAiFeedback(selectedApplicant.aiFeedback)}
                    </div>
                  </div>
                ) : (
                  <div style={{padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', marginBottom: '25px', textAlign: 'center', border: '1.5px dashed #e2e8f0'}}>
                     <p style={{color: '#64748b', marginBottom: '12px'}}>No AI analysis generated yet.</p>
                     <button onClick={() => handleGenerateScore(selectedApplicant._id)} style={{ padding: '10px 24px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Generate Analysis</button>
                  </div>
                )}

                {fetchingProfile ? (
                  <p style={{marginTop: '20px', textAlign: 'center', color: '#64748b'}}>Retrieving full profile details...</p>
                ) : applicantProfile ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '25px'}}>
                     {/* ACADEMIC BACKGROUND */}
                     <div style={{padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
                        <h3 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px'}}>🎓 Academic Background</h3>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                           <div style={{padding: '18px', background: 'white', borderRadius: '12px', borderLeft: '5px solid #6366f1', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                              <p style={{margin: '0 0 5px 0', fontSize: '0.8rem', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase'}}>Graduation</p>
                              <h4 style={{margin: '0 0 5px 0', color: '#0f172a', fontSize: '1.1rem'}}>{applicantProfile.degree} in {applicantProfile.department}</h4>
                              <p style={{margin: 0, color: '#475569', fontWeight: '500'}}>{applicantProfile.collagename}</p>
                              <div style={{display: 'flex', gap: '25px', marginTop: '10px'}}>
                                 <span style={{fontSize: '0.9rem', color: '#10b981', fontWeight: '800'}}>GPA: {applicantProfile.collagegpa}</span>
                                 <span style={{fontSize: '0.9rem', color: '#64748b', fontWeight: '600'}}>Batch of {applicantProfile.collagepassout}</span>
                              </div>
                           </div>

                           <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                              <div style={{padding: '15px', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9'}}>
                                 <p style={{margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase'}}>Higher Secondary (12th)</p>
                                 <p style={{margin: 0, fontWeight: '700', color: '#1e293b'}}>{applicantProfile.xigpa} <span style={{color: '#94a3b8', fontWeight: '400', marginLeft: '5px'}}>({applicantProfile.xipassout})</span></p>
                              </div>
                              <div style={{padding: '15px', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9'}}>
                                 <p style={{margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase'}}>Secondary School (10th)</p>
                                 <p style={{margin: 0, fontWeight: '700', color: '#1e293b'}}>{applicantProfile.xgpa} <span style={{color: '#94a3b8', fontWeight: '400', marginLeft: '5px'}}>({applicantProfile.xpassout})</span></p>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* SKILLS */}
                     <div>
                        <h3 style={{marginBottom: '15px', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px'}}>🛠 Technical Arsenal</h3>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                           {applicantProfile.skills?.split(',').map(skill => (
                             <span key={skill} style={{backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid #dbeafe', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.05)'}}>{skill.trim()}</span>
                           )) || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>No skills added.</span>}
                        </div>
                     </div>

                     {/* EXPERIENCE */}
                     {applicantProfile.companyname && (
                        <div style={{padding: '20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
                           <h3 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px'}}>💼 Work Experience</h3>
                           <div style={{borderLeft: '4px solid #6366f1', paddingLeft: '20px'}}>
                              <p style={{margin: 0, fontWeight: '800', color: '#0f172a', fontSize: '1.1rem'}}>{applicantProfile.job}</p>
                              <p style={{margin: '4px 0', color: '#4338ca', fontWeight: '700', fontSize: '1rem'}}>{applicantProfile.companyname}</p>
                              <p style={{margin: '8px 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500'}}>{applicantProfile.jobexpirience} experience</p>
                              {applicantProfile.companycontact && <div style={{margin: '12px 0 0 0', fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', display: 'inline-block'}}>📞 Verification: {applicantProfile.companycontact}</div>}
                           </div>
                        </div>
                     )}

                     {/* INTERNSHIP & PROJECTS */}
                     {(applicantProfile.internname || applicantProfile.projectlink) && (
                        <div style={{padding: '20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
                           <h3 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px'}}>🌱 Projects & Internships</h3>
                           {applicantProfile.internname && (
                              <div style={{marginBottom: '20px', paddingBottom: '15px', borderBottom: applicantProfile.projectlink ? '1px solid #f1f5f9' : 'none'}}>
                                 <p style={{margin: 0, fontWeight: '700', color: '#0f172a', fontSize: '1rem'}}>{applicantProfile.internname}</p>
                                 <p style={{margin: '5px 0', fontSize: '0.9rem', color: '#64748b'}}>{applicantProfile.startdate} — {applicantProfile.enddate}</p>
                                 {applicantProfile.internlink && <a href={applicantProfile.internlink} target="_blank" rel="noopener noreferrer" style={{color: '#6366f1', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block', marginTop: '5px'}}>View Internship Proof →</a>}
                              </div>
                           )}
                           {applicantProfile.projectlink && (
                              <div style={{padding: '15px', backgroundColor: '#fdf2f8', borderRadius: '12px', border: '1px solid #fbcfe8'}}>
                                 <p style={{margin: '0 0 8px 0', fontSize: '0.8rem', color: '#be185d', fontWeight: '800', textTransform: 'uppercase'}}>Featured Project</p>
                                 <a href={applicantProfile.projectlink} target="_blank" rel="noopener noreferrer" style={{color: '#db2777', textDecoration: 'none', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px'}}>Live Demo / Repository <span style={{fontSize: '1.2rem'}}>↗</span></a>
                              </div>
                           )}
                        </div>
                     )}

                     {/* RESUME ACTION */}
                     <div style={{marginTop: '10px', padding: '25px', background: '#0f172a', borderRadius: '20px', textAlign: 'center', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)'}}>
                        <p style={{marginBottom: '15px', fontWeight: '700', color: '#ffffff', fontSize: '1.1rem'}}>Official Resume Document</p>
                        {selectedApplicant.resumeUrl ? (
                          <button 
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                const response = await axios.get(
                                  `http://localhost:5000/resume/view/${selectedApplicant.resumeUrl}`,
                                  {
                                    headers: { 'Authorization': `Bearer ${token}` },
                                    responseType: 'blob'
                                  }
                                );
                                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                                window.open(url, '_blank');
                              } catch (err) {
                                console.error('View error:', err);
                                toast.error('Failed to open resume');
                              }
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 30px', backgroundColor: 'white', color: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                            <span>📄</span> Open Full PDF Resume
                          </button>
                        ) : <p style={{fontStyle: 'italic', color: '#64748b'}}>No resume uploaded by applicant.</p>}
                     </div>
                  </div>
                ) : (
                  <div style={{marginTop: '20px', padding: '25px', backgroundColor: '#fff7ed', borderRadius: '16px', border: '1px solid #ffedd5', textAlign: 'center'}}>
                     <p style={{margin: 0, fontSize: '1rem', color: '#9a3412', fontWeight: '600'}}>Applicant has not completed their full profile yet.</p>
                     <p style={{margin: '5px 0 0 0', fontSize: '0.85rem', color: '#c2410c'}}>Only basic application data and resume are available.</p>
                  </div>
                )}
             </div>

            <div style={{marginTop: '40px', display: 'flex', justifyContent: 'center'}}>
              <button 
                onClick={closeProfile}
                style={{
                  padding: '12px 40px',
                  backgroundColor: '#f5f5f5',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobApplicants;
