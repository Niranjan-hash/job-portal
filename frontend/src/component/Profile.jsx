import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiUser, 
  FiMail, 
  FiMapPin, 
  FiBook, 
  FiBriefcase, 
  FiExternalLink, 
  FiArrowLeft, 
  FiEdit3, 
  FiStar,
  FiCalendar,
  FiAward,
  FiLoader,
  FiSave,
  FiX
} from 'react-icons/fi';
import './profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [apiUrl] = useState('http://localhost:5000');
  
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    xgpa: "",
    xpassout: "",
    xigpa: "",
    xipassout: "",
    collagename: "",
    degree: "",
    department: "",
    collagegpa: "",
    collagepassout: "",
    location: "",
    email: "",
    skills: "",
    internname: "",
    startdate: "",
    enddate: "",
    internlink: "",
    job: "",
    companyname: "",
    jobexpirience: "",
    companycontact: "",
    projectlink: "",
    profilePic: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getAuthToken = () => localStorage.getItem('token') || '';

  const getFullImageUrl = (imageData) => {
    if (!imageData) return '';
    if (typeof imageData === 'string') {
      if (imageData.startsWith('http')) return imageData;
      if (imageData.startsWith('/uploads')) return `${apiUrl}${imageData}`;
      return `${apiUrl}/uploads/profile-pics/${imageData}`;
    }
    return '';
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(`${apiUrl}/profile/my-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.profile) {
        setFormData(response.data.profile);
        setHasProfile(true);
        setEditing(false);
      }
    } catch (error) {
      console.log('No profile found:', error);
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append('profilePic', file);
    
    setUploadingPic(true);
    try {
      const token = getAuthToken();
      const response = await axios.post(`${apiUrl}/profile/upload-profile-pic`, formDataObj, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total))
      });
      
      if (response.data.success) {
        setFormData(prev => ({ ...prev, profilePic: response.data.url || response.data.filename }));
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploadingPic(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAuthToken();
      await axios.post(`${apiUrl}/profile/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasProfile(true);
      setEditing(false);
    } catch (error) {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="pro-spinner"></div>
        <p>Syncing your profile...</p>
      </div>
    );
  }

  const renderField = (label, name, icon, placeholder, type = "text", fullWidth = false) => (
    <div className={`pro-input-group ${fullWidth ? 'full-width' : ''}`}>
      <label>{label}</label>
      {editing ? (
        <input 
          type={type}
          name={name}
          className="pro-input"
          value={formData[name] || ""}
          onChange={handleInputChange}
          placeholder={placeholder}
        />
      ) : (
        <div className="pro-display">{formData[name] || `Not provided`}</div>
      )}
    </div>
  );

  return (
    <div className="search-container">
      <div className="profile">
        <header className="profile-header-pro">
          <button onClick={() => navigate('/dashboard')} className="back-btn-pro">
            <FiArrowLeft /> <span>Return to Dashboard</span>
          </button>
          <h2>{hasProfile ? "Account Profile" : "Complete Your Identity"}</h2>
          {hasProfile && !editing && (
            <button className="edit-button-pro" onClick={() => setEditing(true)}>
              <FiEdit3 /> <span>Update Profile</span>
            </button>
          )}
        </header>

        <form onSubmit={handleSubmit} className="profile-card-group">
          {/* Identity Section */}
          <section className="profile-section-card full-width">
            <div className="section-title"><FiUser /> Identity & Contact</div>
            <div className="pic-upload-layout">
              <div className="pic-preview-circle">
                {formData.profilePic ? (
                  <img src={getFullImageUrl(formData.profilePic)} alt="Avatar" />
                ) : (
                  <div className="profile-pic-placeholder">
                    {formData.name ? formData.name[0].toUpperCase() : <FiUser />}
                  </div>
                )}
              </div>
              {editing && (
                <div className="pic-controls">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{display: 'none'}} 
                    onChange={handleProfilePicUpload}
                  />
                  <button type="button" className="edit-button-pro" onClick={() => fileInputRef.current.click()}>
                    {uploadingPic ? `Uploading ${uploadProgress}%` : "Change Avatar"}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '5px' }}>JPG or PNG, max 2MB</p>
                </div>
              )}
            </div>
            
            <div className="pro-row" style={{marginTop: '30px'}}>
              {renderField("Full Legal Name", "name", <FiUser />, "John Doe")}
              {renderField("Primary Email", "email", <FiMail />, "john@example.com", "email")}
            </div>
            <div className="pro-row">
              {renderField("Date of Birth", "dob", <FiCalendar />, "", "date")}
              {renderField("Current Location", "location", <FiMapPin />, "City, Country")}
            </div>
          </section>

          {/* Education Section */}
          <section className="profile-section-card">
            <div className="section-title"><FiBook /> Academic Background</div>
            {renderField("College / University", "collagename", null, "Harvard University")}
            <div className="pro-row" style={{ marginTop: '15px' }}>
              {renderField("Degree", "degree", null, "Bachelor of Science")}
              {renderField("Department", "department", null, "Computer Science")}
            </div>
            <div className="pro-row" style={{ marginTop: '15px' }}>
              {renderField("College GPA", "collagegpa", null, "3.8")}
              {renderField("Passout Year", "collagepassout", null, "2024")}
            </div>
          </section>

          {/* Professional Presence */}
          <section className="profile-section-card">
            <div className="section-title"><FiBriefcase /> Work Experience</div>
            {renderField("Last Job Title", "job", null, "Software Engineer")}
            {renderField("Last Company", "companyname", null, "Tech Corp Inc.")}
            <div className="pro-row" style={{ marginTop: '15px' }}>
              {renderField("Years Active", "jobexpirience", null, "2")}
              {renderField("Reference Contact", "companycontact", null, "+1 234 567 890")}
            </div>
          </section>

          {/* Specialized Skills */}
          <section className="profile-section-card full-width">
            <div className="section-title"><FiStar /> Specialized Skills & Projects</div>
            <div className="pro-input-group">
                <label>Technical Skills (Comma separated)</label>
                {editing ? (
                    <textarea 
                        name="skills" 
                        className="pro-input" 
                        style={{ height: '100px', resize: 'vertical' }}
                        value={formData.skills || ""} 
                        onChange={handleInputChange}
                        placeholder="React, Node.js, Python, AWS..."
                    />
                ) : (
                    <div className="skills-container">
                        {formData.skills ? formData.skills.split(',').map((s, i) => (
                            <span key={i} className="skill-tag">{s.trim()}</span>
                        )) : "No skills listed"}
                    </div>
                )}
            </div>
            <div className="pro-row" style={{ marginTop: '15px' }}>
               {renderField("Internship Title", "internname", null, "Web Developer Intern")}
               {renderField("Project Link", "projectlink", null, "https://github.com/...", "url")}
            </div>
          </section>

          {editing && (
            <footer className="pro-form-footer">
              <button type="button" className="pro-btn-cancel" onClick={() => setEditing(false)}>
                Cancel Changes
              </button>
              <button type="submit" className="pro-btn-save" disabled={saving}>
                {saving ? "Saving Changes..." : "Save Identity"}
              </button>
            </footer>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;