// TrustNet AI — Real-time Firestore Data Hooks
// Replaces all mockData.js imports across the dashboard

import { useState, useEffect } from 'react';
import {
  collection, doc, onSnapshot, query,
  orderBy, limit, updateDoc, serverTimestamp,
  addDoc, getDocs, setDoc,
} from 'firebase/firestore';
import { db, ORG_ID } from '../firebase';

// ─────────────────────────────────────────────
// 1. ORG OVERVIEW (live — updates in real-time)
// ─────────────────────────────────────────────
export function useOrgOverview() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'organizations', ORG_ID), snap => {
      if (snap.exists()) {
        setOrg({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { org, loading };
}

// ─────────────────────────────────────────────
// 2. REAL-TIME ALERTS FEED
// ─────────────────────────────────────────────
export function useAlerts(limitCount = 50) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, `organizations/${ORG_ID}/alerts`),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const unsub = onSnapshot(q, snap => {
      setAlerts(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        // Convert Firestore timestamp to relative time string
        time: d.data().timestamp
          ? getRelativeTime(d.data().timestamp.toDate?.() || new Date(d.data().timestamp))
          : 'just now',
      })));
      setLoading(false);
    });
    return unsub;
  }, [limitCount]);

  return { alerts, loading };
}

// Resolve an alert (write back to Firestore)
export async function resolveAlert(alertId, userEmail = 'admin') {
  await updateDoc(doc(db, `organizations/${ORG_ID}/alerts`, alertId), {
    resolvedBy: userEmail,
    resolvedAt: serverTimestamp(),
    status: 'resolved',
  });
}

// ─────────────────────────────────────────────
// 3. EMPLOYEES (real-time, sorted by risk score)
// ─────────────────────────────────────────────
export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, `organizations/${ORG_ID}/employees`),
      orderBy('riskScore', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
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
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, `organizations/${ORG_ID}/dailyStats`),
      orderBy('date', 'desc'),
      limit(days)
    );
    const unsub = onSnapshot(q, snap => {
      // Reverse so oldest → newest for charts
      setStats(snap.docs.map(d => d.data()).reverse());
      setLoading(false);
    });
    return unsub;
  }, [days]);

  return { stats, loading };
}

// ─────────────────────────────────────────────
// 6. POLICY RULES (real-time, writeable)
// ─────────────────────────────────────────────
export function usePolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, `organizations/${ORG_ID}/policies`),
      snap => {
        setPolicies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { policies, loading };
}

export async function togglePolicy(policyId, currentEnabled) {
  await updateDoc(doc(db, `organizations/${ORG_ID}/policies`, policyId), {
    enabled: !currentEnabled,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// 7. PHISHING SIMULATIONS
// ─────────────────────────────────────────────
export function useSimulations() {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, `organizations/${ORG_ID}/simulations`),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setSimulations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { simulations, loading };
}

export async function createSimulation(name, targets) {
  await addDoc(collection(db, `organizations/${ORG_ID}/simulations`), {
    name,
    targets,
    clicked: 0,
    reported: 0,
    failRate: 0,
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// 8. TRAINING MODULES
// ─────────────────────────────────────────────
export function useTrainingModules() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, `organizations/${ORG_ID}/trainingModules`),
      snap => {
        setModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { modules, loading };
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
