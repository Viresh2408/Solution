import { useEffect, useRef, useState } from 'react';
import { globalThreats } from '../data/mockData';

// We'll render the Leaflet map via direct DOM manipulation to avoid SSR issues
export default function RiskMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [liveCount, setLiveCount] = useState(847);

  const attackTypes = ['All', 'Phishing', 'BEC', 'Vishing', 'Smishing', 'APT', 'Multiple'];

  useEffect(() => {
    // Dynamically import leaflet to avoid SSR issues
    if (mapInstanceRef.current) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (!mapRef.current) return;

      const L = window.L;
      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 8,
      }).addTo(map);

      // Add threat markers
      globalThreats.forEach(threat => {
        const radius = Math.max(15, threat.intensity * 0.4);
        const color = threat.intensity >= 85 ? '#FF4757'
          : threat.intensity >= 70 ? '#FFA502'
          : threat.intensity >= 55 ? '#FFD166'
          : '#00D9FF';

        // Pulse circle
        const pulse = L.circleMarker([threat.lat, threat.lon], {
          radius: radius * 1.5,
          fillColor: color,
          fillOpacity: 0.08,
          color: color,
          weight: 0.5,
          opacity: 0.3,
        }).addTo(map);

        // Core circle
        const marker = L.circleMarker([threat.lat, threat.lon], {
          radius,
          fillColor: color,
          fillOpacity: 0.7,
          color: '#fff',
          weight: 1,
          opacity: 0.5,
        }).addTo(map);

        marker.bindPopup(`
          <div style="background:#0D1117;color:#E8EAF0;font-family:Inter,sans-serif;padding:8px;min-width:160px;border-radius:8px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">${threat.country}</div>
            <div style="font-size:11px;color:#9BA3B2">Attack Type: <strong style="color:${color}">${threat.type}</strong></div>
            <div style="font-size:11px;color:#9BA3B2">Intensity: <strong style="color:${color}">${threat.intensity}/100</strong></div>
            <div style="font-size:11px;color:#9BA3B2">Incidents: <strong>${threat.count.toLocaleString()}</strong></div>
          </div>
        `, {
          className: 'trustnet-popup',
          closeButton: false,
        });

        marker.on('click', () => setSelected(threat));
      });

      mapInstanceRef.current = map;
    };
    document.body.appendChild(script);

    // Simulate live counter
    const interval = setInterval(() => {
      setLiveCount(c => c + Math.floor(Math.random() * 3));
    }, 3000);

    return () => {
      clearInterval(interval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const filtered = filter === 'All' ? globalThreats : globalThreats.filter(t => t.type === filter || t.type === 'Multiple');
  const sorted = [...filtered].sort((a, b) => b.intensity - a.intensity);

  return (
    <div className="page">
      {/* Controls */}
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap'}}>
        {/* Live indicator */}
        <div style={{display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:'100px', padding:'5px 14px', fontSize:'0.78rem'}}>
          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--danger)', animation:'pulse 1s infinite'}}></div>
          <span style={{color:'var(--danger)', fontWeight:700}}>LIVE</span>
          <span style={{color:'var(--text-2)'}}>{liveCount.toLocaleString()} events today</span>
        </div>

        {/* Filter buttons */}
        <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
          {attackTypes.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`}>
              {t}
            </button>
          ))}
        </div>

        <div style={{marginLeft:'auto', fontSize:'0.78rem', color:'var(--text-2)'}}>
          Showing {filtered.length} countries
        </div>
      </div>

      {/* Map */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:'16px'}}>
        <div ref={mapRef} style={{height:'440px', width:'100%'}}></div>
      </div>

      <div className="grid-2">
        {/* Top Threat Countries Table */}
        <div className="card">
          <div className="section-header mb-4">
            <div className="section-title">Top Threat Origins</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Country</th>
                <th>Type</th>
                <th>Intensity</th>
                <th>Incidents</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 8).map((t, i) => {
                const color = t.intensity >= 85 ? 'var(--danger)' : t.intensity >= 70 ? 'var(--warning)' : 'var(--cyan)';
                return (
                  <tr key={t.country} onClick={() => setSelected(t)} style={{cursor:'pointer'}}>
                    <td style={{color:'var(--text-3)', fontFamily:'var(--mono)'}}>{i + 1}</td>
                    <td style={{fontWeight:600, color:'var(--text)'}}>{t.country}</td>
                    <td><span className="badge danger">{t.type}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{width:'50px'}}>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{width:`${t.intensity}%`, background:color}}></div>
                          </div>
                        </div>
                        <span style={{fontFamily:'var(--mono)', fontSize:'0.72rem', color}}>{t.intensity}</span>
                      </div>
                    </td>
                    <td style={{fontFamily:'var(--mono)'}}>{t.count.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Country Detail / Global Stats */}
        <div className="card">
          {selected ? (
            <>
              <div className="section-header mb-4">
                <div className="section-title">🌍 {selected.country}</div>
                <button onClick={() => setSelected(null)} style={{background:'none',border:'none',color:'var(--text-2)',cursor:'pointer',fontSize:'18px'}}>×</button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px'}}>
                {[
                  { label:'Threat Intensity', val:selected.intensity + '/100', color: selected.intensity >= 75 ? 'var(--danger)' : 'var(--warning)' },
                  { label:'Primary Attack', val:selected.type, color:'var(--danger)' },
                  { label:'Confirmed Incidents', val:selected.count.toLocaleString(), color:'var(--warning)' },
                  { label:'FL Devices Active', val:Math.round(selected.count * 0.3).toLocaleString(), color:'var(--cyan)' },
                ].map(item => (
                  <div key={item.label} style={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'12px', textAlign:'center'}}>
                    <div style={{fontSize:'0.7rem', color:'var(--text-2)', marginBottom:'4px'}}>{item.label}</div>
                    <div style={{fontFamily:'var(--mono)', fontWeight:800, fontSize:'1rem', color:item.color}}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div style={{background:'var(--danger-dim)', border:'1px solid rgba(255,71,87,0.2)', borderRadius:'var(--r-md)', padding:'12px', fontSize:'0.82rem'}}>
                <div style={{fontWeight:700, color:'var(--danger)', marginBottom:'6px'}}>⚠ CERT Advisory</div>
                <div style={{color:'var(--text-2)', lineHeight:1.5}}>
                  Elevated {selected.type} activity originating from {selected.country}. 
                  Recommend enhanced monitoring for employees with communication to this region.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="section-title mb-4">Global Intelligence Summary</div>
              {[
                { label:'Countries Monitored', val:'190+', icon:'🌍', color:'var(--cyan)' },
                { label:'Total Attack Events (Today)', val:liveCount.toLocaleString(), icon:'📡', color:'var(--danger)' },
                { label:'FL Devices Contributing', val:'10.2M', icon:'📱', color:'var(--cyan)' },
                { label:'Emerging Threat Patterns', val:'7 new today', icon:'🔍', color:'var(--warning)' },
                { label:'Global Model Version', val:'v1.0 (Updated 2h ago)', icon:'🧠', color:'var(--safe)' },
                { label:'Privacy Budget Remaining', val:'ε = 0.42 / 0.50', icon:'🔐', color:'var(--safe)' },
              ].map(item => (
                <div key={item.label} style={{display:'flex', alignItems:'center', gap:'10px', padding:'9px 0', borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:'1rem'}}>{item.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.78rem', color:'var(--text-2)'}}>{item.label}</div>
                  </div>
                  <div style={{fontFamily:'var(--mono)', fontSize:'0.82rem', fontWeight:700, color:item.color}}>{item.val}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
