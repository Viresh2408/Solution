// TrustNet AI — Complete App.jsx with Auth guard, Landing, and all pages
import { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import AuthPage    from './pages/AuthPage';
import Overview    from './pages/Overview';
import Analytics   from './pages/Analytics';
import RiskMap     from './pages/RiskMap';
import Policy      from './pages/Policy';
import Training    from './pages/Training';
import Alerts      from './pages/Alerts';
import Settings    from './pages/Settings';

// Components
import Sidebar     from './components/Sidebar';
import DashHeader  from './components/DashHeader';

// ── Placeholder pages for Settings sub-sections ──────────────
function ApiAccess() {
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="section-title mb-2">🔗 API Access</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '20px' }}>
          Use the TrustNet API to integrate threat intelligence into your own systems.
        </div>
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '14px', fontFamily: 'var(--mono)', fontSize: '0.82rem', color: 'var(--cyan)', marginBottom: '16px', wordBreak: 'break-all' }}>
          Bearer: tn_live_••••••••••••••••••••••••••••••
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary btn-sm">Generate New Key</button>
          <button className="btn btn-ghost btn-sm">View Docs →</button>
        </div>
      </div>
    </div>
  );
}

function Compliance() {
  const reports = [
    { name: 'Q1 2026 Security Report',  date: 'Apr 1, 2026',  type: 'PDF', size: '2.4 MB' },
    { name: 'DPDPA Audit Checklist',    date: 'Mar 15, 2026', type: 'PDF', size: '1.1 MB' },
    { name: 'ISO 27001 Gap Analysis',   date: 'Feb 28, 2026', type: 'XLSX', size: '890 KB' },
    { name: 'RBI Cybersecurity Report', date: 'Jan 31, 2026', type: 'PDF', size: '3.2 MB' },
  ];
  return (
    <div className="page">
      <div className="card">
        <div className="section-header mb-4">
          <div className="section-title">📄 Compliance Reports</div>
          <button className="btn btn-primary btn-sm">+ Generate Report</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Report</th><th>Date</th><th>Format</th><th>Size</th><th>Action</th></tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.name}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ color: 'var(--text-2)' }}>{r.date}</td>
                <td><span className="badge cyan">{r.type}</span></td>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.size}</td>
                <td><button className="btn btn-ghost btn-sm">⬇ Download</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Dashboard shell (shown only when authenticated) ──────────
function DashboardApp() {
  const [activePage, setActivePage] = useState('overview');

  const pages = {
    overview:   <Overview />,
    analytics:  <Analytics />,
    riskmap:    <RiskMap />,
    policy:     <Policy />,
    training:   <Training />,
    alerts:     <Alerts />,
    settings:   <Settings />,
    api:        <ApiAccess />,
    compliance: <Compliance />,
  };

  return (
    <div className="layout">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="main-content">
        <DashHeader activePage={activePage} setActivePage={setActivePage} />
        {pages[activePage] || <Overview />}
      </div>
    </div>
  );
}

// ── Auth guard ────────────────────────────────────────────────
function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <svg width="44" height="44" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 1.5s linear infinite' }}>
          <circle cx="14" cy="14" r="13" stroke="url(#splg)" strokeWidth="1.5" strokeDasharray="40" strokeDashoffset="20"/>
          <defs><linearGradient id="splg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#00D9FF"/><stop offset="1" stopColor="#7C3AED"/></linearGradient></defs>
        </svg>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Loading TrustNet AI...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return user ? <DashboardApp /> : <AuthPage />;
}

// ── Root export ───────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
