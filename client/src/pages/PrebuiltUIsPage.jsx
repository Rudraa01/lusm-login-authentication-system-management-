import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Download, LayoutTemplate, Code, Eye, MonitorPlay, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './DashboardPages.css';

export default function PrebuiltUIsPage() {
  const [uis, setUis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedUi, setSelectedUi] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile
  const [downloading, setDownloading] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchUis();
  }, []);

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

  return (
    <div className="dashboard-page" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
        <div className="ui-library-container" style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
          
          {/* Left Sidebar - List of UIs */}
          <div className="ui-list-sidebar card" style={{ width: '300px', flexShrink: 0, overflowY: 'auto', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>
              Components
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uis.map(ui => (
                <div 
                  key={ui.id}
                  onClick={() => setSelectedUi(ui)}
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    background: selectedUi?.id === ui.id ? 'var(--bg-glass-hover)' : 'transparent',
                    border: `1px solid ${selectedUi?.id === ui.id ? 'var(--border-subtle)' : 'transparent'}`,
                    transition: 'all 0.2s ease',
                  }}
                  className="ui-list-item hover-bg-glass"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <LayoutTemplate size={16} style={{ color: selectedUi?.id === ui.id ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
                    <span style={{ fontWeight: 600, color: selectedUi?.id === ui.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {ui.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 6px' }}>{ui.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Area - Live Preview */}
          <div className="ui-preview-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {selectedUi ? (
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Preview Toolbar */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'rgba(0,0,0,0.2)'
                }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {selectedUi.title}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {selectedUi.description || 'Interactive live preview'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Viewport Toggle */}
                    <div style={{ display: 'flex', background: 'var(--bg-glass)', borderRadius: '8px', padding: '4px' }}>
                      <button 
                        className={`btn btn-sm btn-icon ${previewMode === 'desktop' ? 'btn-secondary' : 'btn-ghost'}`}
                        onClick={() => setPreviewMode('desktop')}
                        title="Desktop View"
                      >
                        <MonitorPlay size={16} />
                      </button>
                      <button 
                        className={`btn btn-sm btn-icon ${previewMode === 'mobile' ? 'btn-secondary' : 'btn-ghost'}`}
                        onClick={() => setPreviewMode('mobile')}
                        title="Mobile View"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                      </button>
                    </div>

                    <button 
                      className="btn btn-primary"
                      onClick={() => handleDownload(selectedUi)}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <span className="spinner"></span>
                      ) : (
                        <Download size={16} />
                      )}
                      {downloading ? 'Zipping...' : 'Download ZIP'}
                    </button>
                  </div>
                </div>

                {/* Iframe Container */}
                <div style={{ 
                  flex: 1, 
                  background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  overflow: 'auto'
                }}>
                  <div style={{
                    width: previewMode === 'desktop' ? '100%' : '375px',
                    height: previewMode === 'desktop' ? '100%' : '667px',
                    transition: 'all 0.3s ease',
                    borderRadius: previewMode === 'mobile' ? '32px' : '8px',
                    border: previewMode === 'mobile' ? '8px solid #1e293b' : '1px solid var(--border-color)',
                    overflow: 'hidden',
                    background: '#0f172a',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}>
                    <iframe
                      ref={iframeRef}
                      title="UI Preview"
                      srcDoc={getIframeSource(selectedUi)}
                      style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#0f172a' }}
                      sandbox="allow-scripts allow-forms"
                    />
                  </div>
                </div>
                
                {/* Code snippets summary */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <CheckCircle size={14} style={{ color: 'var(--success-color)' }} />
                    HTML included
                  </div>
                  {selectedUi.cssCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--success-color)' }} />
                      CSS included
                    </div>
                  )}
                  {selectedUi.jsCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--success-color)' }} />
                      Vanilla JS included
                    </div>
                  )}
                  {selectedUi.reactCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <CheckCircle size={14} style={{ color: 'var(--success-color)' }} />
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
  );
}
