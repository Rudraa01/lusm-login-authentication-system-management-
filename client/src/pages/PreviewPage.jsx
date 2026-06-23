import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Shield, Download, Share2, Monitor, Phone, ArrowLeft, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './LandingPage.css';
import './DashboardPages.css';

export default function PreviewPage() {
  const { id } = useParams();
  const [ui, setUi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, mobile
  const [downloading, setDownloading] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  
  const wrapperRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchUiDetails();
  }, [id]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const updateSize = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        // Leave room for padding
        const padding = 48; 
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
  }, [ui, previewMode]);

  const fetchUiDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/v1/ui/${id}`);
      if (res.data.success) {
        setUi(res.data.data);
      } else {
        setError('Failed to load UI template.');
      }
    } catch (err) {
      console.error('Failed to fetch UI details:', err);
      setError('Template not found or has been removed.');
    } finally {
      setLoading(false);
    }
  };

  const getIframeSource = (template) => {
    if (!template) return '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${template.title} - Preview</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          * { box-sizing: border-box; }
          ${template.cssCode || ''}
        </style>
      </head>
      <body>
        ${template.htmlCode || ''}
        <script>
          (function() {
            function showToast(message) {
              const existing = document.getElementById('preview-security-toast');
              if (existing) existing.remove();

              const toastEl = document.createElement('div');
              toastEl.id = 'preview-security-toast';
              toastEl.textContent = message;
              toastEl.style.position = 'fixed';
              toastEl.style.bottom = '24px';
              toastEl.style.left = '50%';
              toastEl.style.transform = 'translateX(-50%)';
              toastEl.style.backgroundColor = '#1e293b';
              toastEl.style.color = '#38bdf8';
              toastEl.style.border = '1px solid #38bdf833';
              toastEl.style.padding = '10px 20px';
              toastEl.style.borderRadius = '8px';
              toastEl.style.fontSize = '13px';
              toastEl.style.fontWeight = '500';
              toastEl.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.4)';
              toastEl.style.zIndex = '999999';
              toastEl.style.fontFamily = 'Inter, sans-serif';
              toastEl.style.textAlign = 'center';
              
              document.body.appendChild(toastEl);
              setTimeout(() => {
                toastEl.style.opacity = '0';
                setTimeout(() => toastEl.remove(), 200);
              }, 2500);
            }

            document.addEventListener('click', function(e) {
              const link = e.target.closest('a');
              if (link) {
                e.preventDefault();
                showToast('Link navigation is disabled in interactive preview.');
              }
            }, true);

            document.addEventListener('submit', function(e) {
              e.preventDefault();
              showToast('Form submission simulated successfully!');
            }, true);
          })();

          try {
            ${template.jsCode || ''}
          } catch (err) {
            console.error('Error in preview script:', err);
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!ui) return;
    try {
      setDownloading(true);
      const zip = new JSZip();
      
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
      
      if (ui.cssCode) zip.file("style.css", ui.cssCode);
      else zip.file("style.css", "/* Add your styles here */\n");
      
      if (ui.jsCode) zip.file("script.js", ui.jsCode);
      else zip.file("script.js", "// Add your scripts here\n");
      
      if (ui.reactCode) {
        zip.file(`${ui.title.replace(/\s+/g, '')}Component.jsx`, ui.reactCode);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `autheasy-${ui.title.toLowerCase().replace(/\s+/g, '-')}.zip`);
      toast.success('Download started! 📦');
    } catch (error) {
      console.error("Error generating zip", error);
      toast.error("Failed to download ZIP file");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Share link copied to clipboard! 🚀');
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0f172a', color: '#94a3b8', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={36} className="spin" style={{ color: 'var(--accent-primary)' }} />
        <span style={{ fontSize: '14px', letterSpacing: '1px' }}>Loading Live Preview...</span>
      </div>
    );
  }

  if (error || !ui) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0f172a', color: '#f8fafc', flexDirection: 'column', gap: '24px', padding: '24px', textAlign: 'center' }}>
        <Shield size={64} style={{ color: 'var(--accent-rose)', opacity: 0.8 }} />
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Template Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>{error || 'This preview link is invalid or the UI template has been deleted.'}</p>
        </div>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to AuthEasy
        </Link>
      </div>
    );
  }

  // Auto-scaling calculations
  const targetWidth = previewMode === 'desktop' ? 1280 : 375;
  const targetHeight = previewMode === 'desktop' ? 800 : 667;

  const scaleX = containerSize.width / targetWidth;
  const scaleY = containerSize.height / targetHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const frameWidth = targetWidth * scale;
  const frameHeight = targetHeight * scale;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#070b13', overflow: 'hidden' }}>
      
      {/* Premium Public Header */}
      <header className="preview-header">
        {/* Left Side: Brand Logo and Title */}
        <div className="preview-logo-section">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="AuthEasy" style={{ height: '24px' }} />
          </Link>
          <div className="preview-logo-divider"></div>
          <div className="preview-title-container">
            <div>
              <span className="preview-title-text">{ui.title}</span>
              <span className="preview-type-badge">({ui.type})</span>
            </div>
          </div>
        </div>

        {/* Center: Device Toggle Buttons */}
        <div className="ui-device-toggle-capsule" style={{ margin: 0 }}>
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

        {/* Right Side: Action Buttons */}
        <div className="preview-actions">
          <button 
            className="btn btn-secondary preview-btn-icon-only" 
            onClick={handleShare}
            style={{ padding: '8px 14px', height: '38px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Share2 size={14} /> <span className="preview-btn-text">Share</span>
          </button>

          <button 
            className="btn btn-ghost preview-btn-icon-only" 
            onClick={handleDownload}
            disabled={downloading}
            style={{ padding: '8px 14px', height: '38px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {downloading ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <Download size={14} />
            )}
            <span className="preview-btn-text">Download ZIP</span>
          </button>

          <Link 
            to="/signup" 
            className="btn btn-primary preview-btn-primary-mobile"
            style={{ 
              padding: '8px 16px', 
              height: '38px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
            }}
          >
            <span className="preview-btn-text">Get Started Free</span>
            <span className="show-on-mobile-inline">Get Started</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
        
        {/* Device Frame Display Wrapper */}
        <div 
          ref={wrapperRef} 
          className="ui-device-frame-wrapper" 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            overflow: 'hidden', 
            position: 'relative',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.02)'
          }}
        >
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
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                backgroundColor: '#0f172a',
                maxWidth: 'none',
                maxHeight: 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Browser Chrome Header Mockup */}
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
                    color: 'rgba(255, 255, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'monospace',
                    maxWidth: '450px',
                    margin: '0 auto',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}>
                    autheasy.me/preview/{id}
                  </div>
                </div>
              )}
              
              {/* Phone Status Bar Mockup */}
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
                srcDoc={getIframeSource(ui)}
                style={{ width: '100%', flex: 1, border: 'none', backgroundColor: '#0f172a' }}
                sandbox="allow-scripts allow-forms"
              />
            </div>
          </div>
        </div>

        {/* Viral Marketing Bottom Banner */}
        <div className="preview-banner">
          <div className="preview-banner-left">
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              flexShrink: 0
            }}>🚀</div>
            <div>
              <p className="preview-banner-text-main">
                Want to integrate this Authentication template into your app?
              </p>
              <p className="preview-banner-text-sub">
                AuthEasy handles logins, OTP email verifications, and passwords with just 1 API call — 100% Free.
              </p>
            </div>
          </div>
          <div className="preview-banner-checklist">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} style={{ color: 'var(--accent-primary)' }} /> HTML/CSS/JS Included</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} style={{ color: 'var(--accent-primary)' }} /> React Component Included</span>
          </div>
          <Link 
            to="/signup" 
            className="btn btn-primary"
            style={{ 
              padding: '6px 16px', 
              borderRadius: '8px', 
              fontSize: '12px',
              background: 'linear-gradient(135deg, var(--accent-primary), #4f46e5)'
            }}
          >
            Create Free Account
          </Link>
        </div>

      </main>
    </div>
  );
}
