import { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  useOrgOverview, useAlerts, useDailyStats, useAttackDistribution, usePolicies, useSimulations, useEmployees
} from '../hooks/useTrustNetData';

// ── Professional Components ──────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(13, 17, 23, 0.9)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      fontSize: '12px'
    }}>
      <div style={{ fontWeight: 800, marginBottom: '8px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: p.color, boxShadow: `0 0 8px ${p.color}` }}></span>
          <span style={{ color: '#c9d1d9' }}>{p.name}:</span>
          <strong style={{ marginLeft: 'auto', fontSize: '13px' }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

function EnhancedRiskGauge({ score, size = 180 }) {
  const pct = score / 100;
  const r = size * 0.42;
  const cx = size / 2, cy = size * 0.55;
  const arc = Math.PI * r;
  const offset = arc - (pct * arc);
  const color = score >= 75 ? '#FF4D4D' : score >= 50 ? '#FFD43B' : '#00E676';

  return (
    <div className="risk-gauge-v2" style={{ position: 'relative', width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E676"/>
            <stop offset="50%" stopColor="#FFD43B"/>
            <stop offset="100%" stopColor="#FF4D4D"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Background Track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={size * 0.08} strokeLinecap="round"/>
        {/* Progress Fill */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGradient)" strokeWidth={size * 0.08} strokeLinecap="round"
          strokeDasharray={arc} strokeDashoffset={offset} filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}/>
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -10%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: size * 0.28, fontWeight: 900, color: '#fff', textShadow: `0 0 20px ${color}44` }}>{score}</div>
        <div style={{ fontSize: '10px', color: '#8b949e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risk Index</div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Overview() {
  const { org } = useOrgOverview();
  const { alerts } = useAlerts(100);
  const { stats } = useDailyStats(14);
  const { policies } = usePolicies();
  const { simulations } = useSimulations();
  const { employees } = useEmployees();
  const attackDistribution = useAttackDistribution();
  
  const [animateScore, setAnimateScore] = useState(0);

  // Derive Stats
  const activeAlerts = alerts.filter(a => a.status !== 'resolved').length;
  const blockedToday = alerts.filter(a => a.blocked && new Date(a.timestamp).toDateString() === new Date().toDateString()).length;
  const activePolicies = policies.filter(p => p.enabled).length;
  const ongoingSims = simulations.filter(s => s.status === 'active' || s.status === 'sending').length;

  // Sandbox State
  const [scanUrl, setScanUrl] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); 
  const [scanSteps, setScanSteps] = useState([]);

  const handleScan = () => {
    if (!scanUrl) return;
    setScanStatus('scanning');
    setScanSteps([]);
    const steps = [
      '⚡ Querying Safe Browsing Global Database...',
      '🧬 Fingerprinting Cognitive Bias Vectors...',
      '📡 Probing Infrastructure Reputation...',
      '🤖 Gemini AI performing Deep Semantic Analysis...',
      '🛡️ Generating Final Risk Assessment...'
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
    }, 600);
  };

  useEffect(() => {
    if (org?.riskScore) {
      setTimeout(() => setAnimateScore(org.riskScore), 400);
    }
  }, [org?.riskScore]);

  return (
    <div className="page fade-in" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '4px', background: 'linear-gradient(to right, #fff, #8b949e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            System Intelligence
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '1rem' }}>Organization-wide human vulnerability telemetry.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'8px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Report
          </button>
          <button className="btn btn-primary" style={{ boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)' }}>
            + Launch Campaign
          </button>
        </div>
      </div>

      {/* STAT CARDS - MODERN FLOATING STYLE */}
      <div className="grid-4 mb-8" style={{ gap: '20px' }}>
        {[
          { label: 'Intelligence Index', val: animateScore, color: 'var(--danger)', icon: '◈', delta: '+2.4%', sub: 'vs last week' },
          { label: 'Active Incidents', val: activeAlerts, color: 'var(--warning)', icon: '✦', delta: '-12%', sub: 'resolution rate' },
          { label: 'Protected Vectors', val: activePolicies, color: 'var(--safe)', icon: '🛡', delta: 'Active', sub: 'Real-time enforcement' },
          { label: 'Simulations Live', val: ongoingSims, color: 'var(--cyan)', icon: '📡', delta: 'Operational', sub: 'Red Team mode' }
        ].map((s, i) => (
          <div key={i} className="card" style={{ 
            padding: '24px', 
            background: 'linear-gradient(145deg, rgba(22, 27, 34, 0.8), rgba(13, 17, 23, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '6rem', opacity: 0.03, fontWeight: 900 }}>{s.icon}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.85rem', color: s.delta.startsWith('-') ? 'var(--safe)' : 'var(--danger)', fontWeight: 700 }}>{s.delta}</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '8px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* MAIN DATA GRID */}
      <div className="grid-7-3 mb-8" style={{ gap: '24px' }}>
        
        {/* BIG CHART AREA */}
        <div className="card" style={{ padding: '32px', background: 'rgba(22, 27, 34, 0.4)', backdropFilter: 'blur(10px)' }}>
          <div className="section-header mb-8">
            <div>
              <h2 className="section-title" style={{fontSize: '1.2rem'}}>Vulnerability Telemetry</h2>
              <p className="section-subtitle">Cross-referenced historical risk scoring</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              {['1W', '1M', '3M', '1Y'].map(t => (
                <button key={t} className={`btn btn-xs ${t === '1M' ? 'btn-primary' : 'btn-ghost'}`} style={{minWidth:'40px'}}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats}>
              <defs>
                <linearGradient id="colorOrg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4757" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF4757" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#8b949e', fontSize:11}} dy={15}/>
              <YAxis axisLine={false} tickLine={false} tick={{fill:'#8b949e', fontSize:11}} dx={-10}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="orgRisk" stroke="#FF4757" strokeWidth={3} fillOpacity={1} fill="url(#colorOrg)" />
              <Line type="monotone" dataKey="industryAvg" stroke="#3fb950" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RISK INDEX PANEL */}
        <div className="card" style={{ 
          padding: '32px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(22, 27, 34, 1) 0%, rgba(13, 17, 23, 1) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <EnhancedRiskGauge score={animateScore} size={220} />
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: animateScore > 70 ? 'var(--danger)' : 'var(--safe)' }}>
              {animateScore > 70 ? 'Critical Attention' : 'System Healthy'}
            </h3>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: '8px', lineHeight: 1.6 }}>
              Current exposure is derived from 5-engine telemetry and behavioral biometrics.
            </p>
          </div>
          <div style={{ width: '100%', marginTop: '32px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>Regulatory Compliance</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--safe)' }}>94.2%</span>
            </div>
            <div className="progress-bar" style={{ height: '6px' }}>
              <div className="progress-fill" style={{ width: '94.2%', background: 'var(--safe)', boxShadow: '0 0 10px var(--safe)44' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY GRID */}
      <div className="grid-6-4" style={{ gap: '24px' }}>
        
        {/* SANDBOX AREA */}
        <div className="card" style={{ 
          padding: '32px',
          border: scanStatus === 'blocked' ? '1px solid rgba(255, 77, 77, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
          background: scanStatus === 'blocked' ? 'linear-gradient(145deg, rgba(13, 17, 23, 1), rgba(45, 10, 10, 0.4))' : 'rgba(22, 27, 34, 0.4)'
        }}>
          <div className="section-header mb-6">
            <div>
              <h2 className="section-title">Zero-Day Intelligence Sandbox</h2>
              <p className="section-subtitle">Test suspicious URLs against the TrustNet AI core</p>
            </div>
            <div className={`badge ${scanStatus === 'scanning' ? 'warning' : 'safe'}`}>
              <span className="badge-dot"></span> Real-time Engine
            </div>
          </div>

          {scanStatus === 'blocked' ? (
            <div className="fade-in" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px', filter: 'drop-shadow(0 0 10px #ff475744)' }}>🛑</div>
              <h3 style={{ color: 'var(--danger)', fontSize: '1.2rem', fontWeight: 800 }}>THREAT INTERCEPTED</h3>
              <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: '12px 0 24px' }}>
                Gemini AI identified advanced brand impersonation and credential harvesting patterns.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {['VT: Malicious', 'GSB: Flagged', 'Gemini: 99%', 'SSL: Suspicious'].map(tag => (
                  <div key={tag} style={{ background: 'rgba(255,71,87,0.1)', color: 'var(--danger)', padding: '8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700 }}>{tag}</div>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => {setScanStatus('idle'); setScanUrl(''); setScanSteps([]);}}>Reset Sandbox</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input 
                  value={scanUrl} 
                  onChange={e => setScanUrl(e.target.value)}
                  placeholder="https://secure-login-verify.net/auth" 
                  className="input-modern"
                  style={{ 
                    flex: 1, 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    borderRadius: '12px', 
                    padding: '14px 20px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem'
                  }}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={handleScan} 
                  disabled={!scanUrl || scanStatus === 'scanning'}
                  style={{ borderRadius: '12px', padding: '0 24px' }}
                >
                  {scanStatus === 'scanning' ? 'Probing...' : 'Analyze'}
                </button>
              </div>
              {scanSteps.length > 0 && (
                <div style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  fontFamily: 'var(--mono)', 
                  fontSize: '0.75rem', 
                  color: 'var(--safe)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {scanSteps.map((step, idx) => (
                    <div key={idx} className="fade-in" style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ opacity: 0.5 }}>[{idx + 1}]</span> {step}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* RECENT ALERTS FEED */}
        <div className="card" style={{ padding: '32px', background: 'rgba(22, 27, 34, 0.4)' }}>
          <div className="section-header mb-6">
            <h2 className="section-title">Global Threat Stream</h2>
            <button className="btn btn-link btn-sm">View Archive</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {alerts.slice(0, 4).map((alert, i) => (
              <div key={alert.id} style={{ 
                display: 'flex', 
                gap: '16px', 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '16px',
                borderLeft: `4px solid ${alert.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'}`,
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px' }}>{alert.type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{alert.user} · {alert.dept}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '6px' }}>{alert.time}</div>
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    background: alert.blocked ? 'var(--safe-dim)' : 'var(--danger-dim)',
                    color: alert.blocked ? 'var(--safe)' : 'var(--danger)',
                    textTransform: 'uppercase'
                  }}>
                    {alert.blocked ? 'Shield On' : 'Intercepted'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
