import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  Users, FolderKanban, ShieldAlert, BarChart3, 
  Activity, ArrowUpRight, Calendar, RefreshCw, Trophy, AlertTriangle
} from 'lucide-react';
import './AdminPages.css';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await api.get('/api/admin/analytics');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        throw new Error(res.data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Could not retrieve platform analytics. Please ensure the backend is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper to format number
  const formatNum = (num) => {
    if (num === undefined || num === null) return 0;
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="animate-fade-in admin-analytics-page">
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 300, height: 16 }} />
          </div>
        </div>
        
        {/* Metric Cards Skeleton */}
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card stat-card admin-stat-card">
              <div className="skeleton" style={{ width: 120, height: 14 }} />
              <div className="skeleton" style={{ width: 80, height: 32, marginTop: 8 }} />
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="admin-analytics-grid" style={{ marginTop: 24 }}>
          <div className="glass-card admin-chart-card skeleton-card">
            <div className="skeleton" style={{ width: 150, height: 20, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: 200 }} />
          </div>
          <div className="glass-card admin-chart-card skeleton-card">
            <div className="skeleton" style={{ width: 150, height: 20, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: 200 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in admin-analytics-page">
        <div className="page-header">
          <div>
            <h1 className="page-title admin-page-title">Platform Analytics</h1>
            <p className="page-subtitle">Real-time usage tracking and logs metrics</p>
          </div>
        </div>
        <div className="glass-card admin-error-card flex-center flex-column" style={{ padding: 48, textAlign: 'center', gap: 16 }}>
          <AlertTriangle size={48} className="text-danger" />
          <h2 className="admin-error-title">Connection Error</h2>
          <p className="admin-error-text" style={{ maxWidth: 450, color: 'var(--text-secondary)' }}>{error}</p>
          <button className="btn admin-btn" onClick={fetchAnalytics}>
            <RefreshCw size={16} style={{ marginRight: 8 }} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { summary, dailyRequests, endpointDistribution, statusDistribution, leaderboard } = data;

  // Donut SVG Calculations for Status Codes
  const successCount = statusDistribution.success || 0;
  const clientErrCount = statusDistribution.clientError || 0;
  const serverErrCount = statusDistribution.serverError || 0;
  const totalCodes = successCount + clientErrCount + serverErrCount || 1;

  const pctSuccess = successCount / totalCodes;
  const pctClient = clientErrCount / totalCodes;
  const pctServer = serverErrCount / totalCodes;

  const r = 50;
  const circ = 2 * Math.PI * r; // ~314.16

  const successStroke = pctSuccess * circ;
  const clientStroke = pctClient * circ;
  const serverStroke = pctServer * circ;

  const successOffset = 0;
  const clientOffset = -successStroke;
  const serverOffset = -(successStroke + clientStroke);

  // Daily Request Bar SVG Calculations
  const maxDailyCount = Math.max(...dailyRequests.map(d => d.count), 10);

  // Endpoint max count helper
  const maxEndpointCount = Math.max(...endpointDistribution.map(e => e.count), 1);

  return (
    <div className="animate-fade-in admin-analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title admin-page-title">Platform Analytics</h1>
          <p className="page-subtitle">Real-time usage tracking, endpoint distribution, and leaderboard</p>
        </div>
        <div className="flex-row gap-12">
          <button 
            className={`btn btn-secondary admin-btn-refresh ${refreshing ? 'spinning' : ''}`} 
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
          <div className="admin-badge">
            <Activity size={14} className="pulse-icon" />
            Live Tracker
          </div>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card admin-stat-card">
          <div className="stat-icon admin-stat-icon-dev">
            <BarChart3 size={22} />
          </div>
          <span className="stat-label">Total API Calls</span>
          <span className="stat-value">{formatNum(summary.totalRequests)}</span>
          <span className="stat-desc">All-time request volume</span>
        </div>

        <div className="glass-card stat-card admin-stat-card">
          <div className="stat-icon admin-stat-icon-proj">
            <Activity size={22} fill="rgba(6, 182, 212, 0.1)" />
          </div>
          <span className="stat-label">Last 24 Hours</span>
          <span className="stat-value">{formatNum(summary.requests24h)}</span>
          <span className="stat-desc">Active calls since yesterday</span>
        </div>

        <div className="glass-card stat-card admin-stat-card">
          <div className="stat-icon admin-stat-icon-user">
            <Users size={22} />
          </div>
          <span className="stat-label">Total End-Users</span>
          <span className="stat-value">{formatNum(summary.totalEndUsers)}</span>
          <span className="stat-desc">Across all projects</span>
        </div>

        <div className="glass-card stat-card admin-stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <FolderKanban size={22} />
          </div>
          <span className="stat-label">User Ratio</span>
          <span className="stat-value">{summary.avgUsersPerProject}</span>
          <span className="stat-desc">Average users per project</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="admin-analytics-grid">
        
        {/* Chart 1: Daily Request Trend (SVG) */}
        <div className="glass-card admin-chart-card">
          <div className="chart-header">
            <h3 className="chart-heading">
              <Calendar size={18} /> Daily API Volume (7 Days)
            </h3>
            <span className="chart-legend-label">API Requests/Day</span>
          </div>

          <div className="svg-chart-container">
            {summary.totalRequests === 0 ? (
              <div className="flex-center flex-column h-100" style={{ minHeight: 200, color: 'var(--text-muted)' }}>
                <BarChart3 size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <span>No API requests logged yet.</span>
              </div>
            ) : (
              <svg viewBox="0 0 500 220" className="svg-chart">
                <defs>
                  <linearGradient id="amber-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                
                {/* Y-axis gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const yVal = 160 - ratio * 130;
                  const labelVal = Math.round(ratio * maxDailyCount);
                  return (
                    <g key={index} className="gridline-group">
                      <line x1="35" y1={yVal} x2="480" y2={yVal} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                      <text x="25" y={yVal + 4} textAnchor="end" fill="var(--text-muted)" fontSize="9">{labelVal}</text>
                    </g>
                  );
                })}

                {/* X-axis line */}
                <line x1="35" y1="160" x2="480" y2="160" stroke="rgba(255,255,255,0.15)" />

                {/* Render bars */}
                {dailyRequests.map((day, i) => {
                  const spacing = 445 / 7;
                  const barWidth = 26;
                  const x = 45 + i * spacing + (spacing - barWidth) / 2;
                  const barHeight = (day.count / maxDailyCount) * 130;
                  const y = 160 - barHeight;

                  return (
                    <g key={i} className="chart-bar-group">
                      {/* Bar hover tooltip bg helper */}
                      <rect 
                        x={x - 6} 
                        y="20" 
                        width={barWidth + 12} 
                        height="140" 
                        fill="transparent" 
                        className="bar-hover-zone"
                      />
                      
                      {/* Visual Bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        rx="4" 
                        fill="url(#amber-grad)" 
                        stroke="#fbbf24"
                        strokeWidth="1"
                        className="chart-bar"
                      />
                      
                      {/* Count label above the bar */}
                      <text 
                        x={x + barWidth / 2} 
                        y={y - 8} 
                        textAnchor="middle" 
                        fill="#fbbf24" 
                        fontSize="9.5" 
                        fontWeight="700"
                        className="chart-bar-value"
                      >
                        {day.count}
                      </text>

                      {/* X Label */}
                      <text 
                        x={x + barWidth / 2} 
                        y="180" 
                        textAnchor="middle" 
                        fill="var(--text-secondary)" 
                        fontSize="10"
                        fontWeight="500"
                      >
                        {day.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Chart 2: Status Code Health Indicator (SVG Donut) */}
        <div className="glass-card admin-chart-card">
          <div className="chart-header">
            <h3 className="chart-heading">
              <ShieldAlert size={18} /> API Health & Status Codes
            </h3>
          </div>

          <div className="svg-donut-container">
            {summary.totalRequests === 0 ? (
              <div className="flex-center flex-column h-100" style={{ minHeight: 200, color: 'var(--text-muted)' }}>
                <ShieldAlert size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <span>No requests logged yet.</span>
              </div>
            ) : (
              <div className="donut-content-wrapper">
                <div className="donut-svg-wrapper">
                  <svg width="160" height="160" viewBox="0 0 120 120" className="donut-svg">
                    {/* Background circle track */}
                    <circle cx="60" cy="60" r={r} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                    
                    {/* Success (2xx) - Emerald */}
                    {pctSuccess > 0 && (
                      <circle 
                        cx="60" 
                        cy="60" 
                        r={r} 
                        fill="transparent" 
                        stroke="#10b981" 
                        strokeWidth="10" 
                        strokeDasharray={`${successStroke} ${circ}`} 
                        strokeDashoffset={successOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        className="donut-segment"
                      />
                    )}
                    
                    {/* Client Errors (4xx) - Amber */}
                    {pctClient > 0 && (
                      <circle 
                        cx="60" 
                        cy="60" 
                        r={r} 
                        fill="transparent" 
                        stroke="#f59e0b" 
                        strokeWidth="10" 
                        strokeDasharray={`${clientStroke} ${circ}`} 
                        strokeDashoffset={clientOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        className="donut-segment"
                      />
                    )}

                    {/* Server Errors (5xx) - Rose */}
                    {pctServer > 0 && (
                      <circle 
                        cx="60" 
                        cy="60" 
                        r={r} 
                        fill="transparent" 
                        stroke="#f43f5e" 
                        strokeWidth="10" 
                        strokeDasharray={`${serverStroke} ${circ}`} 
                        strokeDashoffset={serverOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        className="donut-segment"
                      />
                    )}
                  </svg>
                  <div className="donut-center-label">
                    <span className="donut-pct">{Math.round(pctSuccess * 100)}%</span>
                    <span className="donut-lbl">Success Rate</span>
                  </div>
                </div>

                <div className="donut-legend">
                  <div className="legend-item">
                    <span className="legend-dot status-active"></span>
                    <span className="legend-name">Success (2xx)</span>
                    <span className="legend-count">{successCount}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot status-blocked" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderColor: '#f59e0b' }}></span>
                    <span className="legend-name">Client Errors (4xx)</span>
                    <span className="legend-count">{clientErrCount}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot status-blocked"></span>
                    <span className="legend-name">Server Errors (5xx)</span>
                    <span className="legend-count">{serverErrCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Leaderboard and Endpoint Distributions */}
      <div className="admin-dashboard-grid" style={{ marginTop: 24 }}>
        
        {/* Endpoint Traffic Distribution */}
        <div className="glass-card admin-section-card">
          <h2 className="admin-section-heading">
            <Activity size={18} /> API Endpoint Distribution
          </h2>
          <p className="admin-section-desc" style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 16px 0' }}>
            Breakdown of API traffic routing and query volume
          </p>

          <div className="endpoint-progress-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {endpointDistribution.length === 0 ? (
              <p className="admin-empty-text">No requests logged yet.</p>
            ) : (
              endpointDistribution.slice(0, 7).map((ep, i) => {
                const percentage = Math.round((ep.count / maxEndpointCount) * 100);
                // Color route tag uniquely
                let methodColor = 'var(--text-muted)';
                let methodLabel = 'POST';
                if (ep.endpoint.includes('/login')) {
                  methodColor = '#22d3ee';
                  methodLabel = 'POST';
                } else if (ep.endpoint.includes('/register')) {
                  methodColor = '#fbbf24';
                  methodLabel = 'POST';
                } else if (ep.endpoint.includes('/verify-otp')) {
                  methodColor = '#34d399';
                  methodLabel = 'POST';
                } else if (ep.endpoint.includes('/me')) {
                  methodColor = '#c084fc';
                  methodLabel = 'GET';
                }

                return (
                  <div key={i} className="endpoint-progress-item">
                    <div className="endpoint-progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontSize: 13 }}>
                      <div className="endpoint-path-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="code-font" style={{ fontSize: 9, padding: '1px 5px', color: methodColor, borderColor: 'rgba(255,255,255,0.08)' }}>
                          {methodLabel}
                        </span>
                        <span className="endpoint-path code-font" style={{ background: 'transparent', padding: 0, color: 'var(--text-primary)' }}>
                          {ep.endpoint.replace('/api/v1/auth', '') || '/'}
                        </span>
                      </div>
                      <span className="endpoint-hits" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ep.count} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>calls</span>
                      </span>
                    </div>
                    
                    <div className="progress-bar-track" style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          height: '100%', 
                          width: `${percentage}%`, 
                          background: `linear-gradient(90deg, ${methodColor} 0%, rgba(255,255,255,0.1) 100%)`, 
                          borderRadius: 3,
                          transition: 'width 0.8s ease-out'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Developer Leaderboard */}
        <div className="glass-card admin-section-card">
          <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="admin-section-heading">
              <Trophy size={18} style={{ color: '#fbbf24' }} /> Developer Leaderboard
            </h2>
            <Link to="/admin/developers" className="btn btn-ghost btn-sm admin-btn-ghost">
              Manage Developers <ArrowUpRight size={14} />
            </Link>
          </div>
          <p className="admin-section-desc" style={{ fontSize: 13, color: 'var(--text-muted)', margin: '-8px 0 16px 0' }}>
            Developers ranked by end-user volume, projects, and requests
          </p>

          <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaderboard.length === 0 ? (
              <p className="admin-empty-text">No developers found.</p>
            ) : (
              leaderboard.slice(0, 5).map((dev, idx) => {
                // Rank Styling
                let rankClass = "leaderboard-rank";
                let rankSymbol = `#${idx + 1}`;
                if (idx === 0) {
                  rankClass += " rank-first";
                  rankSymbol = "👑";
                } else if (idx === 1) {
                  rankClass += " rank-second";
                } else if (idx === 2) {
                  rankClass += " rank-third";
                }

                return (
                  <div key={dev.id} className="admin-list-item leaderboard-item" style={{ padding: '10px 14px' }}>
                    <div className="dev-info-left" style={{ gap: 14 }}>
                      <span className={rankClass} style={{ width: 24, textAlign: 'center', fontWeight: 800, fontSize: idx === 0 ? 16 : 13, color: idx < 3 ? '#fbbf24' : 'var(--text-muted)' }}>
                        {rankSymbol}
                      </span>
                      <div className="dev-text">
                        <Link to={`/admin/developers/${dev.id}`} className="dev-name-link" style={{ fontSize: 14, fontWeight: 700 }}>
                          {dev.name}
                        </Link>
                        <span className="dev-email" style={{ fontSize: 11 }}>{dev.email}</span>
                      </div>
                    </div>
                    
                    <div className="leaderboard-stats" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div className="lead-stat-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-white)' }}>
                          {formatNum(dev.userCount)}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>users</span>
                      </div>
                      <div className="lead-stat-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {dev.projectCount}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>projects</span>
                      </div>
                      <div className="lead-stat-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>
                          {formatNum(dev.requestCount)}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>calls</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
