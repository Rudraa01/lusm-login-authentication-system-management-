import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000000',
      color: '#ffffff',
      fontFamily: "'Geist', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Premium Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(163, 149, 129, 0.08) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Shield Icon with Gold Accent */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'rgba(163, 149, 129, 0.05)',
          border: '1px solid rgba(163, 149, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a39581',
          boxShadow: '0 0 30px rgba(163, 149, 129, 0.05)'
        }}>
          <ShieldAlert size={36} />
        </div>

        {/* 404 Text */}
        <div>
          <h1 style={{
            fontSize: '96px',
            fontWeight: 900,
            margin: 0,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #857969 0%, #a39581 50%, #c7bba9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-2px'
          }}>404</h1>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 700,
            marginTop: '16px',
            marginBottom: '8px',
            color: '#ffffff'
          }}>Page Not Found</h2>
          <p style={{
            fontSize: '14px',
            color: '#7e7a75',
            lineHeight: 1.6,
            margin: 0
          }}>
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Back Link Button */}
        <Link to="/" className="btn btn-primary" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #857969 0%, #a39581 100%)',
          border: 'none',
          boxShadow: '0 4px 15px rgba(163, 149, 129, 0.2)',
          color: '#000000',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
