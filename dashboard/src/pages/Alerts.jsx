import { useState } from 'react';
import { useAlerts, resolveAlert } from '../hooks/useTrustNetData';

export default function Alerts() {
  const { alerts, loading } = useAlerts(100);
  const [filter, setFilter] = useState('All');
  const [resolved, setResolved] = useState(new Set());

  const filters = ['All', 'Critical', 'High', 'Medium', 'Unblocked'];
  const filtered = alerts.filter(a => {
    if (filter === 'All') return true;
    if (filter === 'Unblocked') return !a.blocked;
    return a.severity === filter.toLowerCase();
  });

  const resolve = async (id) => {
    setResolved(s => new Set([...s, id]));
    await resolveAlert(id); // writes to Firestore
  };

  const recentAlerts = alerts; // alias for count refs below

  const severityColor = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--cyan)' };

  return (
    <div className="page">
      {/* Summary */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px'}}>
        {[
          {label:'Critical', count: recentAlerts.filter(a=>a.severity==='critical').length, color:'var(--danger)'},
          {label:'High', count: recentAlerts.filter(a=>a.severity==='high').length, color:'var(--warning)'},
          {label:'Medium', count: recentAlerts.filter(a=>a.severity==='medium').length, color:'var(--cyan)'},
          {label:'Unblocked', count: recentAlerts.filter(a=>!a.blocked).length, color:'var(--danger)'},
        ].map(s => (
          <div key={s.label} style={{background:'var(--bg-card)', border:`1px solid ${s.color}33`, borderRadius:'var(--r-md)', padding:'16px', textAlign:'center'}}>
            <div style={{fontFamily:'var(--mono)', fontSize:'1.8rem', fontWeight:900, color:s.color}}>{s.count}</div>
            <div style={{fontSize:'0.78rem', color:'var(--text-2)'}}>{s.label} Alerts</div>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center'}}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter===f ? 'btn-primary' : 'btn-ghost'}`}>
              {f}
            </button>
          ))}
          <div style={{marginLeft:'auto', fontSize:'0.78rem', color:'var(--text-2)'}}>
            {filtered.length} alerts
          </div>
        </div>

        <div className="alert-feed">
          {filtered.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity}`} style={{opacity: resolved.has(alert.id) ? 0.4 : 1, transition:'opacity 0.3s'}}>
              <div className={`alert-dot ${alert.severity}`}></div>
              <div style={{flex:1}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px', flexWrap:'wrap'}}>
                  <span className={`badge ${alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'cyan'}`}>
                    <span className="badge-dot"></span>{alert.severity.toUpperCase()}
                  </span>
                  <span className="badge danger">{alert.type}</span>
                  <span className="alert-title" style={{flex:1}}>{alert.detail}</span>
                </div>
                <div className="alert-meta" style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                  <span>👤 {alert.user}</span>
                  <span>🏢 {alert.dept}</span>
                  <span style={{fontFamily:'var(--mono)', fontSize:'0.7rem'}}>{alert.id}</span>
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0}}>
                <span className="alert-time">{alert.time}</span>
                <span className={`badge ${alert.blocked ? 'safe' : 'danger'}`}>
                  {alert.blocked ? '✓ Auto-Blocked' : '⚠ Requires Action'}
                </span>
                {!resolved.has(alert.id) ? (
                  <button onClick={() => resolve(alert.id)} className="btn btn-ghost btn-sm" style={{fontSize:'0.68rem', padding:'2px 8px'}}>
                    Resolve
                  </button>
                ) : (
                  <span style={{fontSize:'0.72rem', color:'var(--safe)'}}>✓ Resolved</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
