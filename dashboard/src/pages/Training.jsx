import { useTrainingModules, useEmployees } from '../hooks/useTrustNetData';

export default function Training() {
  const { modules: trainingModules } = useTrainingModules();
  const { employees: employeeRisk } = useEmployees();
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
            <button className="btn btn-primary btn-sm">+ New Module</button>
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
                        <div className="progress-fill" style={{width:`${Math.round(module.completed/module.enrolled*100)}%`, background:module.color}}></div>
                      </div>
                    </div>
                    <div className="module-pct">{Math.round(module.completed/module.enrolled*100)}%</div>
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

      {/* Leaderboard */}
      <div className="card">
        <div className="section-header mb-4">
          <div className="section-title">Department Training Leaderboard</div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px'}}>
          {[
            {rank:1, dept:'Engineering', score:94, completed:'267/267', emoji:'🥇'},
            {rank:2, dept:'Customer Svc', score:91, completed:'412/445', emoji:'🥈'},
            {rank:3, dept:'IT', score:88, completed:'121/134', emoji:'🥉'},
            {rank:4, dept:'Operations', score:81, completed:'256/312', emoji:'4️⃣'},
            {rank:5, dept:'Marketing', score:75, completed:'134/178', emoji:'5️⃣'},
            {rank:6, dept:'Finance', score:'61', completed:'88/145', emoji:'6️⃣'},
          ].map(d => (
            <div key={d.rank} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px', display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontSize:'1.3rem'}}>{d.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600, fontSize:'0.85rem'}}>{d.dept}</div>
                <div style={{fontSize:'0.72rem', color:'var(--text-2)'}}>{d.completed} completed</div>
              </div>
              <div style={{fontFamily:'var(--mono)', fontWeight:800, fontSize:'1rem', color: parseInt(d.score) >= 80 ? 'var(--safe)' : 'var(--warning)'}}>{d.score}%</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
