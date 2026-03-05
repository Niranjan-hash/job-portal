import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../component/joblist.css'; // Reusing joblist css

function JobApplicants() {
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

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
         navigate('/login');
         return;
      }

      const response = await axios.get(`http://localhost:5000/api/applications/job/${jobId}`, {
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

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/applications/${applicationId}/status`, 
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      toast.success(`Applicant ${newStatus} successfully!`);
      
      // Update local state
      setApplicants(applicants.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      // Close modal if open
      if (selectedApplicant && selectedApplicant._id === applicationId) {
        setSelectedApplicant(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
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

  return (
    <div className="joblist-container">
      <div className="joblist-header">
        <h1>Job Applicants</h1>
      </div>

      {loading && <div className="loading-message">Loading applicants...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="jobs-grid">
        {applicants.length === 0 && !loading && <p>No applicants yet for this job.</p>}
        
        {applicants.map(app => (
          <div className="job-card applicant-card" key={app._id} style={{cursor: 'default'}}>
            <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '15px'}}>
               {app.profile?.profilePic?.filename ? (
                 <img 
                   src={`http://localhost:5000/uploads/profile-pics/${app.profile.profilePic.filename}`} 
                   alt="Profile" 
                   style={{width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3498db'}}
                 />
               ) : (
                 <div style={{
                   width: '50px', 
                   height: '50px', 
                   borderRadius: '50%', 
                   backgroundColor: '#3498db',
                   color: 'white',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '20px',
                   fontWeight: 'bold'
                 }}>
                   {(app.profile?.name || app.applicantName).charAt(0).toUpperCase()}
                 </div>
               )}
               <div style={{flex: 1}}>
                  <h3 style={{margin: 0, fontSize: '1.2rem'}}>{app.profile?.name || app.applicantName}</h3>
                  <span className={`status-badge ${app.status}`} style={{marginTop: '4px'}}>{app.status}</span>
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

            <div className="info-row" style={{marginTop: '10px'}}>
               <button 
                 onClick={() => openProfile(app)}
                 style={{
                   padding: '8px 12px',
                   backgroundColor: '#333',
                   color: '#fff',
                   border: 'none',
                   borderRadius: '4px',
                   cursor: 'pointer',
                   width: '100%'
                 }}
               >
                 View Full Profile
               </button>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={closeProfile}>
          <div style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
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
               {selectedApplicant.profile?.profilePic?.filename ? (
                  <img 
                    src={`http://localhost:5000/uploads/profile-pics/${selectedApplicant.profile.profilePic.filename}`} 
                    alt="Profile" 
                    style={{width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3498db'}}
                  />
               ) : (
                 <div style={{
                   width: '70px', 
                   height: '70px', 
                   borderRadius: '50%', 
                   backgroundColor: '#3498db',
                   color: 'white',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '28px',
                   fontWeight: 'bold'
                 }}>
                   {(selectedApplicant.profile?.name || selectedApplicant.applicantName).charAt(0).toUpperCase()}
                 </div>
               )}
               <div>
                  <h2 style={{margin: 0}}>{selectedApplicant.profile?.name || selectedApplicant.applicantName}</h2>
                  <p style={{margin: '5px 0', color: '#666'}}>{selectedApplicant.profile?.email || selectedApplicant.applicantEmail}</p>
                  <span className={`status-badge ${selectedApplicant.status}`} style={{marginTop: '5px', display: 'inline-block'}}>
                    {selectedApplicant.status}
                  </span>
               </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
               <h3>Application Details</h3>
               <p><strong>Job Title:</strong> {selectedApplicant.jobTitle}</p>
               <p><strong>Applied On:</strong> {new Date(selectedApplicant.appliedAt).toLocaleDateString()}</p>
               
               <h3 style={{marginTop: '20px'}}>Resume</h3>
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
                   style={{
                     display: 'inline-block',
                     padding: '10px 15px',
                     backgroundColor: '#f1f1f1',
                     color: '#333',
                     border: '1px solid #ddd',
                     borderRadius: '4px',
                     cursor: 'pointer'
                   }}
                 >
                   Open Resume PDF
                 </button>
               ) : (
                 <p style={{fontStyle: 'italic', color: '#999'}}>No resume uploaded.</p>
               )}

               {fetchingProfile ? (
                 <p style={{marginTop: '20px', color: '#666'}}>Loading profile details...</p>
               ) : applicantProfile ? (
                 <div style={{marginTop: '25px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                    <h3 style={{marginTop: 0, marginBottom: '15px', color: '#1e293b', fontSize: '1.1rem', borderBottom: '2px solid #3498db', display: 'inline-block', paddingBottom: '2px'}}>Full Background</h3>
                    
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                      <div>
                        <p style={{margin: '5px 0', fontSize: '0.9rem', color: '#64748b'}}>Degree & Dept</p>
                        <p style={{margin: 0, fontWeight: '600', color: '#1e293b'}}>{applicantProfile.degree} ({applicantProfile.department})</p>
                      </div>
                      <div>
                        <p style={{margin: '5px 0', fontSize: '0.9rem', color: '#64748b'}}>College GPA</p>
                        <p style={{margin: 0, fontWeight: '600', color: '#1e293b'}}>{applicantProfile.collagegpa} ({applicantProfile.collagepassout})</p>
                      </div>
                    </div>

                    <div style={{marginBottom: '15px'}}>
                      <p style={{margin: '5px 0', fontSize: '0.9rem', color: '#64748b'}}>Key Skills</p>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                        {applicantProfile.skills?.split(',').map(skill => (
                          <span key={skill} style={{backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: '500'}}>{skill.trim()}</span>
                        )) || 'No skills listed'}
                      </div>
                    </div>

                    {applicantProfile.companyname && (
                      <div style={{marginBottom: '15px', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', borderLeft: '4px solid #3498db'}}>
                        <p style={{margin: '0 0 5px 0', fontSize: '0.9rem', fontWeight: '600', color: '#1e293b'}}>Experience: {applicantProfile.job}</p>
                        <p style={{margin: 0, fontSize: '0.85rem', color: '#64748b'}}>{applicantProfile.companyname} • {applicantProfile.jobexpirience}</p>
                        <p style={{margin: '5px 0 0 0', fontSize: '0.85rem', color: '#64748b'}}>{applicantProfile.startdate} - {applicantProfile.enddate}</p>
                      </div>
                    )}

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                      {applicantProfile.xgpa && (
                        <div>
                          <p style={{margin: '5px 0', fontSize: '0.85rem', color: '#64748b'}}>10th ({applicantProfile.xpassout})</p>
                          <p style={{margin: 0, fontWeight: '500', color: '#1e293b'}}>GPA: {applicantProfile.xgpa}</p>
                        </div>
                      )}
                      {applicantProfile.xigpa && (
                        <div>
                          <p style={{margin: '5px 0', fontSize: '0.85rem', color: '#64748b'}}>12th/Dip ({applicantProfile.xipassout})</p>
                          <p style={{margin: 0, fontWeight: '500', color: '#1e293b'}}>GPA: {applicantProfile.xigpa}</p>
                        </div>
                      )}
                    </div>
                    
                    {applicantProfile.projectlink && (
                      <div style={{marginTop: '15px'}}>
                        <p style={{margin: '5px 0', fontSize: '0.9rem', color: '#64748b'}}>Portfolio/Project</p>
                        <a href={applicantProfile.projectlink} target="_blank" rel="noopener noreferrer" style={{color: '#3498db', textDecoration: 'none', fontSize: '0.9rem'}}>View Project Link</a>
                      </div>
                    )}
                 </div>
               ) : (
                 <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5'}}>
                    <p style={{margin: 0, fontSize: '0.9rem', color: '#9a3412'}}>No detailed profile found for this applicant.</p>
                 </div>
               )}
            </div>

            <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
              <button 
                onClick={closeProfile}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f1f1',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobApplicants;
