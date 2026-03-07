import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './projectshowroom.css';
import { FiPlus, FiTrash2, FiExternalLink, FiGithub, FiFolder } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const ProjectShowroom = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', link: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/profile/my-profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.profile.projects) {
        setProjects(res.data.profile.projects);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useGSAP(() => {
    if (!loading && projects.length > 0) {
      gsap.fromTo('.project-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' });
    }
    gsap.fromTo('.showroom-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
  }, [loading, projects]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title) return;

    try {
      const token = localStorage.getItem('token');
      const updatedProjects = [...projects, newProject];
      
      const res = await axios.post('http://localhost:5000/profile/create', 
        { projects: updatedProjects },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setProjects(updatedProjects);
        setNewProject({ title: '', description: '', link: '' });
        setIsAdding(false);
        toast.success("Project added successfully!");
      }
    } catch (err) {
      toast.error("Failed to add project");
    }
  };

  const handleDeleteProject = async (index) => {
    try {
      const token = localStorage.getItem('token');
      const updatedProjects = projects.filter((_, i) => i !== index);
      
      const res = await axios.post('http://localhost:5000/profile/create', 
        { projects: updatedProjects },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setProjects(updatedProjects);
        toast.success("Project removed");
      }
    } catch (err) {
      toast.error("Failed to remove project");
    }
  };

  if (loading) return <div className="showroom-loading">Loading Portfolio...</div>;

  return (
    <div className="project-showroom">
      <div className="showroom-header">
        <div>
          <button onClick={() => window.history.back()} style={{ marginBottom: '15px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Back to Dashboard
          </button>
          <h1>Project Showroom</h1>
          <p style={{ color: '#94a3b8' }}>Highlight your best work to potential employers</p>
        </div>
        <button className="add-project-btn" onClick={() => setIsAdding(!isAdding)}>
          <FiPlus /> Add Project
        </button>
      </div>

      {isAdding && (
        <form className="add-project-form card-rich" onSubmit={handleAddProject}>
          <h3>New Project</h3>
          <div className="form-grid">
            <input 
              type="text" 
              placeholder="Project Title" 
              value={newProject.title}
              onChange={(e) => setNewProject({...newProject, title: e.target.value})}
              required
            />
            <input 
              type="text" 
              placeholder="Link (GitHub, Demo, etc.)" 
              value={newProject.link}
              onChange={(e) => setNewProject({...newProject, link: e.target.value})}
            />
            <textarea 
              placeholder="Short Description" 
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setIsAdding(false)}>Cancel</button>
            <button type="submit" className="save-btn">Save Project</button>
          </div>
        </form>
      )}

      <div className="projects-grid">
        {projects.length === 0 && !isAdding && (
          <div className="empty-showroom">
            <FiFolder className="empty-icon" />
            <p>No projects added yet. Start showcasing your work!</p>
          </div>
        )}
        {projects.map((project, index) => (
          <div key={index} className="project-card card-rich">
            <div className="project-card-header">
              <FiFolder className="folder-icon" />
              <button className="delete-proj-btn" onClick={() => handleDeleteProject(index)}>
                <FiTrash2 />remove
              </button>
            </div>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
                View Project <FiExternalLink />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectShowroom;
