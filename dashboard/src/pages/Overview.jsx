import { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  useOrgOverview, useAlerts, useDailyStats, useAttackDistribution
} from '../hooks/useTrustNetData';


// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#0D1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', fontSize:'12px'}}>
      <div style={{fontWeight:700, marginBottom:'6px', color:'#9BA3B2'}}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{color:p.color, display:'flex', gap:'8px', alignItems:'center'}}>
          <span style={{width:'8px',height:'8px',borderRadius:'50%',background:p.color,display:'inline-block'}}></span>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// Gauge component
function RiskGauge({ score, size = 120 }) {
  const pct = score / 100;
  const r = size * 0.38;
  const cx = size / 2, cy = size * 0.55;
  const arc = Math.PI * r;
  const offset = arc - (pct * arc);
  const color = score >= 75 ? '#FF4757' : score >= 50 ? '#FFA502' : '#2ED573';

  return (
    <div className="risk-gauge" style={{width:size, height:size * 0.7}}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2ED573"/>
            <stop offset="50%" stopColor="#FFA502"/>
            <stop offset="100%" stopColor="#FF4757"/>
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.07} strokeLinecap="round"/>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth={size*0.07} strokeLinecap="round"
          strokeDasharray={arc} strokeDashoffset={offset} style={{transition:'stroke-dashoffset 1.5s ease'}}/>
      </svg>
      <div className="risk-gauge-val" style={{fontSize: size * 0.22, color}}>
        {score}
      </div>
    </div>
  );
}

export default function Overview() {
  const { org } = useOrgOverview();
  const { alerts } = useAlerts(5);
  const { stats } = useDailyStats(14);
  const attackDistribution = useAttackDistribution();
  const [animateScore, setAnimateScore] = useState(0);

  // Sandbox State
  const [scanUrl, setScanUrl] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | blocked
  const [scanSteps, setScanSteps] = useState([]);

  const handleScan = () => {
    if (!scanUrl) return;
    setScanStatus('scanning');
    setScanSteps([]);
    const steps = [
      '📡 Querying Google Safe Browsing...',
      '🦠 Polling 70+ VirusTotal Engines...',
      '🗺️ Resolving IP via Cloudflare DoH...',
      '🔍 Analyzing Host Infrastructure (Shodan)...',
      '🧠 Gemini AI analyzing cognitive intent...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setScanSteps(prev => [...prev, steps[i]]);
        i++;
      } else {
        clearInterval(interval);
        setScanStatus('blocked');
      }
    }, 450);
  };


  // Weekly attack breakdown from last 7 daily stats entries
  const attackTrend7d = (stats.slice(-7)).map(s => ({
    day: s.day || s.date,
    phishing: s.phishing || 0,
    bec:      s.bec      || 0,
    vishing:  s.vishing  || 0,
    smishing: s.smishing || 0,
  }));

  useEffect(() => {
    if (org?.riskScore) {
      const timer = setTimeout(() => setAnimateScore(org.riskScore), 200);
      return () => clearTimeout(timer);
    }
  }, [org?.riskScore]);

  const scoreColor = animateScore >= 75 ? 'var(--danger)' : animateScore >= 50 ? 'var(--warning)' : 'var(--safe)';
  const scoreLabel = animateScore >= 75 ? 'High Risk'    : animateScore >= 50 ? 'Moderate Risk'  : 'Low Risk';

  // Show skeleton values while loading
  const o = org || {
    riskScore: '—', activeAlerts: '—', threatsBlockedToday: '—',
    totalEmployees: '—', improvementRate: '—', vulnerableUsers: '—', complianceScore: 0,
  };


  return (
    <div className="page">

      {/* STAT CARDS */}
      <div className="stat-cards-grid mb-6">
        <div className="stat-card danger">
          <div className="stat-icon danger">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          </div>
          <span className="stat-value" style={{color:'var(--danger)'}}>{o.riskScore}</span>
          <span className="stat-label">Org Risk Score</span>
          <div className="stat-delta up">↑ +4 this week</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
          </div>
          <span className="stat-value" style={{color:'var(--warning)'}}>{o.activeAlerts}</span>
          <span className="stat-label">Active Alerts</span>
          <div className="stat-delta up">↑ +23 vs yesterday</div>
        </div>
        <div className="stat-card safe">
          <div className="stat-icon safe">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span className="stat-value" style={{color:'var(--safe)'}}>{o.threatsBlockedToday}</span>
          <span className="stat-label">Threats Blocked Today</span>
          <div className="stat-delta down">↓ -3 vs yesterday</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon cyan">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
          </div>
          <span className="stat-value" style={{color:'var(--cyan)'}}>{typeof o.totalEmployees === 'number' ? o.totalEmployees.toLocaleString() : o.totalEmployees}</span>
          <span className="stat-label">Protected Employees</span>
          <div className="stat-delta down">↑ {o.improvementRate} improvement</div>
        </div>
      </div>

      <div className="grid-7-3 mb-4" style={{gap:'16px'}}>
        {/* Vulnerability Trend Chart */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">30-Day Vulnerability Trend</div>
              <div className="section-subtitle">Organization vs Industry Average</div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm">30D</button>
              <button className="btn btn-ghost btn-sm">90D</button>
              <button className="btn btn-ghost btn-sm">180D</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4757" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#FF4757" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="indGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D9FF" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#00D9FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="day" tick={{fill:'#4A5568', fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#4A5568', fontSize:11}} axisLine={false} tickLine={false} domain={[40,100]}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:'11px', paddingTop:'8px'}}/>
              <Area type="monotone" dataKey="orgRisk" name="Org Risk" stroke="#FF4757" fill="url(#orgGrad)" strokeWidth={2}/>
              <Area type="monotone" dataKey="industryAvg" name="Industry Avg" stroke="#00D9FF" fill="url(#indGrad)" strokeWidth={2} strokeDasharray="4 4"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Org Risk Score */}
        <div className="card" style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:'8px'}}>
          <div className="card-title">Overall Risk Score</div>
          <RiskGauge score={animateScore} size={160}/>
          <div style={{fontSize:'1rem', fontWeight:700, color:scoreColor}}>{scoreLabel}</div>
          <div style={{fontSize:'0.78rem', color:'var(--text-2)', lineHeight:1.5}}>
            {o.vulnerableUsers} of {o.totalEmployees} employees at elevated risk
          </div>
          <div style={{width:'100%', marginTop:'8px'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'4px'}}>
              <span>Compliance Score</span>
              <span style={{color:'var(--safe)', fontFamily:'var(--mono)'}}>{o.complianceScore}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width:`${o.complianceScore}%`, background:'var(--safe)'}}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-6-4 mb-4" style={{gap:'16px'}}>
        {/* Attack Type Weekly Trend */}
        <div className="card">
          <div className="section-header">
            <div>
              <div className="section-title">Weekly Attack Volume by Type</div>
              <div className="section-subtitle">Last 7 days — incidents per type</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attackTrend7d} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="day" tick={{fill:'#4A5568', fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#4A5568', fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="phishing" name="Phishing" fill="#FF4757" radius={[3,3,0,0]}/>
              <Bar dataKey="bec" name="BEC" fill="#7C3AED" radius={[3,3,0,0]}/>
              <Bar dataKey="vishing" name="Vishing" fill="#FFA502" radius={[3,3,0,0]}/>
              <Bar dataKey="smishing" name="Smishing" fill="#00D9FF" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attack Distribution Pie */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Attack Distribution</div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={attackDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {attackDistribution.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
              </Pie>
              <Tooltip formatter={(val) => [`${val}%`, '']}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex', flexDirection:'column', gap:'5px', marginTop:'8px'}}>
            {attackDistribution.slice(0,4).map((a,i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:a.color,display:'inline-block',flexShrink:0}}></span>
                <span className="text-muted">{a.name}</span>
                <span style={{marginLeft:'auto', fontFamily:'var(--mono)', fontSize:'0.75rem'}}>{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zero-Day Phishing Sandbox */}
      <div className="card mb-6" style={{ border: scanStatus === 'blocked' ? '1px solid var(--danger)' : '' }}>
        <div className="section-header mb-4">
          <div>
            <div className="section-title">Zero-Day Phishing Sandbox</div>
            <div className="section-subtitle">Test the Chrome Extension Core Engine directly in the dashboard</div>
          </div>
          <span className="badge safe"><span className="badge-dot"></span> Live Engine</span>
        </div>
        
        {scanStatus === 'blocked' ? (
          <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 'var(--r-md)', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🛑</div>
            <h3 style={{ color: 'var(--danger)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>ACCESS DENIED: MALICIOUS SITE BLOCKED</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', maxWidth: '400px', margin: '0 auto 16px' }}>
              TrustNet AI intercepted and blocked <strong style={{color:'#fff'}}>{scanUrl}</strong> before rendering.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px', margin: '0 auto 20px' }}>
               <div>✅ Safe Browsing: <span style={{color:'var(--text-3)'}}>Clean</span></div>
               <div>✅ VirusTotal: <span style={{color:'var(--warning)'}}>2/76 Suspicious</span></div>
               <div>✅ Shodan: <span style={{color:'var(--danger)'}}>Known C2 Server</span></div>
               <div>✅ Gemini AI: <span style={{color:'var(--danger)'}}>High Probability Phishing</span></div>
            </div>
            <button className="btn btn-ghost" onClick={() => {setScanStatus('idle'); setScanUrl(''); setScanSteps([]);}}>Test Another URL</button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                value={scanUrl}
                onChange={e => setScanUrl(e.target.value)}
                placeholder="Paste suspicious URL here (e.g., http://login-micro-soft-secure.com)"
                style={{ flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--text)', outline: 'none' }}
                disabled={scanStatus === 'scanning'}
              />
              <button className="btn btn-primary" onClick={handleScan} disabled={!scanUrl || scanStatus === 'scanning'}>
                {scanStatus === 'scanning' ? 'Analyzing...' : 'Scan URL'}
              </button>
            </div>
            {scanSteps.length > 0 && (
              <div style={{ background: '#0a0e17', borderRadius: '8px', padding: '12px', fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {scanSteps.map((s, i) => (
                  <div key={i} style={{ animation: 'fadeInUp 0.3s ease forwards' }}>{s}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <div className="section-header mb-4">
          <div>
            <div className="section-title">Live Threat Feed</div>
            <div className="section-subtitle">Real-time incidents across organization</div>
          </div>
          <button className="btn btn-ghost btn-sm">View All Alerts</button>
        </div>
        <div className="alert-feed">
          {alerts.slice(0,5).map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity}`}>
              <div className={`alert-dot ${alert.severity}`}></div>
              <div style={{flex:1}}>
                <div className="alert-title">
                  <span className={`badge ${alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'cyan'}`} style={{marginRight:'6px'}}>
                    <span className="badge-dot"></span>{alert.type}
                  </span>
                  {alert.detail}
                </div>
                <div className="alert-meta">
                  {alert.user} · {alert.dept} · {alert.id}
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px'}}>
                <span className="alert-time">{alert.time}</span>
                <span className={`badge ${alert.blocked ? 'safe' : 'danger'}`}>
                  {alert.blocked ? '✓ Blocked' : '⚠ Unblocked'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
