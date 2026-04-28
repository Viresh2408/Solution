// TrustNet AI — Team Management (Owner Only)
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

export default function Team() {
  const { profile } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWorker, setNewWorker] = useState({ email: '', name: '' });

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

  useEffect(() => {
    fetchWorkers();
    
    // Real-time updates
    const channel = supabase.channel('team-mgmt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchWorkers)
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '0 12px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.05em' }}>
            <span>USER / EMAIL</span>
            <span>JOIN DATE</span>
            <span>STATUS</span>
            <span style={{ textAlign: 'right' }}>ACTIONS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {workers.map(w => (
              <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '16px 12px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                    {(w.displayName || w.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.displayName || 'Unnamed User'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{w.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{new Date(w.createdAt).toLocaleDateString()}</div>
                <div>
                  <span className={`badge ${w.status === 'approved' ? 'safe' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                    <span className="badge-dot"/>&nbsp;{w.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {w.status === 'pending' && (
                    <button className="btn btn-primary btn-xs" onClick={() => approveWorker(w.id)} style={{ background: 'var(--safe)', borderColor: 'transparent' }}>Approve</button>
                  )}
                  <button className="btn btn-ghost btn-xs" onClick={() => removeWorker(w.id)} style={{ color: 'var(--danger)' }}>Revoke</button>
                </div>
              </div>
            ))}
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
                // In a real app, this would invite them. Here we just pre-create a profile.
                await supabase.from('profiles').insert({
                  id: Math.random().toString(36).substring(7), // Temporary ID until they sign in
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
