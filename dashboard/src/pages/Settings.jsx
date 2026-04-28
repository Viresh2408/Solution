// TrustNet AI — Settings Page
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { seedDatabase } from '../hooks/useTrustNetData';

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const [notifs, setNotifs] = useState({
    criticalAlerts: true,
    weeklyReport: true,
    simResults: true,
    policyTriggered: true,
  });

  const [seeding, setSeeding] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
      alert('Database seeded successfully! Dashboard is now live.');
    } catch (err) {
      alert(`Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="page">
      <div style={{ maxWidth: '680px' }}>

        {/* Profile */}
        <div className="card mb-4">
          <div className="section-title mb-4">👤 Account Profile</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            {user?.photoURL
              ? <img src={user.photoURL} style={{ width: 56, height: 56, borderRadius: '50%' }} alt="avatar"/>
              : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#00D9FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700 }}>
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.displayName || 'Security Admin'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{user?.email}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--cyan)', marginTop: '2px' }}>CISO · Enterprise Plan</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Full Name',    val: user?.displayName || '' },
              { label: 'Email',        val: user?.email || '' },
              { label: 'Role',         val: 'CISO' },
              { label: 'Organization', val: 'Apex Financial Services' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{f.label.toUpperCase()}</label>
                <input defaultValue={f.val} style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', color: 'var(--text)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor='rgba(0,217,255,0.4)'} onBlur={e => e.target.style.borderColor='var(--border)'}/>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card mb-4">
          <div className="section-title mb-4">🔔 Notification Preferences</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'criticalAlerts',   label: 'Critical Alerts',           desc: 'Immediate notifications for CRITICAL severity threats' },
              { key: 'weeklyReport',     label: 'Weekly Security Digest',    desc: 'Summary of threats, improvements, and trends every Monday' },
              { key: 'simResults',       label: 'Simulation Results',        desc: 'When a phishing campaign completes, get the results' },
              { key: 'policyTriggered',  label: 'Policy Engine Triggers',    desc: 'Notify when automated rules fire (MFA lock, payment hold)' },
            ].map(n => (
              <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{n.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{n.desc}</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={notifs[n.key]} onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}/>
                  <span className="slider"/>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card mb-4">
          <div className="section-title mb-4">🔐 Security Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Two-Factor Authentication</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--safe)' }}>✓ Enabled via Google Account</div>
              </div>
              <span className="badge safe"><span className="badge-dot"/>&nbsp;Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Active Sessions</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>1 active session · Chrome on Windows</div>
              </div>
              <button className="btn btn-ghost btn-sm">Revoke All</button>
            </div>
          </div>
        </div>

        {/* Developer Tools */}
        <div className="card mb-4" style={{ border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.05)' }}>
          <div style={{ color: '#a78cff', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>🛠️ Developer Tools</div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', lineHeight: 1.5 }}>
            Populate your Supabase database with realistic demo data (Alerts, Employees, Policies, and Statistics).
          </div>
          <button 
            onClick={handleSeed} 
            className="btn btn-ghost" 
            disabled={seeding}
            style={{ width: '100%', borderColor: 'rgba(124,58,237,0.5)', color: '#a78cff' }}
          >
            {seeding ? '⏳ Seeding Database...' : '🚀 Seed Demo Data'}
          </button>
        </div>

        <button onClick={handleSave} className="btn btn-primary" style={{ minWidth: '140px' }}>
          {saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
