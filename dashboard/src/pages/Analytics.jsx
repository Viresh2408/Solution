import { useState } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useEmployees, useDepartments, useDailyStats } from '../hooks/useTrustNetData';


function getRiskColor(score) {
  if (score >= 75) return '#FF4757';
  if (score >= 60) return '#ff6b57';
  if (score >= 45) return '#FFA502';
  if (score >= 30) return '#FFD166';
  return '#2ED573';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#0D1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', fontSize:'12px'}}>
      <div style={{fontWeight:700, marginBottom:'6px', color:'#9BA3B2'}}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{color:p.color, display:'flex', gap:'8px'}}>
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

// Radar data for cognitive bias analysis
const radarData = [
  { bias: 'Authority', score: 78 },
  { bias: 'Urgency', score: 65 },
  { bias: 'Fear', score: 72 },
  { bias: 'Reciprocity', score: 41 },
  { bias: 'Social Proof', score: 55 },
  { bias: 'Familiarity', score: 48 },
];

export default function Analytics() {
  const { employees: employeeRisk } = useEmployees();
  const { departments } = useDepartments();
  const { stats: vulnerabilityTrend } = useDailyStats(30);
  const [selectedDept, setSelectedDept] = useState(null);
  const [sortField, setSortField] = useState('riskScore');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = [...employeeRisk].sort((a, b) =>
    sortDir === 'desc' ? b[sortField] - a[sortField] : a[sortField] - b[sortField]
  );

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };


  return (
    <div className="page">

      {/* Department Heatmap */}
      <div className="card mb-4">
        <div className="section-header mb-4">
          <div>
            <div className="section-title">Department Vulnerability Heatmap</div>
            <div className="section-subtitle">Click a department to drill down</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.75rem', color:'var(--text-2)'}}>
            <span style={{width:'40px',height:'6px',background:'linear-gradient(90deg,#2ED573,#FFA502,#FF4757)', borderRadius:'3px'}}></span>
            Low → High Risk
          </div>
        </div>
        <div className="dept-grid">
          {departments.map(dept => (
            <div
              key={dept.name}
              className="dept-cell"
              onClick={() => setSelectedDept(selectedDept?.name === dept.name ? null : dept)}
              style={{
                background: `${dept.color}18`,
                border: `1px solid ${dept.color}40`,
                outline: selectedDept?.name === dept.name ? `2px solid ${dept.color}` : 'none',
              }}
            >
              <div className="dept-name">{dept.name}</div>
              <div className="dept-score" style={{color: dept.color}}>{dept.riskScore}</div>
              <div className="dept-count">{dept.employees} employees</div>
              <div style={{marginTop:'4px'}}>
                <span className="badge danger" style={{fontSize:'0.65rem', padding:'1px 4px'}}>
                  {dept.topThreat}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedDept && (
          <div style={{marginTop:'16px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'14px 16px', borderLeft:`3px solid ${selectedDept.color}`}}>
            <div style={{fontWeight:700, marginBottom:'8px'}}>{selectedDept.name} Department — Detailed Analysis</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', fontSize:'0.82rem'}}>
              <div>
                <div style={{color:'var(--text-2)', fontSize:'0.72rem'}}>Risk Score</div>
                <div style={{fontFamily:'var(--mono)', color:selectedDept.color, fontWeight:800, fontSize:'1.2rem'}}>{selectedDept.riskScore}</div>
              </div>
              <div>
                <div style={{color:'var(--text-2)', fontSize:'0.72rem'}}>Employees</div>
                <div style={{fontFamily:'var(--mono)', fontWeight:700, fontSize:'1rem'}}>{selectedDept.employees}</div>
              </div>
              <div>
                <div style={{color:'var(--text-2)', fontSize:'0.72rem'}}>Top Attack Type</div>
                <div style={{fontWeight:700, color:'var(--danger)'}}>{selectedDept.topThreat}</div>
              </div>
              <div>
                <div style={{color:'var(--text-2)', fontSize:'0.72rem'}}>Action Required</div>
                <div style={{fontWeight:700}}>{selectedDept.riskScore > 70 ? '🔴 Immediate' : '🟡 Scheduled'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid-2 mb-4">
        {/* Trend 90d */}
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">90-Day Risk Trend</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={vulnerabilityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="day" tick={{fill:'#4A5568', fontSize:10}} axisLine={false} tickLine={false} interval={6}/>
              <YAxis tick={{fill:'#4A5568', fontSize:10}} axisLine={false} tickLine={false} domain={[40,100]}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              <Line type="monotone" dataKey="orgRisk" name="Org Risk" stroke="#FF4757" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="industryAvg" name="Industry" stroke="#00D9FF" strokeWidth={1.5} dot={false} strokeDasharray="4 4"/>
              <Line type="monotone" dataKey="incidents" name="Incidents" stroke="#FFA502" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cognitive Bias Radar */}
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">Cognitive Bias Vulnerability Profile</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)"/>
              <PolarAngleAxis dataKey="bias" tick={{fill:'#9BA3B2', fontSize:11}}/>
              <Radar name="Org Score" dataKey="score" stroke="#FF4757" fill="#FF4757" fillOpacity={0.15}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Risk Table */}
      <div className="card">
        <div className="section-header mb-4">
          <div>
            <div className="section-title">Individual Vulnerability Profiles</div>
            <div className="section-subtitle">Top at-risk employees — click column headers to sort</div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm">Export CSV</button>
            <button className="btn btn-primary btn-sm">Assign Training</button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Role</th>
              <th onClick={() => handleSort('score')} style={{cursor:'pointer'}}>
                Risk Score {sortField === 'riskScore' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th onClick={() => handleSort('incidents')} style={{cursor:'pointer'}}>
                Incidents {sortField === 'incidentCount' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
              </th>
              <th>Last Incident</th>
              <th>Trend</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div style={{fontWeight:600, color:'var(--text)'}}>{emp.name}</div>
                  <div style={{fontSize:'0.7rem', color:'var(--text-3)', fontFamily:'var(--mono)'}}>{emp.id}</div>
                </td>
                <td>{emp.dept}</td>
                <td>{emp.role}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span style={{fontFamily:'var(--mono)', fontWeight:700, color:getRiskColor(emp.riskScore)}}>{emp.riskScore}</span>
                    <div style={{width:'50px'}}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width:`${emp.riskScore}%`, background:getRiskColor(emp.riskScore)}}></div>
                      </div>
                    </div>
                  </div>
                </td>
                <td><span style={{fontFamily:'var(--mono)', fontWeight:600}}>{emp.incidentCount}</span></td>
                <td><span style={{color:'var(--text-2)'}}>{emp.lastIncidentAt ? new Date(emp.lastIncidentAt?.toDate?.() || emp.lastIncidentAt).toLocaleDateString() : '—'}</span></td>
                <td>
                  <span className={`badge ${emp.trend === 'up' ? 'danger' : emp.trend === 'down' ? 'safe' : 'cyan'}`}>
                    {emp.riskTrend === 'up' ? '↑ Rising' : emp.riskTrend === 'down' ? '↓ Improving' : '→ Stable'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm">Train</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
