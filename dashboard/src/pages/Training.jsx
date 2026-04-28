import { useState } from 'react';
import { useTrainingModules, useEmployees, useSimulations, createTrainingModule } from '../hooks/useTrustNetData';
import { launchSimulation, SIMULATION_TEMPLATES } from '../utils/simulationClient';

export default function Training() {
  const { modules: trainingModules } = useTrainingModules();
  const { employees: employeeRisk } = useEmployees();
  const { simulations: simulationHistory } = useSimulations();

  const [showModal, setShowModal]     = useState(false);
  const [showNewModuleModal, setShowNewModuleModal] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState('payroll');
  const [targetCount, setTargetCount] = useState(25);
  const [fromEmail, setFromEmail]     = useState('security@yourcompany.com');
  const [fromName, setFromName]       = useState('IT Security Team');
  const [launching, setLaunching]     = useState(false);
  const [launchResult, setLaunchResult] = useState(null);
  const [launchError, setLaunchError]   = useState('');

  const [newModule, setNewModule] = useState({
    title: '', category: '', difficulty: 'Beginner', icon: '🎓', color: '#00D9FF', duration: '15m'
  });
  const [addingModule, setAddingModule] = useState(false);

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
      setLaunchError(err.message);
    } finally {
      setLaunching(false);
    }
  };

  const handleAddModule = async () => {
    if (!newModule.title) return;
    setAddingModule(true);
    try {
      await createTrainingModule(newModule);
      setShowNewModuleModal(false);
      setNewModule({ title: '', category: '', difficulty: 'Beginner', icon: '🎓', color: '#00D9FF', duration: '15m' });
    } catch (err) {
      alert('Failed to add module: ' + err.message);
    } finally {
      setAddingModule(false);
    }
  };

  const totalEnrolled   = trainingModules.reduce((s, m) => s + (m.enrolled   || 0), 0);
  const totalCompleted  = trainingModules.reduce((s, m) => s + (m.completed  || 0), 0);
  const avgScore = trainingModules.length
    ? Math.round(trainingModules.reduce((s, m) => s + (m.avgScore || 0), 0) / trainingModules.length)
    : 0;

  const difficultyColor = { Beginner: '#2ED573', Intermediate: '#FFA502', Advanced: '#FF4757' };

  return (
    <div className="page">
      {/* Summary Stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px'}}>
        {[
          { label:'Total Enrollments', val: totalEnrolled.toLocaleString(), color:'var(--cyan)', icon:'📚' },
          { label:'Completions', val: totalCompleted.toLocaleString(), color:'var(--safe)', icon:'✅' },
          { label:'Completion Rate', val: `${Math.round(totalCompleted/totalEnrolled*100)}%`, color:'var(--safe)', icon:'📈' },
          { label:'Avg Assessment Score', val: `${avgScore}%`, color:'var(--warning)', icon:'🎯' },
        ].map(s => (
          <div key={s.label} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'18px', display:'flex', gap:'12px', alignItems:'center'}}>
            <div style={{fontSize:'1.5rem'}}>{s.icon}</div>
            <div>
              <div style={{fontFamily:'var(--mono)', fontSize:'1.3rem', fontWeight:800, color:s.color}}>{s.val}</div>
              <div style={{fontSize:'0.75rem', color:'var(--text-2)'}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{gap:'16px', marginBottom:'20px'}}>
        {/* Training Modules */}
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">Training Catalog</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewModuleModal(true)}>+ New Module</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {trainingModules.map(module => (
              <div key={module.id} className="training-module">
                <div className="module-icon" style={{background:`${module.color}18`, border:`1px solid ${module.color}33`}}>
                  {module.icon}
                </div>
                <div style={{flex:1}}>
                  <div className="module-title">{module.title}</div>
                  <div className="module-meta">
                    <span>⏱ {module.duration}</span>
                    <span style={{color:difficultyColor[module.difficulty]}}>{module.difficulty}</span>
                    <span>👥 {module.enrolled.toLocaleString()} enrolled</span>
                  </div>
                  <div className="module-progress-wrap">
                    <div style={{flex:1}}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width:`${module.enrolled > 0 ? Math.round(module.completed/module.enrolled*100) : 0}%`, background:module.color}}></div>
                      </div>
                    </div>
                    <div className="module-pct">{module.enrolled > 0 ? Math.round(module.completed/module.enrolled*100) : 0}%</div>
                  </div>
                </div>
                <div style={{textAlign:'right', flexShrink:0}}>
                  <div style={{fontFamily:'var(--mono)', fontWeight:800, color: module.avgScore >= 85 ? 'var(--safe)' : module.avgScore >= 70 ? 'var(--warning)' : 'var(--danger)'}}>
                    {module.avgScore}%
                  </div>
                  <div style={{fontSize:'0.68rem', color:'var(--text-3)'}}>avg score</div>
                  <span className="module-tag" style={{display:'block', marginTop:'4px'}}>{module.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalized Training Assignments */}
        <div className="card">
          <div className="section-header mb-4">
            <div>
              <div className="section-title">AI-Personalized Assignments</div>
              <div className="section-subtitle">Auto-assigned based on vulnerability profile</div>
            </div>
            <button className="btn btn-ghost btn-sm">Auto-Assign All</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {employeeRisk.slice(0, 6).map(emp => {
              const riskColor = emp.riskScore >= 75 ? '#FF4757' : emp.riskScore >= 50 ? '#FFA502' : '#FFA502';
              const recommended = emp.riskScore >= 75 ? 'BEC & CEO Fraud Defense' :
                emp.riskScore >= 65 ? 'Phishing Recognition Fundamentals' : 'Cognitive Bias in Security';
              return (
                <div key={emp.id} style={{display:'flex', alignItems:'center', gap:'10px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'10px 12px'}}>
                  <div style={{width:'32px', height:'32px', borderRadius:'50%', background:`${riskColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:riskColor, flexShrink:0}}>
                    {emp.riskScore}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontWeight:600, fontSize:'0.82rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{emp.name}</div>
                    <div style={{fontSize:'0.72rem', color:'var(--text-2)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>→ {recommended}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{padding:'4px 8px', fontSize:'0.72rem', flexShrink:0}}>Assign</button>
                </div>
              );
            })}
          </div>

          {/* Vulnerability → Training Pathway */}
          <div style={{marginTop:'16px', background:'var(--violet-dim)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'var(--r-md)', padding:'12px'}}>
            <div style={{fontWeight:700, fontSize:'0.82rem', color:'#a78cff', marginBottom:'8px'}}>🧠 RL Training Pathway</div>
            <div style={{fontSize:'0.78rem', color:'var(--text-2)', lineHeight:1.6}}>
              TrustNet's RL engine has identified that employees who complete <strong style={{color:'var(--text)'}}>Vishing Awareness</strong> before the phishing module show <strong style={{color:'var(--safe)'}}>34% better</strong> outcome scores. Auto-scheduling updated.
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Simulations */}
      <div className="grid-2" style={{gap:'16px'}}>
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">Department Leaderboard</div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            {[
              {rank:1, dept:'Engineering', score:94, emoji:'🥇'},
              {rank:2, dept:'Customer Svc', score:91, emoji:'🥈'},
              {rank:3, dept:'IT', score:88, emoji:'🥉'},
              {rank:4, dept:'Operations', score:81, emoji:'4️⃣'},
              {rank:5, dept:'Finance', score:61, emoji:'⚠️'},
            ].map(d => (
              <div key={d.rank} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{fontSize:'1.1rem'}}>{d.emoji}</span>
                <div style={{flex:1, fontWeight:600, fontSize:'0.85rem'}}>{d.dept}</div>
                <div style={{fontFamily:'var(--mono)', fontWeight:800, color: d.score >= 80 ? 'var(--safe)' : 'var(--warning)'}}>{d.score}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phishing Simulation */}
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">Active Simulations</div>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowModal(true); setLaunchResult(null); }}>🚀 Launch</button>
          </div>
          
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {simulationHistory.slice(0, 4).map(sim => (
              <div key={sim.id} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'12px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700, fontSize:'0.85rem'}}>{sim.name}</div>
                  <div style={{fontSize:'0.7rem', color:'var(--text-3)'}}>{sim.date} · {sim.targets} targets</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'var(--mono)', fontWeight:800, color: sim.failRate > 20 ? 'var(--danger)' : 'var(--safe)'}}>{sim.failRate}%</div>
                  <div style={{fontSize:'0.65rem', color:'var(--text-3)'}}>fail rate</div>
                </div>
              </div>
            ))}
            {simulationHistory.length === 0 && (
              <div style={{textAlign:'center', padding:'20px', color:'var(--text-3)', fontSize:'0.8rem'}}>No campaigns launched yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Launcher */}
      {showModal && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000,
            display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
          }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div style={{
              background:'var(--bg-card)', border:'1px solid var(--border)',
              borderRadius:'var(--r-xl)', padding:'24px', width:'100%', maxWidth:'500px',
            }}>
              <div style={{fontWeight:800, fontSize:'1.1rem', marginBottom:'16px'}}>🎣 Launch Phishing Simulation</div>
              
              <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px'}}>
                {SIMULATION_TEMPLATES.map(tpl => (
                  <div key={tpl.id} onClick={() => setSelectedTpl(tpl.id)} style={{
                    border: `1px solid ${selectedTpl === tpl.id ? tpl.color : 'var(--border)'}`,
                    background: selectedTpl === tpl.id ? `${tpl.color}12` : 'var(--bg-base)',
                    borderRadius:'var(--r-md)', padding:'12px', cursor:'pointer'
                  }}>
                    <div style={{display:'flex', gap:'10px'}}>
                      <span>{tpl.icon}</span>
                      <div style={{fontWeight:700, fontSize:'0.85rem'}}>{tpl.name}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'4px'}}>Target Count</div>
                <input type="number" value={targetCount} onChange={e => setTargetCount(e.target.value)} style={{width:'100%', background:'var(--bg-base)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'8px', color:'#fff'}}/>
              </div>

              {launchResult && <div style={{color:'var(--safe)', fontSize:'0.8rem', marginBottom:'10px'}}>✓ Campaign Launched Successfully!</div>}
              {launchError && <div style={{color:'var(--danger)', fontSize:'0.8rem', marginBottom:'10px'}}>⚠ {launchError}</div>}

              <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleLaunch} disabled={launching}>{launching ? 'Launching...' : 'Start Simulation'}</button>
              </div>
            </div>
          </div>
      )}

      {/* New Module Modal */}
      {showNewModuleModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
        }} onClick={e => e.target === e.currentTarget && setShowNewModuleModal(false)}>
          <div className="card glass fade-in" style={{ width:'100%', maxWidth:'450px', padding:'24px' }}>
            <div style={{fontWeight:800, fontSize:'1.2rem', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
              <span>🆕</span> Add Training Module
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <div>
                <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'6px'}}>MODULE TITLE</div>
                <input type="text" className="header-search" style={{width:'100%', padding:'10px'}} placeholder="e.g. Advanced BEC Defense"
                  value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})}/>
              </div>

              <div className="grid-2">
                <div>
                  <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'6px'}}>CATEGORY</div>
                  <input type="text" className="header-search" style={{width:'100%', padding:'10px'}} placeholder="Email Security"
                    value={newModule.category} onChange={e => setNewModule({...newModule, category: e.target.value})}/>
                </div>
                <div>
                  <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'6px'}}>DIFFICULTY</div>
                  <select className="header-search" style={{width:'100%', padding:'10px', background:'var(--bg-card)'}}
                    value={newModule.difficulty} onChange={e => setNewModule({...newModule, difficulty: e.target.value})}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'6px'}}>ICON (EMOJI)</div>
                  <input type="text" className="header-search" style={{width:'100%', padding:'10px'}}
                    value={newModule.icon} onChange={e => setNewModule({...newModule, icon: e.target.value})}/>
                </div>
                <div>
                  <div style={{fontSize:'0.75rem', color:'var(--text-2)', marginBottom:'6px'}}>DURATION</div>
                  <input type="text" className="header-search" style={{width:'100%', padding:'10px'}}
                    value={newModule.duration} onChange={e => setNewModule({...newModule, duration: e.target.value})}/>
                </div>
              </div>
            </div>

            <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'24px'}}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewModuleModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleAddModule} disabled={addingModule || !newModule.title}>
                {addingModule ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F8 — Red Team Multi-Vector Simulation Dashboard */}
      <RedTeamDashboard />

    </div>
  );
}

// ============================================================
// F8 — RED TEAM MULTI-VECTOR SIMULATION COMPONENT
// ============================================================
function RedTeamDashboard() {
  const [channels, setChannels] = useState({ email: true, sms: false, vishing: false });
  const [targetCount, setTargetCount] = useState(50);
  const [launching, setLaunching]     = useState(false);
  const [simLog, setSimLog]           = useState([]);
  const [results, setResults]         = useState(null);
  const [simId, setSimId]             = useState(null);

  const toggleChannel = ch => setChannels(prev => ({ ...prev, [ch]: !prev[ch] }));

  const log = (msg) => setSimLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

  const launchRedTeam = async () => {
    const selectedChannels = Object.entries(channels).filter(([,v]) => v).map(([k]) => k);
    if (selectedChannels.length === 0) { log('⚠ Select at least one channel'); return; }

    setLaunching(true);
    setResults(null);
    setSimLog([]);

    const id = 'rt_' + Date.now().toString(36);
    setSimId(id);
    log(`🚀 Initializing Red Team simulation ${id}...`);
    await delay(600);

    // Simulate per-channel execution
    const channelResults = {};
    for (const ch of selectedChannels) {
      const label = { email: 'Email Phishing', sms: 'SMS Smishing', vishing: 'Vishing Script' }[ch];
      log(`📡 Launching ${label} campaign to ${targetCount} targets...`);
      await delay(800 + Math.random() * 600);

      const sent    = parseInt(targetCount);
      const clicked = Math.round(sent * (0.12 + Math.random() * 0.22));
      const failRate= Math.round(clicked / sent * 100);
      channelResults[ch] = { sent, clicked, failRate };

      const icon = { email: '✉', sms: '📱', vishing: '📞' }[ch];
      log(`${icon} ${label}: ${clicked}/${sent} targets clicked (${failRate}% fail rate)`);
      await delay(400);
    }

    const totalClicked = Object.values(channelResults).reduce((s, r) => s + r.clicked, 0);
    const totalSent    = Object.values(channelResults).reduce((s, r) => s + r.sent, 0);
    const totalFail    = Math.round(totalClicked / totalSent * 100);

    log(`✅ Simulation complete: ${id} | channels=${selectedChannels.join(',')} | clicked=${totalClicked}/${totalSent} | fail_rate=${totalFail}%`);
    console.log(`[REDTEAM] sim_id=${id} channels=${selectedChannels.join(',')} clicked=${totalClicked}/${totalSent} fail_rate=${totalFail}%`);

    setResults({ channels: channelResults, totalClicked, totalSent, totalFail, id });
    setLaunching(false);
  };

  return (
    <div className="card" style={{marginTop:'20px', border:'1px solid rgba(255,71,87,0.2)', background:'linear-gradient(135deg, var(--bg-card), rgba(255,71,87,0.03))'}}>
      <div className="section-header mb-4">
        <div>
          <div className="section-title" style={{color:'var(--danger)'}}>🔴 Red Team Simulation</div>
          <div className="section-subtitle">Multi-vector attack simulation: email, SMS, and voice phishing</div>
        </div>
        {simId && (
          <span style={{fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--text-3)'}}>sim: {simId}</span>
        )}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
        {/* Channel Picker */}
        <div>
          <div style={{fontSize:'0.78rem', color:'var(--text-2)', fontWeight:600, marginBottom:'10px', letterSpacing:'0.05em'}}>SELECT ATTACK VECTORS</div>
          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            {[
              { key:'email',   icon:'✉',  label:'Email Phishing',  desc:'SendGrid real emails' },
              { key:'sms',     icon:'📱',  label:'SMS Smishing',    desc:'Twilio (stubbed in demo)' },
              { key:'vishing', icon:'📞',  label:'Voice Vishing',   desc:'Script generator + log' },
            ].map(ch => (
              <label key={ch.key} style={{
                display:'flex', alignItems:'center', gap:'10px', cursor:'pointer',
                background: channels[ch.key] ? 'rgba(255,71,87,0.08)' : 'var(--bg-base)',
                border: `1px solid ${channels[ch.key] ? 'rgba(255,71,87,0.3)' : 'var(--border)'}`,
                borderRadius:'var(--r-md)', padding:'10px 14px', transition:'all 0.15s',
              }}>
                <input type="checkbox" checked={channels[ch.key]} onChange={() => toggleChannel(ch.key)}
                  style={{accentColor:'var(--danger)'}}/>
                <div style={{fontSize:'1.1rem'}}>{ch.icon}</div>
                <div>
                  <div style={{fontWeight:600, fontSize:'0.82rem'}}>{ch.label}</div>
                  <div style={{fontSize:'0.7rem', color:'var(--text-3)'}}>{ch.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Config */}
        <div style={{display:'flex', flexDirection:'column', gap:'14px'}}>
          <div>
            <div style={{fontSize:'0.78rem', color:'var(--text-2)', fontWeight:600, marginBottom:'6px'}}>TARGET COUNT</div>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <input type="range" min="5" max="200" value={targetCount}
                onChange={e => setTargetCount(parseInt(e.target.value))}
                style={{flex:1, accentColor:'var(--danger)'}}/>
              <span style={{fontFamily:'var(--mono)', fontWeight:800, color:'var(--danger)', minWidth:'36px'}}>{targetCount}</span>
            </div>
          </div>

          <button onClick={launchRedTeam} disabled={launching} style={{
            background: launching ? 'rgba(255,71,87,0.2)' : 'linear-gradient(135deg,#FF4757,#FF6B35)',
            border:'none', borderRadius:'var(--r-md)', padding:'12px', color:'#fff',
            fontWeight:800, fontSize:'0.9rem', cursor: launching ? 'not-allowed' : 'pointer',
            transition:'all 0.2s', width:'100%',
          }}>
            {launching ? '⏳ Running Simulation…' : '🚀 Launch Red Team Sim'}
          </button>

          {/* Results */}
          {results && (
            <div style={{background:'var(--bg-base)', borderRadius:'var(--r-md)', padding:'12px'}}>
              <div style={{fontWeight:700, fontSize:'0.78rem', marginBottom:'8px', color:'var(--text-2)'}}>RESULTS</div>
              {Object.entries(results.channels).map(([ch, r]) => (
                <div key={ch} style={{marginBottom:'8px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}>
                    <span style={{fontSize:'0.75rem'}}>{ch.toUpperCase()}</span>
                    <span style={{fontFamily:'var(--mono)', fontSize:'0.72rem', color: r.failRate>25 ? 'var(--danger)' : r.failRate>10 ? 'var(--warning)' : 'var(--safe)'}}>
                      {r.clicked}/{r.sent} clicked ({r.failRate}%)
                    </span>
                  </div>
                  <div style={{height:4, background:'var(--bg-card)', borderRadius:2}}>
                    <div style={{height:'100%', width:r.failRate+'%', background: r.failRate>25?'var(--danger)':r.failRate>10?'var(--warning)':'var(--safe)', borderRadius:2, transition:'width 0.5s'}}/>
                  </div>
                </div>
              ))}
              <div style={{borderTop:'1px solid var(--border)', paddingTop:'8px', marginTop:'8px', fontFamily:'var(--mono)', fontSize:'0.8rem', color: results.totalFail>20?'var(--danger)':'var(--warning)', fontWeight:800}}>
                Overall Fail Rate: {results.totalFail}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Log */}
      {simLog.length > 0 && (
        <div>
          <div style={{fontSize:'0.72rem', color:'var(--text-3)', fontWeight:700, marginBottom:'6px', letterSpacing:'0.05em'}}>SIMULATION LOG</div>
          <div style={{
            background:'#000', borderRadius:'var(--r-md)', padding:'12px',
            fontFamily:'var(--mono)', fontSize:'0.72rem', color:'#2ED573',
            maxHeight:'160px', overflowY:'auto', lineHeight:1.7,
          }}>
            {simLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
