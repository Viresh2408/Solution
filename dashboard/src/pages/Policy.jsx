import { useState } from 'react';
import { usePolicies, togglePolicy, useSimulations } from '../hooks/useTrustNetData';
import { launchSimulation, SIMULATION_TEMPLATES } from '../utils/simulationClient';

export default function Policy() {
  const { policies: rules } = usePolicies();
  const { simulations: simulationHistory } = useSimulations();

  // Policy toggle
  const toggleRule = async (id, currentEnabled) => {
    await togglePolicy(id, currentEnabled);
  };

  // Simulation launcher state
  const [showModal, setShowModal]     = useState(false);
  const [selectedTpl, setSelectedTpl] = useState('payroll');
  const [targetCount, setTargetCount] = useState(50);
  const [fromEmail, setFromEmail]     = useState('security@yourcompany.com');
  const [fromName, setFromName]       = useState('IT Security Team');
  const [launching, setLaunching]     = useState(false);
  const [launchResult, setLaunchResult] = useState(null);
  const [launchError, setLaunchError]   = useState('');

  const handleLaunch = async () => {
    const tpl = SIMULATION_TEMPLATES.find(t => t.id === selectedTpl);
    setLaunching(true);
    setLaunchError('');
    setLaunchResult(null);
    try {
      const result = await launchSimulation({
        templateId: selectedTpl,
        name: `${tpl.name} — ${new Date().toLocaleDateString('en-IN')}`,
        targets: targetCount,
        fromEmail,
        fromName,
      });
      setLaunchResult(result);
    } catch (err) {
      setLaunchError(
        err.code === 'unauthenticated'
          ? 'Please log in to the dashboard to launch simulations.'
          : `Launch failed: ${err.message}`
      );
    } finally {
      setLaunching(false);
    }
  };

  const categoryColors = {
    'Access Control': '#00D9FF',
    'Finance':        '#FF4757',
    'Training':       '#7C3AED',
    'Email Security': '#FFA502',
    'Incident Response': '#FF6B35',
    'Browser':        '#2ED573',
  };

  return (
    <div className="page">

      {/* Policy Rules */}
      <div className="card mb-4">
        <div className="section-header mb-4">
          <div>
            <div className="section-title">Automated Policy Engine</div>
            <div className="section-subtitle">
              {rules.filter(r => r.enabled).length} of {rules.length} rules active
            </div>
          </div>
          <button className="btn btn-primary btn-sm">+ New Rule</button>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          {rules.map(rule => (
            <div key={rule.id} className="policy-rule">
              <div className="policy-info">
                <div className="policy-name">
                  <span style={{
                    display:'inline-block', fontSize:'0.65rem', fontWeight:700,
                    padding:'1px 6px', borderRadius:'4px', marginRight:'8px',
                    background:categoryColors[rule.category] + '22',
                    color:categoryColors[rule.category],
                    border:`1px solid ${categoryColors[rule.category]}44`
                  }}>
                    {rule.category}
                  </span>
                  {rule.name}
                </div>
                <div className="policy-desc">{rule.desc}</div>
                <div style={{marginTop:'6px', fontSize:'0.72rem', color:'var(--text-3)'}}>
                  Triggered <strong style={{color:'var(--text-2)', fontFamily:'var(--mono)'}}>{rule.triggeredCount}</strong> times this month
                </div>
              </div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px'}}>
                <label className="toggle">
                  <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule.id, rule.enabled)}/>
                  <span className="slider"></span>
                </label>
                <span style={{fontSize:'0.72rem', color: rule.enabled ? 'var(--safe)' : 'var(--text-3)'}}>
                  {rule.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phishing Simulation */}
      <div className="card mb-4">
        <div className="section-header mb-4">
          <div>
            <div className="section-title">Simulated Phishing Campaigns</div>
            <div className="section-subtitle">Run controlled phishing tests seeded from real TrustNet threat data</div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setShowModal(true); setLaunchResult(null); setLaunchError(''); }}
          >
            🚀 Launch Campaign
          </button>
        </div>

        {/* ── Simulation Launcher Modal ── */}
        {showModal && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000,
            display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
          }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div style={{
              background:'var(--bg-card)', border:'1px solid rgba(0,217,255,0.2)',
              borderRadius:'var(--r-xl)', padding:'28px', width:'100%', maxWidth:'560px',
              boxShadow:'0 24px 64px rgba(0,0,0,0.5)',
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div>
                  <div style={{fontWeight:800, fontSize:'1.1rem'}}>🎣 Launch Phishing Simulation</div>
                  <div style={{fontSize:'0.78rem', color:'var(--text-2)', marginTop:'2px'}}>Sends real emails via SendGrid — educational simulation</div>
                </div>
                <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', color:'var(--text-2)', cursor:'pointer', fontSize:'1.3rem'}}>✕</button>
              </div>

              {/* Template Picker */}
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'0.78rem', color:'var(--text-2)', marginBottom:'8px', fontWeight:600}}>SELECT TEMPLATE</div>
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {SIMULATION_TEMPLATES.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTpl(tpl.id)}
                      style={{
                        border: `1px solid ${selectedTpl === tpl.id ? tpl.color : 'var(--border)'}`,
                        background: selectedTpl === tpl.id ? `${tpl.color}12` : 'var(--bg-base)',
                        borderRadius:'var(--r-md)', padding:'10px 14px', cursor:'pointer',
                        display:'flex', gap:'10px', alignItems:'flex-start', transition:'all 0.15s',
                      }}
                    >
                      <span style={{fontSize:'1.3rem', marginTop:'1px'}}>{tpl.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700, fontSize:'0.85rem', color: selectedTpl === tpl.id ? tpl.color : 'var(--text)'}}>{tpl.name}</div>
                        <div style={{fontSize:'0.72rem', color:'var(--text-2)', marginTop:'2px'}}>{tpl.description}</div>
                        <div style={{display:'flex', gap:'6px', marginTop:'4px', flexWrap:'wrap'}}>
                          {tpl.tactics.map(t => (
                            <span key={t} style={{fontSize:'0.65rem', background:`${tpl.color}20`, color:tpl.color, padding:'1px 6px', borderRadius:'10px'}}>{t}</span>
                          ))}
                          <span style={{fontSize:'0.65rem', color:'var(--text-3)', marginLeft:'auto'}}>Avg fail rate: {tpl.avgFailRate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Config */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px'}}>
                <div>
                  <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'4px', fontWeight:600}}>TARGET COUNT</div>
                  <input
                    type="number" min="1" max="2148" value={targetCount}
                    onChange={e => setTargetCount(+e.target.value)}
                    style={{width:'100%', background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'8px 10px', color:'var(--text)', fontFamily:'var(--mono)'}}
                  />
                </div>
                <div>
                  <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'4px', fontWeight:600}}>SENDER NAME</div>
                  <input
                    type="text" value={fromName}
                    onChange={e => setFromName(e.target.value)}
                    style={{width:'100%', background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'8px 10px', color:'var(--text)'}}
                  />
                </div>
              </div>
              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'4px', fontWeight:600}}>SENDER EMAIL (must be SendGrid verified)</div>
                <input
                  type="email" value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  style={{width:'100%', background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'8px 10px', color:'var(--text)'}}
                />
              </div>

              {/* Result / Error */}
              {launchResult && (
                <div style={{background:'rgba(46,213,115,0.1)', border:'1px solid rgba(46,213,115,0.3)', borderRadius:'var(--r-md)', padding:'12px', marginBottom:'12px'}}>
                  <div style={{fontWeight:700, color:'var(--safe)', marginBottom:'4px'}}>✅ Campaign Launched!</div>
                  <div style={{fontSize:'0.8rem', color:'var(--text-2)'}}>
                    Sent: <strong style={{color:'var(--text)'}}>{launchResult.sent}</strong> emails &nbsp;·&nbsp;
                    Failed: <strong style={{color: launchResult.failed > 0 ? 'var(--danger)' : 'var(--text)'}}>{launchResult.failed}</strong>
                  </div>
                </div>
              )}
              {launchError && (
                <div style={{background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:'var(--r-md)', padding:'12px', marginBottom:'12px', fontSize:'0.82rem', color:'var(--danger)'}}>
                  ⚠️ {launchError}
                </div>
              )}

              <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleLaunch}
                  disabled={launching || !!launchResult}
                  style={{minWidth:'140px'}}
                >
                  {launching ? '📡 Sending...' : launchResult ? '✅ Sent' : `🚀 Send to ${targetCount} Employees`}
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Date</th>
              <th>Targets</th>
              <th>Clicked</th>
              <th>Reported</th>
              <th>Fail Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {simulationHistory.map(sim => (
              <tr key={sim.id}>
                <td>
                  <div style={{fontWeight:600, color:'var(--text)'}}>{sim.name}</div>
                  <div style={{fontSize:'0.7rem', color:'var(--text-3)', fontFamily:'var(--mono)'}}>{sim.id}</div>
                </td>
                <td style={{color:'var(--text-2)'}}>{sim.date}</td>
                <td style={{fontFamily:'var(--mono)'}}>{sim.targets.toLocaleString()}</td>
                <td style={{fontFamily:'var(--mono)', color: sim.clicked > 0 ? 'var(--danger)' : 'var(--text-2)'}}>{sim.clicked}</td>
                <td style={{fontFamily:'var(--mono)', color:'var(--safe)'}}>{sim.reported}</td>
                <td>
                  {sim.status !== 'active' ? (
                    <span style={{fontFamily:'var(--mono)', fontWeight:700, color: sim.failRate > 30 ? 'var(--danger)' : sim.failRate > 15 ? 'var(--warning)' : 'var(--safe)'}}>
                      {sim.failRate}%
                    </span>
                  ) : '—'}
                </td>
                <td>
                  <span className={`badge ${sim.status === 'active' ? 'cyan' : sim.failRate > 30 ? 'danger' : 'safe'}`}>
                    <span className="badge-dot"></span>
                    {sim.status === 'active' ? 'LIVE' : sim.failRate > 30 ? 'High Fail' : 'Passed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance */}
      <div className="card">
        <div className="section-header mb-4">
          <div className="section-title">Compliance & Audit Status</div>
        </div>
        <div className="grid-3">
          {[
            { name: 'GDPR', score: 94, status: 'Compliant', icon: '🇪🇺', color: 'var(--safe)' },
            { name: 'DPDPA 2023', score: 89, status: 'Compliant', icon: '🇮🇳', color: 'var(--safe)' },
            { name: 'ISO 27001', score: 91, status: 'Certified', icon: '📋', color: 'var(--safe)' },
            { name: 'SOC 2 Type II', score: 87, status: 'Under Review', icon: '🔍', color: 'var(--warning)' },
            { name: 'RBI Guidelines', score: 82, status: 'Compliant', icon: '🏦', color: 'var(--safe)' },
            { name: 'SEBI Cybersec', score: 78, status: 'Action Needed', icon: '⚠️', color: 'var(--warning)' },
          ].map(c => (
            <div key={c.name} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px', textAlign:'center'}}>
              <div style={{fontSize:'1.5rem', marginBottom:'6px'}}>{c.icon}</div>
              <div style={{fontWeight:700, marginBottom:'4px'}}>{c.name}</div>
              <div style={{fontFamily:'var(--mono)', fontSize:'1.2rem', fontWeight:800, color:c.color, marginBottom:'4px'}}>{c.score}%</div>
              <div style={{fontSize:'0.72rem', color:c.color}}>{c.status}</div>
              <div className="progress-bar" style={{marginTop:'8px'}}>
                <div className="progress-fill" style={{width:`${c.score}%`, background:c.color}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
