// TrustNet AI — Sidebar Navigation
import { useAuth } from '../context/AuthContext';
import { useOrgOverview, useAlerts } from '../hooks/useTrustNetData';

const NAV_ITEMS = [
  { id: 'overview',  icon: '⬛', label: 'Overview'       },
  { id: 'analytics', icon: '📊', label: 'Analytics'      },
  { id: 'riskmap',   icon: '🗺️', label: 'Global Risk Map' },
  { id: 'policy',    icon: '🛡️', label: 'Policy Engine'  },
  { id: 'training',  icon: '🎓', label: 'Training'        },
  { id: 'alerts',    icon: '🔔', label: 'Alerts'          },
];

const CONFIG_ITEMS = [
  { id: 'settings',   icon: '⚙️',  label: 'Settings'          },
  { id: 'api',        icon: '🔗',  label: 'API Access'        },
  { id: 'compliance', icon: '📄',  label: 'Compliance Reports' },
];

export default function Sidebar({ activePage, setActivePage }) {
  const authCtx    = useAuth();
  const { org }    = useOrgOverview();
  const { alerts } = useAlerts(100);

  const user       = authCtx?.user;
  const logout     = authCtx?.logout ?? (() => {});
  const unresolved = alerts.filter(a => a.status !== 'resolved').length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" stroke="url(#slg)" strokeWidth="1.5"/>
          <path d="M14 4L20 10L14 8L8 10L14 4Z" fill="#00D9FF" opacity="0.9"/>
          <path d="M8 10L14 24L14 8L8 10Z" fill="#7C3AED" opacity="0.8"/>
          <path d="M20 10L14 24L14 8L20 10Z" fill="#00D9FF" opacity="0.5"/>
          <defs><linearGradient id="slg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00D9FF"/><stop offset="1" stopColor="#7C3AED"/>
          </linearGradient></defs>
        </svg>
        <span className="sidebar-logo-text">TrustNet <span>AI</span></span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.id === 'alerts' && unresolved > 0 && (
              <span className="nav-badge">{unresolved}</span>
            )}
            {item.id === 'training' && (
              <span className="nav-badge">3</span>
            )}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: '12px' }}>Configuration</div>
        {CONFIG_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="org-card">
          <div className="org-name">{(org?.name || 'Loading...').slice(0, 22)}</div>
          <div className="org-plan">✦ {org?.plan || 'Enterprise'} — {org?.industry || 'BFSI'}</div>
        </div>

        {/* Live model status */}
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-3)' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--safe)', boxShadow: '0 0 6px var(--safe)', animation: 'pulse 2s infinite' }}/>
          FL Model v1.0 Active
        </div>

        {/* Sign out */}
        <button
          onClick={logout}
          title="Sign out"
          style={{ marginTop: '12px', width: '100%', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.15)', borderRadius: 'var(--r-sm)', color: 'rgba(255,71,87,0.7)', fontSize: '0.75rem', fontWeight: 600, padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,71,87,0.15)'; e.currentTarget.style.color='#FF4757'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,71,87,0.08)'; e.currentTarget.style.color='rgba(255,71,87,0.7)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out {user?.displayName ? `(${user.displayName.split(' ')[0]})` : ''}
        </button>
      </div>
    </aside>
  );
}
