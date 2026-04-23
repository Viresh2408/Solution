// TrustNet AI — Firestore Seed Script
// Run once to populate your Firestore database with initial data.
// Import this component temporarily, visit the dashboard, click "Seed DB",
// then remove the import from App.jsx.

import { useState } from 'react';
import { db, ORG_ID } from '../firebase';
import {
  doc, setDoc, addDoc, collection, serverTimestamp, Timestamp
} from 'firebase/firestore';

export default function SeedButton() {
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);

  async function seedAll() {
    setStatus('Seeding organization...');
    try {
      // 1. ORG OVERVIEW
      await setDoc(doc(db, 'organizations', ORG_ID), {
        name: 'Apex Financial Services',
        industry: 'BFSI',
        plan: 'Enterprise',
        totalEmployees: 2148,
        riskScore: 73,
        activeAlerts: 7,
        threatsBlockedToday: 12,
        vulnerableUsers: 389,
        improvementRate: '+14%',
        complianceScore: 91,
        updatedAt: serverTimestamp(),
      });

      // 2. EMPLOYEES
      setStatus('Seeding employees...');
      const employees = [
        { name: 'M. Krishnaswamy', dept: 'Finance',      role: 'Accounts Payable',   riskScore: 89, incidentCount: 4, riskTrend: 'up',     topThreat: 'BEC' },
        { name: 'S. Rajagopalan',  dept: 'Executive Ofc', role: 'Executive Assistant', riskScore: 84, incidentCount: 3, riskTrend: 'up',     topThreat: 'CEO Fraud' },
        { name: 'P. Nair',         dept: 'HR',            role: 'HR Manager',          riskScore: 81, incidentCount: 5, riskTrend: 'stable', topThreat: 'Phishing' },
        { name: 'A. Chaudhary',    dept: 'Finance',       role: 'CFO Office',          riskScore: 79, incidentCount: 2, riskTrend: 'down',   topThreat: 'BEC' },
        { name: 'R. Verma',        dept: 'Legal',         role: 'Contract Manager',    riskScore: 74, incidentCount: 3, riskTrend: 'up',     topThreat: 'Vishing' },
        { name: 'K. Menon',        dept: 'Operations',    role: 'Procurement',         riskScore: 68, incidentCount: 2, riskTrend: 'stable', topThreat: 'Smishing' },
        { name: 'V. Sharma',       dept: 'Marketing',     role: 'Campaign Mgr',        riskScore: 55, incidentCount: 1, riskTrend: 'down',   topThreat: 'BEC' },
        { name: 'N. Patel',        dept: 'IT',            role: 'Sysadmin',            riskScore: 41, incidentCount: 1, riskTrend: 'down',   topThreat: 'Phishing' },
        { name: 'D. Iyer',         dept: 'Engineering',   role: 'Senior Dev',          riskScore: 34, incidentCount: 0, riskTrend: 'down',   topThreat: 'Phishing' },
        { name: 'L. Kapoor',       dept: 'Customer Svc',  role: 'Support Lead',        riskScore: 29, incidentCount: 1, riskTrend: 'down',   topThreat: 'Vishing' },
      ];
      for (const emp of employees) {
        await addDoc(collection(db, `organizations/${ORG_ID}/employees`), {
          ...emp,
          lastIncidentAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      // 3. ALERTS
      setStatus('Seeding alerts...');
      const alerts = [
        { type: 'BEC',      severity: 'critical', user: 'M. Krishnaswamy', dept: 'Finance',        detail: 'Spoofed CFO email requesting ₹24L wire transfer to new vendor',                    blocked: true,  riskScore: 91 },
        { type: 'Phishing', severity: 'critical', user: 'P. Nair',         dept: 'HR',             detail: 'Credential harvesting page disguised as corporate SSO portal',                    blocked: true,  riskScore: 88 },
        { type: 'Vishing',  severity: 'high',     user: 'S. Rajagopalan',  dept: 'Executive Ofc',  detail: 'Incoming call from spoofed IT helpdesk number requesting MFA bypass',             blocked: false, riskScore: 76 },
        { type: 'Smishing', severity: 'high',     user: 'R. Verma',        dept: 'Legal',          detail: 'SMS claiming to be IT requesting password reset via link',                        blocked: true,  riskScore: 71 },
        { type: 'Phishing', severity: 'medium',   user: 'K. Menon',        dept: 'Operations',     detail: 'Fake courier notification with malware-laced attachment',                         blocked: true,  riskScore: 60 },
        { type: 'BEC',      severity: 'high',     user: 'A. Chaudhary',    dept: 'Finance',        detail: 'Impersonation of CFO requesting urgent vendor payment approval',                  blocked: true,  riskScore: 79 },
        { type: 'Deepfake', severity: 'high',     user: 'S. Rajagopalan',  dept: 'Executive Ofc',  detail: 'Voice deepfake call mimicking CEO voice pattern (82% confidence)',                blocked: false, riskScore: 82 },
      ];
      for (let i = 0; i < alerts.length; i++) {
        await addDoc(collection(db, `organizations/${ORG_ID}/alerts`), {
          ...alerts[i],
          status: 'open',
          source: 'extension',
          attackTypes: [alerts[i].type.toUpperCase()],
          timestamp: Timestamp.fromDate(new Date(Date.now() - i * 3600000)),
        });
      }

      // 4. POLICIES
      setStatus('Seeding policies...');
      const policies = [
        { name: 'High-Risk User MFA Lock',      desc: 'Auto-enforce step-up MFA for users with risk score > 75',                             enabled: true,  triggeredCount: 34,  category: 'Access Control'    },
        { name: 'Wire Transfer Approval Hold',   desc: 'Pause all outbound payments > ₹5L for users flagged for BEC patterns',               enabled: true,  triggeredCount: 8,   category: 'Finance'           },
        { name: 'Mandatory Training Assignment', desc: 'Auto-enroll users who fail simulations in targeted remediation module',               enabled: true,  triggeredCount: 124, category: 'Training'          },
        { name: 'Email Attachment Quarantine',   desc: 'Quarantine all attachments from external senders to Finance team',                    enabled: false, triggeredCount: 0,   category: 'Email Security'    },
        { name: 'Executive Alert Escalation',    desc: 'Immediately notify CISO for any C-suite targeting event',                             enabled: true,  triggeredCount: 7,   category: 'Incident Response' },
        { name: 'Browser Navigation Block',      desc: 'Block navigation to phishing URLs detected by TrustNet extension',                   enabled: true,  triggeredCount: 247, category: 'Browser'           },
      ];
      for (const policy of policies) {
        await addDoc(collection(db, `organizations/${ORG_ID}/policies`), {
          ...policy,
          updatedAt: serverTimestamp(),
        });
      }

      // 5. SIMULATIONS
      setStatus('Seeding simulations...');
      const sims = [
        { name: 'Q1 Payroll Phishing', targets: 450,  clicked: 89,  reported: 178, failRate: 19.8, status: 'completed' },
        { name: 'Fake IT Reset',       targets: 320,  clicked: 124, reported: 89,  failRate: 38.8, status: 'completed' },
        { name: 'CEO Wire Transfer',   targets: 45,   clicked: 12,  reported: 22,  failRate: 26.7, status: 'completed' },
        { name: 'Tax Season Lure',     targets: 2148, clicked: 0,   reported: 0,   failRate: 0,    status: 'active'    },
      ];
      for (const sim of sims) {
        await addDoc(collection(db, `organizations/${ORG_ID}/simulations`), {
          ...sim,
          createdAt: serverTimestamp(),
        });
      }

      // 6. TRAINING MODULES
      setStatus('Seeding training modules...');
      const modules = [
        { title: 'Phishing Recognition Fundamentals', category: 'Phishing',         duration: '15 min', difficulty: 'Beginner',     enrolled: 1847, completed: 1234, avgScore: 84, icon: '🎣', color: '#FF4757' },
        { title: 'BEC & CEO Fraud Defense',           category: 'BEC',              duration: '22 min', difficulty: 'Intermediate', enrolled: 892,  completed: 541,  avgScore: 79, icon: '💼', color: '#7C3AED' },
        { title: 'Vishing & Call Scam Awareness',     category: 'Vishing',          duration: '18 min', difficulty: 'Beginner',     enrolled: 2148, completed: 1834, avgScore: 91, icon: '📞', color: '#FFA502' },
        { title: 'Cognitive Bias in Security',        category: 'Psychology',       duration: '30 min', difficulty: 'Advanced',     enrolled: 445,  completed: 178,  avgScore: 72, icon: '🧠', color: '#00D9FF' },
        { title: 'OTP & MFA Best Practices',          category: 'Authentication',   duration: '12 min', difficulty: 'Beginner',     enrolled: 2148, completed: 2089, avgScore: 96, icon: '🔐', color: '#2ED573' },
        { title: 'Deepfake & AI-Driven Attacks',      category: 'Emerging Threats', duration: '25 min', difficulty: 'Advanced',     enrolled: 312,  completed: 89,   avgScore: 68, icon: '🤖', color: '#FF6B35' },
      ];
      for (const mod of modules) {
        await addDoc(collection(db, `organizations/${ORG_ID}/trainingModules`), {
          ...mod,
          updatedAt: serverTimestamp(),
        });
      }

      // 7. DAILY STATS (last 30 days)
      setStatus('Seeding 30-day stats...');
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        await setDoc(doc(db, `organizations/${ORG_ID}/dailyStats`, dateStr), {
          date: dateStr,
          day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          orgRisk:     Math.round(80 - i * 0.3 + (Math.random() - 0.5) * 8),
          industryAvg: Math.round(72 + (Math.random() - 0.5) * 5),
          incidents:   Math.round(Math.max(0, 8 - i * 0.15 + (Math.random() - 0.5) * 4)),
          phishing:    Math.round(40 + (Math.random() - 0.5) * 20),
          bec:         Math.round(20 + (Math.random() - 0.5) * 10),
          vishing:     Math.round(18 + (Math.random() - 0.5) * 8),
          smishing:    Math.round(12 + (Math.random() - 0.5) * 6),
          threatsBlocked: Math.round(8 + Math.random() * 10),
        });
      }

      setStatus('✅ Done! All data seeded to Firestore.');
      setDone(true);
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
      console.error(err);
    }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#0D1117', border: '1px solid rgba(0,217,255,0.3)',
      borderRadius: 12, padding: '16px 20px', minWidth: 280,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#00D9FF' }}>
        🗄️ Firestore Seeder
      </div>
      {status && (
        <div style={{ fontSize: 13, color: '#9BA3B2', marginBottom: 12, lineHeight: 1.5 }}>
          {status}
        </div>
      )}
      {!done ? (
        <button
          onClick={seedAll}
          style={{
            background: 'linear-gradient(135deg,#7C3AED,#00D9FF)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', cursor: 'pointer', fontWeight: 700,
            width: '100%', fontSize: 14,
          }}
        >
          🚀 Seed Firestore DB
        </button>
      ) : (
        <div style={{ color: '#2ED573', fontWeight: 700 }}>
          Remove &lt;SeedButton /&gt; from App.jsx now!
        </div>
      )}
    </div>
  );
}
