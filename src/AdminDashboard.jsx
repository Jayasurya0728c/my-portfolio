import React, { useState } from 'react';
import { compressVideoFile } from './videoCompressor';
import { uploadMediaToCloud } from './cloudSync';

export default function AdminDashboard({ portfolioData, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('projects');
  const [formData, setFormData] = useState(portfolioData);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [compressionProgress, setCompressionProgress] = useState(null);
  
  const [projectForm, setProjectForm] = useState({
    title: '',
    subtitle: '',
    desc: '',
    type: 'website', // 'website', 'app', 'both', 'none'
    videoSrc: '',
    imageSrc: '',
    appVideoSrc: '',
    appImageSrc: '',
    githubUrl: '',
    liveUrl: '',
    tags: '',
    wide: false,
    carousel: false,
    screenshots: [],
    appScreenshots: []
  });

  const [notification, setNotification] = useState('');

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleFileUpload = async (file, targetField, label) => {
    if (!file) return;

    if (file.type.startsWith('video/')) {
      const sizeMb = file.size / 1024 / 1024;
      if (sizeMb > 4.19) {
        showToast(`❌ Video is too large (${sizeMb.toFixed(1)}MB). Please compress it to under 4MB (MP4 format) and try again.`);
        return;
      }

      try {
        setCompressionProgress({ label: `${label} (Uploading directly to Global CDN - 0% complete)`, progress: 0 });
        
        // Upload native MP4 video file directly to global CDN
        const cdnUrl = await uploadMediaToCloud(file, file.name || 'video.mp4', (percent) => {
          setCompressionProgress({
            label: `${label} (Uploading directly to Global CDN - ${percent}% complete)`,
            progress: percent
          });
        });
        
        if (cdnUrl) {
          setProjectForm(prev => {
            const updatedForm = { ...prev, [targetField]: cdnUrl };
            if (editingProjectIndex !== null && editingProjectIndex !== 'new') {
              const tagsArray = (updatedForm.tags || '')
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);
              const updatedProject = {
                ...updatedForm,
                carousel: updatedForm.type === 'carousel',
                tags: tagsArray
              };
              const newProjects = [...formData.projects];
              newProjects[editingProjectIndex] = updatedProject;
              const updatedFullData = { ...formData, projects: newProjects };
              saveCategoryData(updatedFullData, `⚡ ${label} uploaded to Global CDN & synced globally!`);
            }
            return updatedForm;
          });
          setCompressionProgress(null);
        } else {
          showToast(`❌ ${label} upload failed. Please verify your connection.`);
          setCompressionProgress(null);
        }
      } catch (err) {
        console.error('Video upload error:', err);
        setCompressionProgress(null);
      }
    } else {
      setCompressionProgress({ label: `${label} (Uploading Image - 0% complete)`, progress: 0 });
      const cdnUrl = await uploadMediaToCloud(file, file.name || 'image.jpg', (percent) => {
        setCompressionProgress({
          label: `${label} (Uploading Image - ${percent}% complete)`,
          progress: percent
        });
      });
      setCompressionProgress(null);
      if (cdnUrl) {
        setProjectForm(prev => {
          const updatedForm = { ...prev, [targetField]: cdnUrl };
          if (editingProjectIndex !== null && editingProjectIndex !== 'new') {
            const tagsArray = (updatedForm.tags || '')
              .split(',')
              .map(t => t.trim())
              .filter(t => t.length > 0);
            const updatedProject = {
              ...updatedForm,
              carousel: updatedForm.type === 'carousel',
              tags: tagsArray
            };
            const newProjects = [...formData.projects];
            newProjects[editingProjectIndex] = updatedProject;
            const updatedFullData = { ...formData, projects: newProjects };
            saveCategoryData(updatedFullData, `🖼️ ${label} uploaded to Global CDN & synced globally!`);
          }
          return updatedForm;
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProjectForm(prev => ({ ...prev, [targetField]: e.target.result }));
          showToast(`🖼️ ${label} screenshot updated! Click "Save Project" below.`);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleScreenshotUpload = async (file, targetField, label) => {
    if (!file) return;
    setCompressionProgress({ label: `${label} (Uploading screenshot...)`, progress: 0 });
    try {
      const cdnUrl = await uploadMediaToCloud(file, file.name || 'screenshot.jpg', (percent) => {
        setCompressionProgress({
          label: `${label} (Uploading screenshot - ${percent}% complete)`,
          progress: percent
        });
      });
      setCompressionProgress(null);
      if (cdnUrl) {
        setProjectForm(prev => {
          const currentList = Array.isArray(prev[targetField]) ? prev[targetField] : [];
          const updatedForm = { ...prev, [targetField]: [...currentList, cdnUrl] };
          showToast(`🖼️ Screenshot added to ${label} gallery!`);
          return updatedForm;
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProjectForm(prev => {
            const currentList = Array.isArray(prev[targetField]) ? prev[targetField] : [];
            const updatedForm = { ...prev, [targetField]: [...currentList, e.target.result] };
            showToast(`🖼️ Screenshot added to ${label} gallery locally!`);
            return updatedForm;
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      setCompressionProgress(null);
    }
  };

  const handleProfilePhotoUpload = async (file) => {
    if (!file) return;
    try {
      setCompressionProgress({ label: 'Profile Photo (Uploading - 0% complete)', progress: 0 });
      const cdnUrl = await uploadMediaToCloud(file, file.name || 'profile.jpg', (percent) => {
        setCompressionProgress({
          label: `Profile Photo (Uploading - ${percent}% complete)`,
          progress: percent
        });
      });
      setCompressionProgress(null);
      if (cdnUrl) {
        const updated = {
          ...formData,
          hero: { ...formData.hero, photoSrc: cdnUrl }
        };
        saveCategoryData(updated, '🖼️ Profile photo uploaded to Global CDN & synced globally!');
      } else {
        showToast('❌ Profile photo upload failed. Please verify your connection.');
      }
    } catch (err) {
      console.error('Profile photo upload error:', err);
      setCompressionProgress(null);
    }
  };



  // Helper to persist updated data immediately to parent and localStorage
  const saveCategoryData = (updatedData, message) => {
    setFormData(updatedData);
    onSave(updatedData);
    showToast(message || '💾 Saved & updated live!');
  };

  // Reordering helpers (for projects, skills, education, experience)
  const moveItemUp = (category, index) => {
    if (index === 0) return;
    const list = [...formData[category]];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    const updated = { ...formData, [category]: list };
    saveCategoryData(updated, '🔼 Item moved up!');
  };

  const moveItemDown = (category, index) => {
    if (index === formData[category].length - 1) return;
    const list = [...formData[category]];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    const updated = { ...formData, [category]: list };
    saveCategoryData(updated, '🔽 Item moved down!');
  };

  // Addition & Deletion helpers
  const addSkillGroup = () => {
    const updated = {
      ...formData,
      skillGroups: [...(formData.skillGroups || []), { label: 'New Group', items: ['Skill 1'] }]
    };
    saveCategoryData(updated, '➕ New skill group added!');
  };

  const deleteSkillGroup = (index) => {
    if (window.confirm('Delete this skill group?')) {
      const updated = {
        ...formData,
        skillGroups: formData.skillGroups.filter((_, i) => i !== index)
      };
      saveCategoryData(updated, '🗑️ Skill group deleted!');
    }
  };

  const addEducationItem = () => {
    const updated = {
      ...formData,
      education: [...(formData.education || []), { role: 'New Degree / Course', org: 'Institution Name', desc: 'Year' }]
    };
    saveCategoryData(updated, '➕ New education entry added!');
  };

  const deleteEducationItem = (index) => {
    if (window.confirm('Delete this education entry?')) {
      const updated = {
        ...formData,
        education: formData.education.filter((_, i) => i !== index)
      };
      saveCategoryData(updated, '🗑️ Education entry deleted!');
    }
  };

  const addExperienceItem = () => {
    const updated = {
      ...formData,
      experience: [...(formData.experience || []), { role: 'New Job Role', org: 'Company Name', desc: 'Duration' }]
    };
    saveCategoryData(updated, '➕ New experience entry added!');
  };

  const deleteExperienceItem = (index) => {
    if (window.confirm('Delete this experience entry?')) {
      const updated = {
        ...formData,
        experience: formData.experience.filter((_, i) => i !== index)
      };
      saveCategoryData(updated, '🗑️ Experience entry deleted!');
    }
  };

  // ── HERO SAVE ─────────────────────────────────────────────────────────────
  const handleSaveHero = () => {
    saveCategoryData(formData, '💾 Hero & Contact info saved!');
  };

  const handleHeroFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  // ── PROJECTS EDITING ──────────────────────────────────────────────────────
  const startEditProject = (index = null) => {
    if (index !== null) {
      const p = formData.projects[index];
      setProjectForm({
        title: p.title || '',
        subtitle: p.subtitle || '',
        desc: p.desc || '',
        type: p.carousel ? 'carousel' : (p.type || 'website'),
        videoSrc: p.videoSrc || '',
        imageSrc: p.imageSrc || '',
        appVideoSrc: p.appVideoSrc || '',
        appImageSrc: p.appImageSrc || '',
        githubUrl: p.githubUrl || '',
        liveUrl: p.liveUrl || '',
        githubLabel: p.githubLabel || '',
        liveLabel: p.liveLabel || '',
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        wide: !!p.wide,
        carousel: !!p.carousel,
        screenshots: Array.isArray(p.screenshots) ? p.screenshots : [],
        appScreenshots: Array.isArray(p.appScreenshots) ? p.appScreenshots : []
      });
      setEditingProjectIndex(index);
    } else {
      setProjectForm({
        title: '',
        subtitle: '',
        desc: '',
        type: 'website',
        videoSrc: '',
        imageSrc: '',
        appVideoSrc: '',
        appImageSrc: '',
        githubUrl: '',
        liveUrl: '',
        githubLabel: '',
        liveLabel: '',
        tags: 'React, Django, Python',
        wide: false,
        carousel: false,
        screenshots: [],
        appScreenshots: []
      });
      setEditingProjectIndex('new');
    }
  };

  const saveCurrentProject = () => {
    if (!projectForm.title.trim()) {
      showToast('⚠️ Project Title is required');
      return;
    }

    const tagsArray = projectForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const isCarousel = projectForm.type === 'carousel';

    const updatedProject = {
      ...projectForm,
      carousel: isCarousel,
      tags: tagsArray
    };

    const newProjects = [...formData.projects];
    if (editingProjectIndex === 'new') {
      newProjects.push(updatedProject);
    } else if (editingProjectIndex !== null) {
      newProjects[editingProjectIndex] = updatedProject;
    }

    const updatedFullData = { ...formData, projects: newProjects };
    saveCategoryData(updatedFullData, `💾 Project "${projectForm.title}" saved!`);
    setEditingProjectIndex(null);
  };


  const deleteProject = (index) => {
    if (window.confirm(`Delete "${formData.projects[index].title}"?`)) {
      const newProjects = formData.projects.filter((_, i) => i !== index);
      const updatedFullData = { ...formData, projects: newProjects };
      saveCategoryData(updatedFullData, '🗑 Project deleted');
    }
  };

  // ── SKILLS SAVE ────────────────────────────────────────────────────────────
  const handleSaveSkills = () => {
    saveCategoryData(formData, '💾 Skill groups saved!');
  };

  // ── EDUCATION & EXPERIENCE SAVE ───────────────────────────────────────────
  const handleSaveEducationExp = () => {
    saveCategoryData(formData, '💾 Education & Experience saved!');
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonString = JSON.stringify(formData, null, 2);
    navigator.clipboard.writeText(jsonString);
    showToast('📋 JSON config copied to clipboard!');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 10000,
      background: 'rgba(10, 10, 15, 0.96)',
      backdropFilter: 'blur(25px)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflowY: 'auto'
    }}>
      <style>{`
        .admin-nav-tab {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          color: #a1a1aa;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s ease;
        }
        .admin-nav-tab.active {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .admin-nav-tab:hover:not(.active) {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }
        .admin-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #fff;
          font-size: 0.95rem;
          margin-bottom: 1rem;
          transition: border-color 0.2s;
        }
        .admin-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .admin-btn {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: transform 0.15s, opacity 0.15s;
        }
        .admin-btn:active {
          transform: scale(0.97);
        }
        .admin-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
        }
        .admin-btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
        }
        .admin-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e4e4e7;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .admin-btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .admin-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .admin-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .admin-grid-2, .admin-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .admin-header-bar {
            padding: 1rem !important;
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.8rem;
          }
          .admin-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .admin-tabs-bar {
            padding: 0.5rem 1rem !important;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .admin-tabs-bar::-webkit-scrollbar {
            display: none;
          }
          .admin-main-container {
            padding: 1rem !important;
          }
        }
      `}</style>


      {/* Header Bar */}
      <div className="admin-header-bar" style={{
        padding: '1.2rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 15, 22, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Portfolio <span style={{ color: '#3b82f6' }}>CMS Editor</span>
          </h2>
          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 600 }}>
            ⚡ Direct Instant Save
          </span>
        </div>

        <div className="admin-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="admin-btn admin-btn-secondary" onClick={handleExportJSON}>
            📋 Copy JSON
          </button>
          <button className="admin-btn admin-btn-primary" onClick={onClose}>
            ✕ Done / Close
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10020,
          padding: '0.8rem 1.8rem',
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid #10b981',
          borderRadius: 50,
          color: '#fff',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          fontWeight: 600,
          fontSize: '0.95rem',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}>
          {notification}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs-bar" style={{
        padding: '0.8rem 2rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        gap: '0.5rem',
        background: 'rgba(20, 20, 30, 0.5)'
      }}>

        <button
          className={`admin-nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          🚀 Projects & Frames ({formData.projects.length})
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'hero' ? 'active' : ''}`}
          onClick={() => setActiveTab('hero')}
        >
          👤 Hero & Contact
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          📝 About Me
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          🛠️ Skills
        </button>
        <button
          className={`admin-nav-tab ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          🎓 Education & Experience
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '2rem', maxWidth: '1000px', width: '100%', margin: '0 auto', flex: 1 }}>

        {/* ── PROJECTS TAB ── */}
        {activeTab === 'projects' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Projects & Device Display Modes</h3>
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                  Select display mode: Website, Mobile App, <strong>Both (Laptop + Phone)</strong>, or Card Only (No Frame)!
                </p>
              </div>
              <button className="admin-btn admin-btn-primary" onClick={() => startEditProject()}>
                + Add New Project
              </button>
            </div>

            {/* Editing Form */}
            {editingProjectIndex !== null && (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#60a5fa' }}>
                  {editingProjectIndex === 'new' ? '✨ Add New Project' : '✏️ Edit Project'}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Project Title</label>
                    <input
                      className="admin-input"
                      value={projectForm.title}
                      onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                      placeholder="e.g. SmartHire"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Subtitle</label>
                    <input
                      className="admin-input"
                      value={projectForm.subtitle}
                      onChange={e => setProjectForm({ ...projectForm, subtitle: e.target.value })}
                      placeholder="e.g. AI Recruitment Platform"
                    />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Description</label>
                <textarea
                  className="admin-input"
                  style={{ minHeight: '90px', resize: 'vertical' }}
                  value={projectForm.desc}
                  onChange={e => setProjectForm({ ...projectForm, desc: e.target.value })}
                  placeholder="Describe key features, stack, and details..."
                />

                <div className="admin-grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>
                      Device Display Mode
                    </label>
                    <select
                      className="admin-input"
                      value={projectForm.type}
                      onChange={e => setProjectForm({ ...projectForm, type: e.target.value })}
                    >
                      <option value="website">💻 Website (Laptop Frame)</option>
                      <option value="app">📱 Mobile App (Smartphone Frame)</option>
                      <option value="both">🌐 & 📱 Both (Laptop + Smartphone Frames Side-by-Side)</option>
                      <option value="carousel">👕 3D Jersey Showcase Carousel</option>
                      <option value="none">🚫 Card Only (No Device Frame)</option>
                    </select>

                  </div>

                  {projectForm.type !== 'none' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>
                        {projectForm.type === 'both' ? '💻 Website Video URL' : 'Video URL / File Path'}
                      </label>
                      <input
                        className="admin-input"
                        value={projectForm.videoSrc}
                        onChange={e => setProjectForm({ ...projectForm, videoSrc: e.target.value })}
                        placeholder="e.g. https://files.catbox.moe/demo.mp4"
                      />
                      {projectForm.videoSrc && projectForm.videoSrc.startsWith('http') && (
                        <div style={{ marginTop: '-0.5rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 600 }}>
                            🟢 Global CDN Stream Active
                          </span>
                          <a
                            href={projectForm.videoSrc}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            🔗 Test Video Link in New Tab
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Video Compression Progress Bar */}
                {compressionProgress && (
                  <div style={{
                    marginBottom: '1.5rem', padding: '1.2rem',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px', color: '#60a5fa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 700 }}>
                      <span>⚡ Compressing {compressionProgress.label} & Stripping Audio Track...</span>
                      <span>{compressionProgress.progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${compressionProgress.progress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                        transition: 'width 0.15s ease'
                      }} />
                    </div>
                  </div>
                )}

                {/* Website Image or File Upload */}
                {projectForm.type !== 'none' && (
                  <div className="admin-grid-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>
                        {projectForm.type === 'both' ? '💻 Website Screenshot Image' : 'Image / Screenshot URL'}
                      </label>
                      <input
                        className="admin-input"
                        value={projectForm.imageSrc}
                        onChange={e => setProjectForm({ ...projectForm, imageSrc: e.target.value })}
                        placeholder="e.g. /images/screenshot.jpg"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>
                        📁 Upload Website Image/Video (Auto-Compresses)
                      </label>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="admin-input"
                        style={{ padding: '0.45rem 0.8rem', cursor: 'pointer' }}
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.type.startsWith('video/')) {
                              handleFileUpload(file, 'videoSrc', 'Website Video');
                            } else {
                              handleFileUpload(file, 'imageSrc', 'Website Image');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Mobile App Media Inputs if type is 'both' */}
                {projectForm.type === 'both' && (
                  <div style={{ padding: '1.2rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', marginBottom: '1.2rem' }}>
                    <h5 style={{ color: '#c084fc', fontWeight: 700, marginBottom: '0.8rem', fontSize: '0.95rem' }}>📱 Mobile App Media (For Dual View)</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Mobile App Video URL</label>
                        <input
                          className="admin-input"
                          value={projectForm.appVideoSrc}
                          onChange={e => setProjectForm({ ...projectForm, appVideoSrc: e.target.value })}
                          placeholder="e.g. /videos/app-demo.mp4"
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Mobile App Screenshot Image</label>
                        <input
                          className="admin-input"
                          value={projectForm.appImageSrc}
                          onChange={e => setProjectForm({ ...projectForm, appImageSrc: e.target.value })}
                          placeholder="e.g. /images/app-screenshot.jpg"
                        />
                      </div>
                    </div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>📁 Or Upload Mobile App Image/Video</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="admin-input"
                      style={{ padding: '0.45rem 0.8rem', cursor: 'pointer' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.type.startsWith('video/')) {
                            handleFileUpload(file, 'appVideoSrc', 'Mobile App Video');
                          } else {
                            handleFileUpload(file, 'appImageSrc', 'Mobile App Image');
                          }
                        }
                      }}
                    />
                  </div>
                )}

                {/* Laptop Screenshots Section */}
                {projectForm.type !== 'none' && (projectForm.type === 'website' || projectForm.type === 'both') && (
                  <div style={{ marginTop: '1rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '0.5rem' }}>
                      💻 Laptop Screenshots Gallery (Auto-slides every 2s)
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                      {(projectForm.screenshots || []).map((src, sIdx) => (
                        <div key={sIdx} style={{ position: 'relative', width: '80px', height: '50px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => {
                              setProjectForm(prev => ({
                                ...prev,
                                screenshots: prev.screenshots.filter((_, i) => i !== sIdx)
                              }));
                            }}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '0 0 0 4px', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 5px' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#71717a', marginBottom: '0.4rem' }}>📁 Add screenshot image file to gallery</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="admin-input"
                      style={{ padding: '0.45rem 0.8rem', cursor: 'pointer', marginBottom: 0 }}
                      onChange={async e => {
                        const files = Array.from(e.target.files);
                        for (const file of files) {
                          await handleScreenshotUpload(file, 'screenshots', 'Laptop');
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>
                )}

                {/* Mobile Screenshots Section */}
                {projectForm.type !== 'none' && (projectForm.type === 'app' || projectForm.type === 'both') && (
                  <div style={{ marginTop: '1rem', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '0.5rem' }}>
                      📱 Mobile App Screenshots Gallery (Auto-slides every 2s)
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                      {(projectForm.appScreenshots || []).map((src, sIdx) => (
                        <div key={sIdx} style={{ position: 'relative', width: '50px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => {
                              setProjectForm(prev => ({
                                ...prev,
                                appScreenshots: prev.appScreenshots.filter((_, i) => i !== sIdx)
                              }));
                            }}
                            style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '0 0 0 4px', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 5px' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: '#71717a', marginBottom: '0.4rem' }}>📁 Add screenshot image file to gallery</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="admin-input"
                      style={{ padding: '0.45rem 0.8rem', cursor: 'pointer', marginBottom: 0 }}
                      onChange={async e => {
                        const files = Array.from(e.target.files);
                        for (const file of files) {
                          await handleScreenshotUpload(file, 'appScreenshots', 'Mobile');
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>
                )}


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>GitHub Repository URL</label>
                    <input
                      className="admin-input"
                      value={projectForm.githubUrl}
                      onChange={e => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                      placeholder="https://github.com/yourname/repo"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Live Demo / APK URL</label>
                    <input
                      className="admin-input"
                      value={projectForm.liveUrl}
                      onChange={e => setProjectForm({ ...projectForm, liveUrl: e.target.value })}
                      placeholder="https://your-demo-url.com"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>GitHub Button Label</label>
                    <input
                      className="admin-input"
                      value={projectForm.githubLabel || ''}
                      onChange={e => setProjectForm({ ...projectForm, githubLabel: e.target.value })}
                      placeholder="e.g. 💻 GitHub Repo"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Live Link Button Label</label>
                    <input
                      className="admin-input"
                      value={projectForm.liveLabel || ''}
                      onChange={e => setProjectForm({ ...projectForm, liveLabel: e.target.value })}
                      placeholder="e.g. 🌐 Live Demo"
                    />
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Tech Stack Tags (Comma-separated)</label>
                <input
                  className="admin-input"
                  value={projectForm.tags}
                  onChange={e => setProjectForm({ ...projectForm, tags: e.target.value })}
                  placeholder="Python, Django, Flutter, React, REST APIs"
                />

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={projectForm.wide}
                      onChange={e => setProjectForm({ ...projectForm, wide: e.target.checked })}
                    />
                    Full Width Card Layout
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="admin-btn admin-btn-secondary" onClick={() => setEditingProjectIndex(null)}>
                    Cancel
                  </button>
                  <button className="admin-btn admin-btn-success" onClick={saveCurrentProject}>
                    💾 Save Project
                  </button>
                </div>
              </div>
            )}

            {/* List of existing projects */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formData.projects.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.2rem 1.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.title}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: p.type === 'both' ? 'rgba(34, 197, 94, 0.2)' : p.type === 'app' ? 'rgba(168, 85, 247, 0.2)' : p.type === 'none' ? 'rgba(113, 113, 122, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: p.type === 'both' ? '#4ade80' : p.type === 'app' ? '#c084fc' : p.type === 'none' ? '#a1a1aa' : '#60a5fa'
                      }}>
                        {p.type === 'both' ? '🌐 & 📱 Both (Web + Mobile App)' : p.type === 'app' ? '📱 Mobile App' : p.type === 'none' ? '🚫 Card Only' : '💻 Website'}
                      </span>
                    </div>
                    <p style={{ color: '#a1a1aa', fontSize: '0.88rem' }}>{p.subtitle}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="admin-btn admin-btn-secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => moveItemUp('projects', idx)} disabled={idx === 0}>
                      🔼
                    </button>
                    <button className="admin-btn admin-btn-secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => moveItemDown('projects', idx)} disabled={idx === formData.projects.length - 1}>
                      🔽
                    </button>
                    <button className="admin-btn admin-btn-secondary" onClick={() => startEditProject(idx)}>
                      ✏️ Edit
                    </button>
                    <button className="admin-btn admin-btn-danger" onClick={() => deleteProject(idx)}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HERO & PERSONAL TAB ── */}
        {activeTab === 'hero' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Hero Header & Contact Info</h3>
              <button className="admin-btn admin-btn-success" onClick={handleSaveHero}>
                💾 Save Hero Info
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}>
                {formData.hero?.photoSrc ? (
                  <img src={formData.hero.photoSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.75rem', color: '#a1a1aa' }}>No Photo</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Profile Picture (Direct Upload to CDN)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="admin-input"
                  style={{ marginBottom: '0.5rem', cursor: 'pointer', padding: '0.35rem 0.5rem' }}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      handleProfilePhotoUpload(file);
                    }
                  }}
                />
                <input
                  className="admin-input"
                  value={formData.hero?.photoSrc || ''}
                  onChange={e => handleHeroFieldChange('photoSrc', e.target.value)}
                  placeholder="Or paste an external image URL here..."
                />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Full Name</label>
            <input
              className="admin-input"
              value={formData.hero?.name || ''}
              onChange={e => handleHeroFieldChange('name', e.target.value)}
            />

            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Title / Role</label>
            <input
              className="admin-input"
              value={formData.hero?.title || ''}
              onChange={e => handleHeroFieldChange('title', e.target.value)}
            />

            <div className="admin-grid-3">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Location</label>
                <input
                  className="admin-input"
                  value={formData.hero?.location || ''}
                  onChange={e => handleHeroFieldChange('location', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Email</label>
                <input
                  className="admin-input"
                  value={formData.hero?.email || ''}
                  onChange={e => handleHeroFieldChange('email', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Phone</label>
                <input
                  className="admin-input"
                  value={formData.hero?.phone || ''}
                  onChange={e => handleHeroFieldChange('phone', e.target.value)}
                />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Status Pill Text</label>
            <input
              className="admin-input"
              value={formData.hero?.status || ''}
              onChange={e => handleHeroFieldChange('status', e.target.value)}
              style={{ marginBottom: '1.5rem' }}
            />

            <div className="admin-grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Instagram Profile URL</label>
                <input
                  className="admin-input"
                  value={formData.hero?.instagramUrl || ''}
                  onChange={e => handleHeroFieldChange('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Resume PDF Link / File Path</label>
                <input
                  className="admin-input"
                  value={formData.hero?.resumeUrl || ''}
                  onChange={e => handleHeroFieldChange('resumeUrl', e.target.value)}
                  placeholder="e.g. /resume.pdf"
                />
              </div>
            </div>

            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', color: '#f5b400' }}>Section Headings</h4>
            <div className="admin-grid-2" style={{ gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Projects Section Header</label>
                <input
                  className="admin-input"
                  value={formData.sectionHeaders?.projects || 'Featured projects'}
                  onChange={e => setFormData({
                    ...formData,
                    sectionHeaders: { ...formData.sectionHeaders, projects: e.target.value }
                  })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Education Section Header</label>
                <input
                  className="admin-input"
                  value={formData.sectionHeaders?.education || 'Education'}
                  onChange={e => setFormData({
                    ...formData,
                    sectionHeaders: { ...formData.sectionHeaders, education: e.target.value }
                  })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Experience Section Header</label>
                <input
                  className="admin-input"
                  value={formData.sectionHeaders?.experience || 'Experience'}
                  onChange={e => setFormData({
                    ...formData,
                    sectionHeaders: { ...formData.sectionHeaders, experience: e.target.value }
                  })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Skills Section Header</label>
                <input
                  className="admin-input"
                  value={formData.sectionHeaders?.skills || 'Skills'}
                  onChange={e => setFormData({
                    ...formData,
                    sectionHeaders: { ...formData.sectionHeaders, skills: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── ABOUT ME TAB ── */}
        {activeTab === 'about' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Edit About Me Section</h3>
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>Customize your professional bio, heading, and featured tech tags.</p>
              </div>
              <button className="admin-btn admin-btn-success" onClick={() => saveCategoryData(formData, '💾 About Me info saved!')}>
                💾 Save About Me
              </button>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Section Subheading</label>
              <input
                className="admin-input"
                value={formData.about?.subheading || ''}
                onChange={e => setFormData({
                  ...formData,
                  about: { ...formData.about, subheading: e.target.value }
                })}
                placeholder="e.g. About me"
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Section Main Heading</label>
              <textarea
                className="admin-input"
                style={{ minHeight: '60px' }}
                value={formData.about?.heading || ''}
                onChange={e => setFormData({
                  ...formData,
                  about: { ...formData.about, heading: e.target.value }
                })}
                placeholder="e.g. Building the web,&#10;one layer at a time."
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Bio / Description Paragraph</label>
              <textarea
                className="admin-input"
                style={{ minHeight: '120px', resize: 'vertical' }}
                value={formData.about?.desc || ''}
                onChange={e => setFormData({
                  ...formData,
                  about: { ...formData.about, desc: e.target.value }
                })}
                placeholder="Write your main professional story here..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '0.4rem' }}>Featured Tech Tags (Comma-separated)</label>
              <input
                className="admin-input"
                value={Array.isArray(formData.about?.techTags) ? formData.about.techTags.join(', ') : formData.about?.techTags || ''}
                onChange={e => {
                  const tagsArr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setFormData({
                    ...formData,
                    about: { ...formData.about, techTags: tagsArr }
                  });
                }}
                placeholder="e.g. Python, Django, React, REST APIs, Flutter"
              />
            </div>
          </div>
        )}

        {/* ── SKILLS TAB ── */}
        {activeTab === 'skills' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Manage Skill Groups</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="admin-btn admin-btn-primary" onClick={addSkillGroup}>
                  ➕ Add Skill Group
                </button>
                <button className="admin-btn admin-btn-success" onClick={handleSaveSkills}>
                  💾 Save Skills
                </button>
              </div>
            </div>

            {formData.skillGroups.map((g, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '1rem', alignItems: 'center' }}>
                  <input
                    className="admin-input"
                    value={g.label}
                    onChange={e => {
                      const newGroups = [...formData.skillGroups];
                      newGroups[idx].label = e.target.value;
                      setFormData({ ...formData, skillGroups: newGroups });
                    }}
                    placeholder="Group Label"
                  />
                  <input
                    className="admin-input"
                    value={Array.isArray(g.items) ? g.items.join(', ') : g.items}
                    onChange={e => {
                      const itemsArr = e.target.value.split(',').map(s => s.trim());
                      const newGroups = [...formData.skillGroups];
                      newGroups[idx].items = itemsArr;
                      setFormData({ ...formData, skillGroups: newGroups });
                    }}
                    placeholder="Comma separated skills..."
                  />
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="admin-btn admin-btn-secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => moveItemUp('skillGroups', idx)} disabled={idx === 0}>
                      🔼
                    </button>
                    <button className="admin-btn admin-btn-secondary" style={{ padding: '0.35rem 0.6rem' }} onClick={() => moveItemDown('skillGroups', idx)} disabled={idx === formData.skillGroups.length - 1}>
                      🔽
                    </button>
                    <button className="admin-btn admin-btn-danger" style={{ padding: '0.35rem 0.6rem' }} onClick={() => deleteSkillGroup(idx)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EXPERIENCE & EDUCATION TAB ── */}
        {activeTab === 'experience' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Education & Experience</h3>
              <button className="admin-btn admin-btn-success" onClick={handleSaveEducationExp}>
                💾 Save Timeline Info
              </button>
            </div>

            <div className="admin-grid-2" style={{ gap: '1.5rem' }}>
              {/* Education */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Education</h4>
                  <button className="admin-btn admin-btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={addEducationItem}>
                    ➕ Add Education
                  </button>
                </div>
                {formData.education.map((edu, idx) => (
                  <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <input
                      className="admin-input"
                      style={{ marginBottom: '0.4rem' }}
                      value={edu.role}
                      onChange={e => {
                        const newEdu = [...formData.education];
                        newEdu[idx].role = e.target.value;
                        setFormData({ ...formData, education: newEdu });
                      }}
                      placeholder="Degree / Course"
                    />
                    <input
                      className="admin-input"
                      style={{ marginBottom: '0.4rem' }}
                      value={edu.org}
                      onChange={e => {
                        const newEdu = [...formData.education];
                        newEdu[idx].org = e.target.value;
                        setFormData({ ...formData, education: newEdu });
                      }}
                      placeholder="Institution"
                    />
                    <input
                      className="admin-input"
                      style={{ marginBottom: '0.6rem' }}
                      value={edu.desc}
                      onChange={e => {
                        const newEdu = [...formData.education];
                        newEdu[idx].desc = e.target.value;
                        setFormData({ ...formData, education: newEdu });
                      }}
                      placeholder="Duration / Details"
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => moveItemUp('education', idx)} disabled={idx === 0}>
                        🔼 Up
                      </button>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => moveItemDown('education', idx)} disabled={idx === formData.education.length - 1}>
                        🔽 Down
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => deleteEducationItem(idx)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Experience */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Experience</h4>
                  <button className="admin-btn admin-btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={addExperienceItem}>
                    ➕ Add Experience
                  </button>
                </div>
                {formData.experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <input
                      className="admin-input"
                      style={{ marginBottom: '0.4rem' }}
                      value={exp.role}
                      onChange={e => {
                        const newExp = [...formData.experience];
                        newExp[idx].role = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }}
                      placeholder="Role"
                    />
                    <input
                      className="admin-input"
                      style={{ marginBottom: '0.4rem' }}
                      value={exp.org}
                      onChange={e => {
                        const newExp = [...formData.experience];
                        newExp[idx].org = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }}
                      placeholder="Company"
                    />
                    <textarea
                      className="admin-input"
                      style={{ minHeight: '60px', marginBottom: '0.6rem' }}
                      value={exp.desc}
                      onChange={e => {
                        const newExp = [...formData.experience];
                        newExp[idx].desc = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }}
                      placeholder="Responsibilities / Description"
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => moveItemUp('experience', idx)} disabled={idx === 0}>
                        🔼 Up
                      </button>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => moveItemDown('experience', idx)} disabled={idx === formData.experience.length - 1}>
                        🔽 Down
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => deleteExperienceItem(idx)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
