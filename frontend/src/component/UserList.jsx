import React, { useState } from 'react';
import './joblist.css'; // Reusing joblist CSS for grid and cards

function UserList({ users, loading, error, hideSearchbar }) {
  const [selectedUser, setSelectedUser] = useState(null);

  if (selectedUser) {
    return (
      <div className="full">
        <button 
          className="back-btn" 
          onClick={() => {
            setSelectedUser(null);
          }}
        >
          Back to Users
        </button>
        <div className="job_detail">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            {selectedUser.profilePic && selectedUser.profilePic.filename ? (
              <img 
                src={`http://localhost:5000/uploads/profile-pics/${selectedUser.profilePic.filename}`} 
                alt="Profile" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#4B79A1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px' }}>
                {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <h1 className="title" style={{ margin: 0, padding: 0 }}>{selectedUser.name}</h1>
              <p style={{ color: '#666', marginTop: '5px' }}>{selectedUser.email}</p>
            </div>
          </div>
          
          <p>
            <b>Degree:</b> 
            <span>{selectedUser.degree || "Not specified"}</span>
          </p>
          
          <p>
            <b>Department:</b> 
            <span>{selectedUser.department || "Not specified"}</span>
          </p>

          <p>
            <b>College:</b> 
            <span>{selectedUser.collagename || "Not specified"}</span>
          </p>
          
          <p>
            <b>Location:</b> 
            <span>{selectedUser.location || "Not specified"}</span>
          </p>

          <p>
            <b>Skills:</b> 
            <span>{selectedUser.skills || "Not specified"}</span>
          </p>

          <p>
            <b>Current/Past Job:</b> 
            <span>{selectedUser.job || "Not specified"}</span> - <span>{selectedUser.companyname || ""}</span>
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="joblist-container" style={{ marginTop: '30px' }}>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Found User Profiles</h2>

      {loading && (
        <div className="loading-message">
          <div className="loader"></div>
          Loading users...
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && users.length === 0 && (
         <div style={{textAlign: 'center', margin: '20px', color: '#666'}}>
           No users found matching your search.
         </div>
      )}

      <div className="jobs-grid">
        {users.map(user => (
          <div
            className="job-card"
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              if (hideSearchbar) hideSearchbar();
            }}
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              {user.profilePic && user.profilePic.filename ? (
                <img 
                  src={`http://localhost:5000/uploads/profile-pics/${user.profilePic.filename}`} 
                  alt="Profile" 
                  style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#4B79A1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{user.name}</h3>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>{user.email}</span>
              </div>
            </div>
            
            <div className="info-row">
              <span className="info-label">Degree:</span>
              <span className="info-value">{user.degree || 'N/A'}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">College:</span>
              <span className="info-value">{user.collagename || 'N/A'}</span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Location:</span>
              <span className="info-value">{user.location || 'N/A'}</span>
            </div>
            
            <button className="view-details-btn" style={{ marginTop: 'auto' }}>
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserList;
