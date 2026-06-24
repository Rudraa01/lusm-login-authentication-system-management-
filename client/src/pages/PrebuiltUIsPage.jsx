import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Download, LayoutTemplate, Code, Eye, MonitorPlay, CheckCircle, Share2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import './DashboardPages.css';
import './LandingPage.css';

export default function PrebuiltUIsPage({ isPublic = false }) {
  const navigate = useNavigate();
  const { developer } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [uis, setUis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedUi, setSelectedUi] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile
  const [downloading, setDownloading] = useState(false);
  const iframeRef = useRef(null);
  
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchUis();
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const updateSize = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const padding = 48; // 24px padding on each side
        setContainerSize({
          width: Math.max(rect.width - padding, 200),
          height: Math.max(rect.height - padding, 200)
        });
      }
    };

    updateSize();
    
    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
    };
  }, [selectedUi, previewMode]);

  const fetchUis = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/ui');
      if (res.data.success) {
        setUis(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedUi(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch UIs', err);
      setError('Failed to load UI templates.');
    } finally {
      setLoading(false);
    }
  };

  const getIframeSource = (ui) => {
    if (!ui) return '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Preview</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', sans-serif;
            background-color: #0f172a; /* Match our dark theme */
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          * { box-sizing: border-box; }
          ${ui.cssCode || ''}
        </style>
      </head>
      <body>
        ${ui.htmlCode || ''}
        <script>
          // Secure Preview Sandbox Protection: Intercept actions to prevent recursive iframe navigation
          (function() {
            function showToast(message) {
              const existing = document.getElementById('preview-security-toast');
              if (existing) existing.remove();

              const toast = document.createElement('div');
              toast.id = 'preview-security-toast';
              toast.textContent = message;
              toast.style.position = 'fixed';
              toast.style.bottom = '24px';
              toast.style.left = '50%';
              toast.style.transform = 'translateX(-50%)';
              toast.style.backgroundColor = '#1e293b';
              toast.style.color = '#38bdf8';
              toast.style.border = '1px solid #38bdf833';
              toast.style.padding = '10px 20px';
              toast.style.borderRadius = '8px';
              toast.style.fontSize = '13px';
              toast.style.fontWeight = '500';
              toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
              toast.style.zIndex = '999999';
              toast.style.fontFamily = 'Inter, sans-serif';
              toast.style.textAlign = 'center';
              toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
              
              document.body.appendChild(toast);
              setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 200);
              }, 2500);
            }

            // Prevent all link navigations
            document.addEventListener('click', function(e) {
              const link = e.target.closest('a');
              if (link) {
                e.preventDefault();
                showToast('Link navigation is disabled in interactive preview mode.');
              }
            }, true);

            // Prevent all form submissions (e.g. login submit)
            document.addEventListener('submit', function(e) {
              e.preventDefault();
              showToast('Form submission simulated successfully!');
            }, true);
          })();

          // User's custom scripts
          try {
            ${ui.jsCode || ''}
          } catch (err) {
            console.error('Error in UI preview script:', err);
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleDownload = async (ui) => {
    if (!ui) return;
    
    if (isPublic && !developer) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      setDownloading(true);
      const zip = new JSZip();
      
      // HTML
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ui.title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${ui.htmlCode || ''}
  <script src="script.js"></script>
</body>
</html>`;
      zip.file("index.html", htmlContent);
      
      // CSS
      if (ui.cssCode) {
        zip.file("style.css", ui.cssCode);
      } else {
        zip.file("style.css", "/* Add your styles here */\n");
      }
      
      // JS
      if (ui.jsCode) {
        zip.file("script.js", ui.jsCode);
      } else {
        zip.file("script.js", "// Add your scripts here\n");
      }
      
      // React
      if (ui.reactCode) {
        zip.file(`${ui.title.replace(/\s+/g, '')}Component.jsx`, ui.reactCode);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `autheasy-${ui.title.toLowerCase().replace(/\s+/g, '-')}.zip`);
      
    } catch (error) {
      console.error("Error generating zip", error);
      alert("Failed to download ZIP file");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = (ui) => {
    if (!ui) return;
    const shareUrl = `${window.location.origin}/preview/${ui.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard! 🚀');
  };

  const targetWidth = previewMode === 'desktop' ? 1280 : 375;
  const targetHeight = previewMode === 'desktop' ? 800 : 667;

  const scaleX = containerSize.width / targetWidth;
  const scaleY = containerSize.height / targetHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const frameWidth = targetWidth * scale;
  const frameHeight = targetHeight * scale;

  return (
    <div style={{ minHeight: isPublic ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', background: '#070b13', width: '100%' }}>
      {isPublic && (
        <nav className="landing-nav" style={{ position: 'sticky', top: 0 }}>
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <div className="logo-icon">
                <img src="/logo.png" alt="AuthEasy" className="logo-img" />
              </div>
            </Link>
            <div className="nav-links">
              <Link to="/templates" style={{ color: 'var(--text-white)' }}>UI Templates</Link>
              <a href="/#features">Features</a>
              <a href="/#how-it-works">How it Works</a>
              <a href="/#code">Integration</a>
              {developer ? (
                <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">Login</Link>
                  <Link to="/signup" className="btn btn-primary">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      <div 
        className="dashboard-page animate-fade-in" 
        style={{ 
          height: isPublic ? 'calc(100vh - 70px)' : 'calc(100vh - 80px)', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          padding: isPublic ? '24px 24px 12px 24px' : '0px',
          maxWidth: isPublic ? '1400px' : 'none',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <div className="dashboard-page-header" style={{ marginBottom: '16px', flexShrink: 0 }}>
          <div>
            <h1 className="page-title">Pre-built UIs</h1>
            <p className="page-subtitle">Ready-to-use authentication components for your projects.</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading UI library...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : uis.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <LayoutTemplate size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', margin: '0 auto', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No UIs Available Yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Check back later for pre-built components.</p>
          </div>
        ) : (
          <div className="ui-library-container">
            
            {/* Left Sidebar - List of UIs */}
            <div className="ui-list-sidebar">
              {uis.map((ui, idx) => (
                <div 
                  key={ui.id}
                  onClick={() => setSelectedUi(ui)}
                  className={`ui-list-item-designed ${selectedUi?.id === ui.id ? 'active' : ''}`}
                >
                  <span className="ui-list-item-designed-num">
                    {idx + 1}.
                  </span>
                  <span className="ui-list-item-designed-title">
                    {ui.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Vertical Divider */}
            <div className="ui-divider" />

            {/* Right Area - Live Preview */}
            <div className="ui-preview-area">
              {selectedUi ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  
                  {/* Preview Toolbar */}
                  <div className="ui-preview-toolbar">
                    <div>
                      <h2 className="ui-preview-title">
                        {selectedUi.title}
                      </h2>
                      <p className="ui-preview-subtitle">
                        {selectedUi.description || 'Interactive live preview'}
                      </p>
                    </div>

                    {/* Center: Device Toggle Capsule */}
                    <div className="ui-device-toggle-capsule">
                      <button 
                        className={`ui-device-toggle-btn ${previewMode === 'desktop' ? 'active' : ''}`}
                        onClick={() => setPreviewMode('desktop')}
                      >
                        pc
                      </button>
                      <span style={{ color: 'rgba(255, 255, 255, 0.15)', margin: '0 4px', userSelect: 'none' }}>|</span>
                      <button 
                        className={`ui-device-toggle-btn ${previewMode === 'mobile' ? 'active' : ''}`}
                        onClick={() => setPreviewMode('mobile')}
                      >
                        mobile
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleShare(selectedUi)}
                        style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Share2 size={14} />
                        Share
                      </button>

                      <button 
                        className="btn btn-primary"
                        onClick={() => handleDownload(selectedUi)}
                        disabled={downloading}
                        style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        {downloading ? (
                          <span className="spinner" style={{ width: '14px', height: '14px' }}></span>
                        ) : (
                          <Download size={14} />
                        )}
                        {downloading ? 'Downloading...' : 'Download ZIP'}
                      </button>
                    </div>
                  </div>

                  {/* Iframe Frame Box */}
                  <div ref={wrapperRef} className="ui-device-frame-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                    <div 
                      style={{ 
                        width: `${frameWidth}px`, 
                        height: `${frameHeight}px`, 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'visible'
                      }}
                    >
                      <div 
                        className={`ui-device-frame ${previewMode === 'desktop' ? 'ui-device-frame-desktop' : 'ui-device-frame-mobile'}`}
                        style={{ 
                          width: `${targetWidth}px`, 
                          height: `${targetHeight}px`, 
                          transform: `scale(${scale})`, 
                          transformOrigin: 'center center',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          marginTop: `-${targetHeight / 2}px`,
                          marginLeft: `-${targetWidth / 2}px`,
                          border: previewMode === 'desktop' ? '12px solid #1e293b' : '10px solid #1e293b',
                          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 255, 255, 0.05)',
                          borderRadius: '20px',
                          backgroundColor: '#0f172a',
                          maxWidth: 'none',
                          maxHeight: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Browser Chrome for Desktop Preview */}
                        {previewMode === 'desktop' && (
                          <div style={{
                            height: '36px',
                            background: '#1e293b',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            gap: '8px',
                            flexShrink: 0
                          }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', opacity: 0.8 }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308', opacity: 0.8 }}></div>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.8 }}></div>
                            <div style={{
                              flex: 1,
                              background: 'rgba(0, 0, 0, 0.25)',
                              borderRadius: '6px',
                              height: '22px',
                              fontSize: '11px',
                              color: 'rgba(255, 255, 255, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'monospace',
                              maxWidth: '450px',
                              margin: '0 auto',
                              border: '1px solid rgba(255, 255, 255, 0.03)'
                            }}>
                              localhost:3000/auth/login
                            </div>
                          </div>
                        )}
                        
                        {/* Status Bar for Mobile Preview */}
                        {previewMode === 'mobile' && (
                          <div style={{
                            height: '26px',
                            background: '#1e293b',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 16px',
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontFamily: 'sans-serif',
                            fontWeight: 500,
                            flexShrink: 0
                          }}>
                            <span>9:41</span>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              <span style={{ fontSize: '9px' }}>5G</span>
                              <div style={{ width: '14px', height: '7px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '2px', padding: '1px', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', borderRadius: '1px' }}></div>
                              </div>
                            </div>
                          </div>
                        )}

                        <iframe
                          ref={iframeRef}
                          title="UI Preview"
                          srcDoc={getIframeSource(selectedUi)}
                          style={{ width: '100%', flex: 1, border: 'none', backgroundColor: '#0f172a' }}
                          sandbox="allow-scripts allow-forms"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Indicators Footer */}
                  <div className="ui-indicators-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--accent-primary)' }} />
                      HTML included
                    </div>
                    {selectedUi.cssCode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <CheckCircle size={14} style={{ color: 'var(--accent-primary)' }} />
                        CSS included
                      </div>
                    )}
                    {selectedUi.jsCode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <CheckCircle size={14} style={{ color: 'var(--accent-primary)' }} />
                        Vanilla JS included
                      </div>
                    )}
                    {selectedUi.reactCode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <CheckCircle size={14} style={{ color: 'var(--accent-primary)' }} />
                        React Component included
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="auth-modal-overlay animate-fade-in" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-glow" />
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            <div className="auth-modal-content">
              <div className="auth-modal-icon">🔒</div>
              <h3>Join AuthEasy to Download</h3>
              <p>Create a free developer account to download this premium authentication template and access all our pre-built elements.</p>
              <div className="auth-modal-actions">
                <button className="btn btn-primary" onClick={() => { setShowAuthModal(false); navigate('/signup'); }}>
                  Create Free Account
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowAuthModal(false); navigate('/login'); }}>
                  Sign In
                </button>
              </div>
              <div className="auth-modal-footer">
                100% Free • No Credit Card Required • Instant Setup
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
