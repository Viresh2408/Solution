// TrustNet AI — Team Management (Owner Only) — with Biometric Anomaly Panel (F1)
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

export default function Team() {
  const { profile } = useAuth();
  const [workers, setWorkers]           = useState([]);
  const [biometricData, setBiometricData] = useState({}); // keyed by employeeName
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [newWorker, setNewWorker]       = useState({ email: '', name: '' });

  const fetchWorkers = async () => {
    if (!profile?.orgId) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('orgId', profile.orgId)
      .neq('role', 'owner');
    setWorkers(data || []);
    setLoading(false);
  };

  // F1 — Fetch biometric events per employee
  const fetchBiometricData = async () => {
    if (!profile?.orgId) return;
    try {
      const { data } = await supabase
        .from('biometric_events')
        .select('employeeName, anomalyScore, triggerType, timestamp')
        .eq('orgId', profile.orgId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (data) {
        // Keep only the most recent event per employee
        const byEmployee = {};
        data.forEach(row => {
          if (!byEmployee[row.employeeName]) {
            byEmployee[row.employeeName] = row;
          }
        });
        setBiometricData(byEmployee);
      }
    } catch {
      // Table might not exist yet — silently degrade
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchBiometricData();

    // Real-time updates for team
    const channel = supabase.channel('team-mgmt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchWorkers)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'biometric_events' }, fetchBiometricData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile]);

  const approveWorker = async (id) => {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
  };

  const removeWorker = async (id) => {
    await supabase.from('profiles').delete().eq('id', id);
  };

  if (profile?.role !== 'owner') {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ fontWeight: 800 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-3)' }}>Only company owners can manage the team.</p>
      </div>
    );
  }

  const anomalyColor = (score) => {
    if (!score && score !== 0) return 'var(--text-3)';
    return score >= 60 ? 'var(--danger)' : score >= 35 ? 'var(--warning)' : 'var(--safe)';
  };

  return (
    <div className="page">
      <div className="section-header mb-6">
        <div>
          <h2 className="section-title">Team Management</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Manage access for <strong style={{color:'var(--cyan)'}}>{profile.orgId}</strong> employees.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Worker</button>
      </div>

      <div className="grid-1">
        <div className="card">
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr', padding: '0 12px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.05em' }}>
            <span>USER / EMAIL</span>
            <span>JOIN DATE</span>
            <span>STATUS</span>
            <span>🧬 BIOMETRIC SCORE</span>
            <span style={{ textAlign: 'right' }}>ACTIONS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {workers.map(w => {
              const bioEvent = biometricData[w.displayName] || biometricData[w.email] || null;
              const score    = bioEvent?.anomalyScore ?? null;
              const trigger  = bioEvent?.triggerType   ?? null;
              const color    = anomalyColor(score);

              return (
                <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr', padding: '16px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  {/* Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                      {(w.displayName || w.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.displayName || 'Unnamed User'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{w.email}</div>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{new Date(w.createdAt).toLocaleDateString()}</div>

                  {/* Status */}
                  <div>
                    <span className={`badge ${w.status === 'approved' ? 'safe' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                      <span className="badge-dot"/>&nbsp;{w.status.toUpperCase()}
                    </span>
                  </div>

                  {/* F1 — Biometric Sub-Panel */}
                  <div>
                    {score !== null ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '0.9rem', color }}>{score}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>/100</span>
                          {score >= 60 && (
                            <span style={{ fontSize: '0.6rem', background: 'rgba(255,71,87,0.12)', color: 'var(--danger)', border: '1px solid rgba(255,71,87,0.25)', borderRadius: '6px', padding: '1px 5px', fontWeight: 700 }}>⚠ FLAGGED</span>
                          )}
                        </div>
                        {/* Score bar */}
                        <div style={{ height: 4, background: 'var(--bg-base)', borderRadius: 2, width: 90 }}>
                          <div style={{ height: '100%', width: score + '%', background: color, borderRadius: 2, transition: 'width 0.5s' }} />
                        </div>
                        {trigger && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
                            {trigger.replace(/_/g, ' ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>No data yet</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {w.status === 'pending' && (
                      <button className="btn btn-primary btn-xs" onClick={() => approveWorker(w.id)} style={{ background: 'var(--safe)', borderColor: 'transparent' }}>Approve</button>
                    )}
                    <button className="btn btn-ghost btn-xs" onClick={() => removeWorker(w.id)} style={{ color: 'var(--danger)' }}>Revoke</button>
                  </div>
                </div>
              );
            })}
            {workers.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)', fontSize: '0.85rem' }}>No workers found in this organization.</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Worker Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '20px' }}>Pre-approve Worker</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>EMAIL ADDRESS</label>
              <input value={newWorker.email} onChange={e => setNewWorker({ ...newWorker, email: e.target.value })} placeholder="worker@company.com" style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: '#fff' }}/>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={async () => {
                await supabase.from('profiles').insert({
                  id: Math.random().toString(36).substring(7),
                  email: newWorker.email,
                  role: 'worker',
                  orgId: profile.orgId,
                  status: 'approved',
                  createdAt: new Date().toISOString()
                });
                setShowAdd(false);
                fetchWorkers();
              }}>Pre-approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
