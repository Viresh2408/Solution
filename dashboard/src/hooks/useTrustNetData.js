import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

const DEFAULT_ORG = 'apex-financial';

// ─────────────────────────────────────────────
// 1. ORG OVERVIEW (live — updates in real-time)
// ─────────────────────────────────────────────
export function useOrgOverview() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      setOrg(data);
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel(`org-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations', filter: `id=eq.${orgId}` }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { org, loading };
}

// ─────────────────────────────────────────────
// 2. REAL-TIME ALERTS FEED
// ─────────────────────────────────────────────
export function useAlerts(limitCount = 50) {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('orgId', orgId)
        .order('timestamp', { ascending: false })
        .limit(limitCount);
      
      setAlerts((data || []).map(d => ({
        ...d,
        time: d.timestamp ? getRelativeTime(new Date(d.timestamp)) : 'just now'
      })));
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel(`alerts-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `orgId=eq.${orgId}` }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limitCount]);

  return { alerts, loading };
}

// Resolve an alert (write back to Supabase)
export async function resolveAlert(alertId, userEmail = 'admin') {
  await supabase
    .from('alerts')
    .update({
      resolvedBy: userEmail,
      resolvedAt: new Date().toISOString(),
      status: 'resolved',
    })
    .eq('id', alertId);
}

// ─────────────────────────────────────────────
// 3. EMPLOYEES (real-time, sorted by risk score)
// ─────────────────────────────────────────────
export function useEmployees() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('orgId', orgId)
        .order('riskScore', { ascending: false });
      setEmployees(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel(`employees-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees', filter: `orgId=eq.${orgId}` }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { employees, loading };
}

// ─────────────────────────────────────────────
// 4. DEPARTMENT HEATMAP (derived from employees)
// ─────────────────────────────────────────────
export function useDepartments() {
  const { employees, loading } = useEmployees();

  const departments = Object.values(
    employees.reduce((acc, emp) => {
      if (!acc[emp.dept]) {
        acc[emp.dept] = { name: emp.dept, employees: 0, totalRisk: 0, threats: {} };
      }
      acc[emp.dept].employees += 1;
      acc[emp.dept].totalRisk += (emp.riskScore || 0);
      if (emp.topThreat) {
        acc[emp.dept].threats[emp.topThreat] = (acc[emp.dept].threats[emp.topThreat] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(dept => {
    const riskScore = Math.round(dept.totalRisk / dept.employees);
    const topThreat = Object.entries(dept.threats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Phishing';
    const color = riskScore >= 75 ? '#FF4757' : riskScore >= 60 ? '#ff6b57' : riskScore >= 45 ? '#FFA502' : riskScore >= 30 ? '#FFD166' : '#2ED573';
    return { name: dept.name, riskScore, employees: dept.employees, topThreat, color };
  }).sort((a, b) => b.riskScore - a.riskScore);

  return { departments, loading };
}

// ─────────────────────────────────────────────
// 5. DAILY STATS (time-series for charts)
// ─────────────────────────────────────────────
export function useDailyStats(days = 30) {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('dailyStats')
        .select('*')
        .eq('orgId', orgId)
        .order('date', { ascending: false })
        .limit(days);
      setStats((data || []).reverse()); // Reverse so oldest → newest for charts
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel(`stats-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dailyStats', filter: `orgId=eq.${orgId}` }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [days]);

  return { stats, loading };
}

// ─────────────────────────────────────────────
// 6. POLICY RULES (real-time, writeable)
// ─────────────────────────────────────────────
export function usePolicies() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('policies').select('*').eq('orgId', orgId);
      setPolicies(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel('policies-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'policies', filter: `orgId=eq.${orgId}` }, fetch)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { policies, loading };
}

export async function togglePolicy(policyId, currentEnabled) {
  await supabase
    .from('policies')
    .update({
      enabled: !currentEnabled,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', policyId);
}

// ─────────────────────────────────────────────
// 7. PHISHING SIMULATIONS
// ─────────────────────────────────────────────
export function useSimulations() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('simulations')
        .select('*')
        .eq('orgId', orgId)
        .order('createdAt', { ascending: false });
      setSimulations(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel('simulations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'simulations', filter: `orgId=eq.${orgId}` }, fetch)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return { simulations, loading };
}

export async function createSimulation(name, targets, overrideOrgId = null) {
  const orgId = overrideOrgId || DEFAULT_ORG;
  await supabase.from('simulations').insert({
    orgId: orgId,
    name,
    targets,
    clicked: 0,
    reported: 0,
    failRate: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────
// 8. TRAINING MODULES
// ─────────────────────────────────────────────
export function useTrainingModules() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('trainingModules').select('*').eq('orgId', orgId);
      setModules(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel('modules-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trainingModules', filter: `orgId=eq.${orgId}` }, fetch)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [orgId]);

  return { modules, loading };
}

export async function createTrainingModule(moduleData) {
  const { data, error } = await supabase.from('trainingModules').insert({
    ...moduleData,
    orgId: DEFAULT_ORG, // In prod, get from context
    enrolled: 0,
    completed: 0,
    avgScore: 0,
  });
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// 9. ATTACK DISTRIBUTION (derived from alerts)
// ─────────────────────────────────────────────
export function useAttackDistribution() {
  const { alerts } = useAlerts(200);

  const dist = Object.entries(
    alerts.reduce((acc, a) => {
      const type = a.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({
    name,
    value: Math.round((count / Math.max(alerts.length, 1)) * 100),
    color: TYPE_COLORS[name] || '#4A5568',
  })).sort((a, b) => b.value - a.value);

  return dist;
}

const TYPE_COLORS = {
  'Phishing':    '#FF4757',
  'BEC':         '#7C3AED',
  'Vishing':     '#FFA502',
  'Smishing':    '#00D9FF',
  'Deepfake':    '#FF6B35',
  'Credential':  '#2ED573',
  'Other':       '#4A5568',
};

// ─────────────────────────────────────────────
// 10. GLOBAL THREATS (real-time for RiskMap)
// ─────────────────────────────────────────────
export function useGlobalThreats() {
  const { profile } = useAuth();
  const orgId = profile?.orgId || DEFAULT_ORG;
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('globalThreats').select('*').eq('orgId', orgId);
      setThreats(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel('threats-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'globalThreats', filter: `orgId=eq.${orgId}` }, fetch)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [orgId]);

  return { threats, loading };
}

// ─────────────────────────────────────────────
// UTILITY — Relative time string
// ─────────────────────────────────────────────
function getRelativeTime(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * SEED DATABASE WITH DEMO DATA
 */
export const seedDatabase = async (overrideOrgId = null) => {
  const orgId = overrideOrgId || DEFAULT_ORG;
  console.log(`[TrustNet] Seeding database for ${orgId}...`);

  // 1. Seed Organization
  await supabase.from('organizations').upsert({
    id: orgId,
    name: orgId === DEFAULT_ORG ? 'Apex Financial Services' : `${orgId.toUpperCase()} Corp`,
    riskScore: 68,
    activeAlerts: 42,
    threatsBlockedToday: 128,
    totalEmployees: 2148,
    improvementRate: '12%',
    vulnerableUsers: 84,
    complianceScore: 92,
  });

  // 2. Seed Employees
  const { data: existingEmps } = await supabase.from('employees').select('id').limit(1);
  if (!existingEmps?.length) {
    const emps = [
      { name: 'Aditi Rao', dept: 'Finance', riskScore: 82, role: 'Accounts Manager', orgId: orgId },
      { name: 'Rahul Mehta', dept: 'Engineering', riskScore: 45, role: 'Senior Developer', orgId: orgId },
      { name: 'Sneha Gupta', dept: 'HR', riskScore: 67, role: 'HR Lead', orgId: orgId },
      { name: 'Vikram Singh', dept: 'Finance', riskScore: 91, role: 'CFO', orgId: orgId },
      { name: 'Priya Sharma', dept: 'Marketing', riskScore: 32, role: 'Designer', orgId: orgId },
    ];
    await supabase.from('employees').insert(emps);
  }

  // 3. Seed Policies
  const { data: existingPolicies } = await supabase.from('policies').select('id').eq('orgId', orgId).limit(1);
  if (!existingPolicies?.length) {
    const rules = [
      { name: 'Deepfake Audio Detection', desc: 'Identify synthetic voice patterns in real-time communication', category: 'Incident Response', enabled: true, triggeredCount: 14, orgId: orgId },
      { name: 'Block High-Risk Geographies', desc: 'Deny access from high-risk regions (VPN required)', category: 'Access Control', enabled: true, triggeredCount: 842, orgId: orgId },
      { name: 'MFA on Large Wire Transfers', desc: 'Require biometric MFA for transfers > $10k', category: 'Finance', enabled: false, triggeredCount: 3, orgId: orgId },
      { name: 'Browser Extension Enforcement', desc: 'Ensure TrustNet extension is active for all browser sessions', category: 'Browser', enabled: true, triggeredCount: 0, orgId: orgId },
    ];
    await supabase.from('policies').insert(rules);
  }

  // 4. Seed Alerts
  const { data: existingAlerts } = await supabase.from('alerts').select('id').eq('orgId', orgId).limit(1);
  if (!existingAlerts?.length) {
    const alerts = [
      { type: 'Phishing', severity: 'critical', detail: 'Suspicious login attempt from unauthorized IP', user: 'Vikram Singh', dept: 'Finance', blocked: true, status: 'active', timestamp: new Date().toISOString(), orgId: orgId },
      { type: 'BEC', severity: 'high', detail: 'External email impersonating CEO detected', user: 'Aditi Rao', dept: 'Finance', blocked: false, status: 'active', timestamp: new Date().toISOString(), orgId: orgId },
      { type: 'Malware', severity: 'medium', detail: 'Untrusted browser extension detected', user: 'Rahul Mehta', dept: 'Engineering', blocked: true, status: 'active', timestamp: new Date().toISOString(), orgId: orgId },
    ];
    await supabase.from('alerts').insert(alerts);
  }

  // 5. Seed Training Modules
  const { data: existingModules } = await supabase.from('trainingModules').select('id').eq('orgId', orgId).limit(1);
  if (!existingModules?.length) {
    const modules = [
      { title: 'Phishing Recognition', category: 'Email Security', difficulty: 'Beginner', enrolled: 1248, completed: 982, avgScore: 84, icon: '📧', color: '#FFA502', duration: '15m', orgId: orgId },
      { title: 'Deepfake & Voice Phishing', category: 'AI Security', difficulty: 'Intermediate', enrolled: 842, completed: 421, avgScore: 76, icon: '🎭', color: '#FF4757', duration: '20m', orgId: orgId },
      { title: 'Social Engineering 101', category: 'Human Risk', difficulty: 'Beginner', enrolled: 2148, completed: 2100, avgScore: 92, icon: '🧠', color: '#2ED573', duration: '10m', orgId: orgId },
    ];
    await supabase.from('trainingModules').insert(modules);
  }

  console.log('[TrustNet] Seeding complete.');
};
