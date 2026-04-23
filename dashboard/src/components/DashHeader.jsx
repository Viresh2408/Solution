// TrustNet AI — Dashboard Header with working Search + User menu
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts, useEmployees } from '../hooks/useTrustNetData';

const PAGE_TITLES = {
  overview:   'Security Overview',
  analytics:  'Vulnerability Analytics',
  riskmap:    'Global Risk Intelligence Map',
  policy:     'Policy Engine',
  training:   'Security Training',
  alerts:     'Alert Center',
  settings:   'Settings',
  api:        'API Access',
  compliance: 'Compliance Reports',
};

export default function DashHeader({ activePage, setActivePage }) {
  const { user, logout }         = useAuth();
  const { alerts }               = useAlerts(100);
  const { employees }            = useEmployees();
  const unresolved               = alerts.filter(a => a.status !== 'resolved');

  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertDrop, setShowAlertDrop] = useState(false);
  const searchRef = useRef(null);

  // ── Search logic ──
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowDropdown(false); return; }
    const q = query.toLowerCase();

    const alertMatches = alerts
      .filter(a => a.user?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q) || a.detail?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(a => ({ type: 'alert', label: a.user, sub: a.detail?.slice(0, 50) + '…', severity: a.severity, action: () => setActivePage('alerts') }));

    const empMatches = employees
      .filter(e => e.name?.toLowerCase().includes(q) || e.dept?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(e => ({ type: 'employee', label: e.name, sub: `${e.dept} · Risk ${e.riskScore}`, action: () => setActivePage('analytics') }));

    const pageMatches = Object.entries(PAGE_TITLES)
      .filter(([,v]) => v.toLowerCase().includes(q))
      .map(([id, label]) => ({ type: 'page', label, sub: 'Go to page', action: () => setActivePage(id) }));

    setResults([...pageMatches, ...alertMatches, ...empMatches]);
    setShowDropdown(true);
  }, [query, alerts, employees]);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (!searchRef.current?.contains(e.target)) { setShowDropdown(false); setShowUserMenu(false); setShowAlertDrop(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'CISO';
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  const avatarColor = user?.photoURL ? null : '#7C3AED';

  return (
    <header className="dash-header">
      {/* Title */}
      <div>
        <div className="header-title">{PAGE_TITLES[activePage] || 'Dashboard'}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Search */}
      <div className="header-search" ref={searchRef} style={{ position: 'relative' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          placeholder="Search users, alerts, threats..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.85rem', flex: 1, width: '100%' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setShowDropdown(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '0 4px', fontSize: '0.9rem' }}>✕</button>
        )}

        {/* Search Results Dropdown */}
        {showDropdown && results.length > 0 && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', zIndex: 500, overflow: 'hidden' }}>
            {results.map((r, i) => (
              <button key={i} onClick={() => { r.action(); setQuery(''); setShowDropdown(false); }}
                style={{ width: '100%', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                <span style={{ fontSize: '0.8rem' }}>{r.type === 'alert' ? '🔔' : r.type === 'employee' ? '👤' : '🔍'}</span>
                <div>
                  <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{r.sub}</div>
                </div>
                {r.severity && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, color: r.severity === 'critical' ? 'var(--danger)' : r.severity === 'high' ? 'var(--warning)' : 'var(--cyan)', textTransform: 'uppercase' }}>{r.severity}</span>}
              </button>
            ))}
          </div>
        )}
        {showDropdown && results.length === 0 && query && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px', fontSize: '0.82rem', color: 'var(--text-3)', textAlign: 'center', zIndex: 500 }}>
            No results for "{query}"
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* Refresh */}
        <button className="icon-btn" title="Refresh page" onClick={() => window.location.reload()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>

        {/* Alerts bell */}
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" title="Alerts" onClick={() => { setActivePage('alerts'); setShowAlertDrop(v => !v); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unresolved.length > 0 && (
              <span className="alert-count">{Math.min(unresolved.length, 9)}{unresolved.length > 9 ? '+' : ''}</span>
            )}
          </button>
        </div>

        {/* User avatar + dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowUserMenu(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '5px 12px', cursor: 'pointer' }}>
            {user?.photoURL
              ? <img src={user.photoURL} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} alt={displayName}/>
              : <div className="user-avatar" style={{ background: avatarColor }}>{initials}</div>
            }
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>{displayName.split(' ')[0]}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>CISO</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {showUserMenu && (
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', minWidth: '180px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', zIndex: 500, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>{displayName}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{user?.email}</div>
              </div>
              {[
                { label: '⚙️  Settings',   action: () => setActivePage('settings')   },
                { label: '🔗  API Access', action: () => setActivePage('api')        },
                { label: '📄  Reports',    action: () => setActivePage('compliance') },
              ].map(item => (
                <button key={item.label} onClick={() => { item.action(); setShowUserMenu(false); }}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem', color: 'var(--text-2)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  {item.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={logout}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '10px 14px', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem', color: 'var(--danger)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,71,87,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  🚪  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
