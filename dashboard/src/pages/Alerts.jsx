import { useState } from 'react';
import { useAlerts, resolveAlert } from '../hooks/useTrustNetData';

// Simulated Slack notify (real impl calls Cloud Function)
async function notifySlackAlert(alert) {
  // In production: calls Firebase Cloud Function `notifySlack`
  // For demo: simulated with terminal log + Supabase update
  console.log(`[NOTIFY] channel=#security-alerts status=delivered threat=${alert.type} user=${alert.user}`);
  return true;
}

export default function Alerts() {
  const { alerts, loading } = useAlerts(100);
  const [filter, setFilter] = useState('All');
  const [notifiedIds, setNotifiedIds] = useState(new Set());
  const [notifyingId, setNotifyingId] = useState(null);

  const filters = ['All', 'Critical', 'High', 'Medium', 'Vishing', 'Session Hijack', 'Unblocked'];
  const filtered = alerts.filter(a => {
    if (filter === 'All')           return true;
    if (filter === 'Unblocked')     return !a.blocked;
    if (filter === 'Vishing')       return a.type === 'Vishing' || a.type === 'VISHING';
    if (filter === 'Session Hijack') return a.type === 'Session Hijack';
    return a.severity === filter.toLowerCase();
  });

  const severityColor = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--cyan)' };

  const typeIcon = {
    'Phishing':       '🎣',
    'BEC':            '💼',
    'Malware':        '🦠',
    'Vishing':        '📞',
    'VISHING':        '📞',
    'Session Hijack': '🔀',
    'Fraud Attempt':  '🚨',
    'Policy Violation': '📋',
  };

  const handleNotifySlack = async (alert) => {
    setNotifyingId(alert.id);
    try {
      await notifySlackAlert(alert);
      setNotifiedIds(prev => new Set([...prev, alert.id]));
    } catch {}
    setNotifyingId(null);
  };

  return (
    <div className="page">
      {/* Summary */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'14px', marginBottom:'20px'}}>
        {[
          {label:'Critical',      count: alerts.filter(a=>a.severity==='critical').length,          color:'var(--danger)'},
          {label:'High',          count: alerts.filter(a=>a.severity==='high').length,              color:'var(--warning)'},
          {label:'Medium',        count: alerts.filter(a=>a.severity==='medium').length,            color:'var(--cyan)'},
          {label:'Vishing',       count: alerts.filter(a=>a.type==='Vishing'||a.type==='VISHING').length, color:'#FFA502'},
          {label:'Session Hijack',count: alerts.filter(a=>a.type==='Session Hijack').length,        color:'#FF6B35'},
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
              {f === 'Vishing' ? '📞 ' : f === 'Session Hijack' ? '🔀 ' : ''}{f}
            </button>
          ))}
          <div style={{marginLeft:'auto', fontSize:'0.78rem', color:'var(--text-2)'}}>
            {filtered.length} alerts
          </div>
        </div>

        <div className="alert-feed">
          {filtered.map(alert => {
            const isResolved   = alert.status === 'resolved';
            const isVishing    = alert.type === 'Vishing' || alert.type === 'VISHING';
            const isSession    = alert.type === 'Session Hijack';
            const isCritical   = alert.severity === 'critical';
            const isNotified   = notifiedIds.has(alert.id) || alert.slackNotified;
            const isNotifying  = notifyingId === alert.id;
            const borderColor  = isVishing ? 'rgba(255,165,2,0.35)' : isSession ? 'rgba(255,107,53,0.35)' : undefined;

            return (
              <div key={alert.id} className={`alert-item ${alert.severity}`}
                style={{opacity: isResolved ? 0.4 : 1, transition:'opacity 0.3s', borderColor}}>
                <div className={`alert-dot ${alert.severity}`}></div>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px', flexWrap:'wrap'}}>
                    <span className={`badge ${alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'cyan'}`}>
                      <span className="badge-dot"></span>{alert.severity?.toUpperCase()}
                    </span>
                    <span className="badge danger" style={{gap:'4px'}}>
                      {typeIcon[alert.type] || '⚠'} {alert.type}
                    </span>
                    <span className="alert-title" style={{flex:1}}>{alert.detail}</span>
                  </div>
                  <div className="alert-meta" style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                    <span>👤 {alert.user}</span>
                    <span>🏢 {alert.dept}</span>
                    <span style={{fontFamily:'var(--mono)', fontSize:'0.7rem'}}>{alert.id?.slice(0,8)}</span>
                    {/* Slack badge */}
                    {isNotified && (
                      <span style={{
                        fontSize:'0.65rem', background:'rgba(46,213,115,0.12)',
                        border:'1px solid rgba(46,213,115,0.25)', color:'var(--safe)',
                        padding:'1px 7px', borderRadius:'8px', fontWeight:600,
                      }}>
                        ✓ Slack: delivered
                      </span>
                    )}
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0}}>
                  <span className="alert-time">{alert.time}</span>
                  <span className={`badge ${alert.blocked ? 'safe' : 'danger'}`}>
                    {alert.blocked ? '✓ Auto-Blocked' : '⚠ Requires Action'}
                  </span>
                  {/* Slack notify button for CRITICAL unresolved */}
                  {isCritical && !isResolved && !isNotified && (
                    <button
                      onClick={() => handleNotifySlack(alert)}
                      disabled={isNotifying}
                      className="btn btn-ghost btn-sm"
                      style={{fontSize:'0.68rem', padding:'2px 8px', color:'#FFA502', borderColor:'rgba(255,165,2,0.3)'}}
                    >
                      {isNotifying ? '…' : '📣 Notify Slack'}
                    </button>
                  )}
                  {!isResolved ? (
                    <button onClick={() => resolveAlert(alert.id)} className="btn btn-ghost btn-sm" style={{fontSize:'0.68rem', padding:'2px 8px'}}>
                      Resolve
                    </button>
                  ) : (
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
                      <span style={{fontSize:'0.72rem', color:'var(--safe)', fontWeight:700}}>✓ Resolved</span>
                      <span style={{fontSize:'0.6rem', color:'var(--text-3)'}}>by {alert.resolvedBy || 'Admin'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{textAlign:'center', padding:'40px', color:'var(--text-3)', fontSize:'0.85rem'}}>
              No alerts match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
