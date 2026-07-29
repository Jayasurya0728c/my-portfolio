import React, { useState } from 'react';
import { compressVideoFile } from './videoCompressor';

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
    carousel: false
  });

  const [notification, setNotification] = useState('');

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleFileUpload = async (file, targetField, label) => {
    if (!file) return;

    if (file.type.startsWith('video/')) {
      try {
        setCompressionProgress({ label, progress: 0 });
        const compressedDataUrl = await compressVideoFile(file, (pct) => {
          setCompressionProgress({ label, progress: pct });
        });
        setProjectForm(prev => ({ ...prev, [targetField]: compressedDataUrl }));
        setCompressionProgress(null);
        showToast(`⚡ ${label} compressed & audio removed!`);
      } catch (err) {
        console.error('Video compression error, using raw upload:', err);
        setCompressionProgress(null);
        const reader = new FileReader();
        reader.onload = (e) => {
          setProjectForm(prev => ({ ...prev, [targetField]: e.target.result }));
          showToast(`🎬 ${label} uploaded!`);
        };
        reader.readAsDataURL(file);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProjectForm(prev => ({ ...prev, [targetField]: e.target.result }));
        showToast(`🖼️ ${label} screenshot uploaded!`);
      };
      reader.readAsDataURL(file);
    }
  };


  // Helper to persist updated data immediately to parent and localStorage
  const saveCategoryData = (updatedData, message) => {
    setFormData(updatedData);
    onSave(updatedData);
    showToast(message || '💾 Saved & updated live!');
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
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        wide: !!p.wide,
        carousel: !!p.carousel
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
        tags: 'React, Django, Python',
        wide: false,
        carousel: false
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
          position: 'fixed', bottom: 30, right: 30, zIndex: 10001,
          padding: '0.8rem 1.5rem', background: '#1e293b', border: '1px solid #10b981',
          borderRadius: 10, color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontWeight: 600
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
                        placeholder="e.g. /videos/demo.mp4"
                      />
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


                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            />
          </div>
        )}

        {/* ── SKILLS TAB ── */}
        {activeTab === 'skills' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Manage Skill Groups</h3>
              <button className="admin-btn admin-btn-success" onClick={handleSaveSkills}>
                💾 Save Skills
              </button>
            </div>

            {formData.skillGroups.map((g, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem' }}>
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
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Education</h4>
                {formData.education.map((edu, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem' }}>
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
                      value={edu.desc}
                      onChange={e => {
                        const newEdu = [...formData.education];
                        newEdu[idx].desc = e.target.value;
                        setFormData({ ...formData, education: newEdu });
                      }}
                      placeholder="Duration / Details"
                    />
                  </div>
                ))}
              </div>

              {/* Experience */}
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Experience</h4>
                {formData.experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem' }}>
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
                      style={{ minHeight: '60px' }}
                      value={exp.desc}
                      onChange={e => {
                        const newExp = [...formData.experience];
                        newExp[idx].desc = e.target.value;
                        setFormData({ ...formData, experience: newExp });
                      }}
                      placeholder="Responsibilities / Description"
                    />
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
