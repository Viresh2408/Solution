// TrustNet AI — Mock Data (Realistic Simulation)
// Represents aggregated, privacy-preserving behavioral intelligence

// ---- ORG OVERVIEW ----
export const orgOverview = {
  name: 'Apex Financial Services',
  industry: 'BFSI',
  plan: 'Enterprise',
  totalEmployees: 2148,
  riskScore: 73,
  activeAlerts: 247,
  threatsBlockedToday: 12,
  vulnerableUsers: 389,
  improvementRate: '+14%',
  complianceScore: 91,
};

// ---- 30-DAY VULNERABILITY TREND ----
const days = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

export const vulnerabilityTrend = days.map((day, i) => ({
  day,
  orgRisk: Math.round(80 - i * 0.3 + (Math.random() - 0.5) * 8),
  industryAvg: Math.round(72 + (Math.random() - 0.5) * 5),
  incidents: Math.round(Math.max(0, 8 - i * 0.15 + (Math.random() - 0.5) * 4)),
}));

// ---- DEPARTMENT HEATMAP ----
export const departments = [
  { name: 'Finance', riskScore: 82, employees: 145, topThreat: 'BEC', color: '#FF4757' },
  { name: 'Executive Ofc', riskScore: 78, employees: 23, topThreat: 'CEO Fraud', color: '#FF4757' },
  { name: 'HR', riskScore: 75, employees: 89, topThreat: 'Phishing', color: '#ff6b57' },
  { name: 'Legal', riskScore: 68, employees: 57, topThreat: 'Vishing', color: '#FFA502' },
  { name: 'Operations', riskScore: 62, employees: 312, topThreat: 'Smishing', color: '#FFA502' },
  { name: 'IT', riskScore: 51, employees: 134, topThreat: 'Supply Chain', color: '#FFD166' },
  { name: 'Marketing', riskScore: 48, employees: 178, topThreat: 'BEC', color: '#FFD166' },
  { name: 'Engineering', riskScore: 34, employees: 267, topThreat: 'Phishing', color: '#2ED573' },
  { name: 'Customer Svc', riskScore: 29, employees: 445, topThreat: 'Vishing', color: '#2ED573' },
];

// ---- ATTACK TYPE DISTRIBUTION ----
export const attackDistribution = [
  { name: 'Spear Phishing', value: 31, color: '#FF4757' },
  { name: 'BEC / CEO Fraud', value: 22, color: '#7C3AED' },
  { name: 'Vishing', value: 18, color: '#FFA502' },
  { name: 'Smishing', value: 14, color: '#00D9FF' },
  { name: 'Credential Harvest', value: 9, color: '#2ED573' },
  { name: 'Other', value: 6, color: '#4A5568' },
];

// ---- EMPLOYEE RISK TABLE ----
export const employeeRisk = [
  { id: 'EMP-0291', name: 'M. Krishnaswamy', dept: 'Finance', role: 'Accounts Payable', score: 89, incidents: 4, lastIncident: '2h ago', trend: 'up' },
  { id: 'EMP-0045', name: 'S. Rajagopalan', dept: 'Executive Ofc', role: 'Executive Assistant', score: 84, incidents: 3, lastIncident: '1d ago', trend: 'up' },
  { id: 'EMP-0178', name: 'P. Nair', dept: 'HR', role: 'HR Manager', score: 81, incidents: 5, lastIncident: '4h ago', trend: 'stable' },
  { id: 'EMP-0667', name: 'A. Chaudhary', dept: 'Finance', role: 'CFO Office', score: 79, incidents: 2, lastIncident: '3d ago', trend: 'down' },
  { id: 'EMP-0334', name: 'R. Verma', dept: 'Legal', role: 'Contract Manager', score: 74, incidents: 3, lastIncident: '1d ago', trend: 'up' },
  { id: 'EMP-0512', name: 'K. Menon', dept: 'Operations', role: 'Procurement', score: 68, incidents: 2, lastIncident: '2d ago', trend: 'stable' },
  { id: 'EMP-0089', name: 'V. Sharma', dept: 'Marketing', role: 'Campaign Mgr', score: 55, incidents: 1, lastIncident: '5d ago', trend: 'down' },
  { id: 'EMP-0423', name: 'N. Patel', dept: 'IT', role: 'Sysadmin', score: 41, incidents: 1, lastIncident: '7d ago', trend: 'down' },
];

// ---- RECENT ALERTS ----
export const recentAlerts = [
  { id: 'ALT-4821', type: 'BEC', severity: 'critical', user: 'M. Krishnaswamy', detail: 'Spoofed CFO email requesting ₹24L wire transfer to new vendor', time: '2m ago', dept: 'Finance', blocked: true },
  { id: 'ALT-4820', type: 'Phishing', severity: 'critical', user: 'P. Nair', detail: 'Credential harvesting page disguised as corporate SSO portal', time: '18m ago', dept: 'HR', blocked: true },
  { id: 'ALT-4819', type: 'Vishing', severity: 'high', user: 'S. Rajagopalan', detail: 'Incoming call from spoofed IT helpdesk number requesting MFA bypass', time: '1h ago', dept: 'Executive Ofc', blocked: false },
  { id: 'ALT-4818', type: 'Smishing', severity: 'high', user: 'R. Verma', detail: 'SMS claiming to be IT requesting password reset via link', time: '2h ago', dept: 'Legal', blocked: true },
  { id: 'ALT-4817', type: 'Phishing', severity: 'medium', user: 'K. Menon', detail: 'Fake courier notification with malware-laced attachment', time: '4h ago', dept: 'Operations', blocked: true },
  { id: 'ALT-4816', type: 'BEC', severity: 'high', user: 'A. Chaudhary', detail: 'Impersonation of CFO requesting urgent vendor payment approval', time: '6h ago', dept: 'Finance', blocked: true },
  { id: 'ALT-4815', type: 'Deepfake', severity: 'high', user: 'S. Rajagopalan', detail: 'Voice deepfake call mimicking CEO voice pattern (82% confidence)', time: '8h ago', dept: 'Executive Ofc', blocked: false },
];

// ---- GLOBAL THREAT MAP DATA ----
export const globalThreats = [
  { country: 'Nigeria', lat: 9.0820, lon: 8.6753, intensity: 92, type: 'BEC', count: 4821 },
  { country: 'Romania', lat: 45.9432, lon: 24.9668, intensity: 88, type: 'Phishing', count: 3219 },
  { country: 'Russia', lat: 61.5240, lon: 105.3188, intensity: 85, type: 'Multiple', count: 8421 },
  { country: 'China', lat: 35.8617, lon: 104.1954, intensity: 82, type: 'APT', count: 6218 },
  { country: 'Brazil', lat: -14.2350, lon: -51.9253, intensity: 74, type: 'Smishing', count: 2841 },
  { country: 'India', lat: 20.5937, lon: 78.9629, intensity: 78, type: 'Vishing', count: 9821 },
  { country: 'Pakistan', lat: 30.3753, lon: 69.3451, intensity: 68, type: 'Phishing', count: 1843 },
  { country: 'USA', lat: 37.0902, lon: -95.7129, intensity: 65, type: 'BEC', count: 12483 },
  { country: 'UK', lat: 55.3781, lon: -3.4360, intensity: 58, type: 'Smishing', count: 3217 },
  { country: 'Germany', lat: 51.1657, lon: 10.4515, intensity: 45, type: 'Phishing', count: 2184 },
  { country: 'Indonesia', lat: -0.7893, lon: 113.9213, intensity: 71, type: 'Smishing', count: 4218 },
  { country: 'Vietnam', lat: 14.0583, lon: 108.2772, intensity: 66, type: 'Phishing', count: 2119 },
  { country: 'South Africa', lat: -30.5595, lon: 22.9375, intensity: 62, type: 'Vishing', count: 1824 },
  { country: 'Bangladesh', lat: 23.6850, lon: 90.3563, intensity: 61, type: 'Smishing', count: 1683 },
  { country: 'Mexico', lat: 23.6345, lon: -102.5528, intensity: 59, type: 'Phishing', count: 2341 },
];

// ---- PHISHING SIMULATION RESULTS ----
export const simulationHistory = [
  { id: 'SIM-008', name: 'Q1 Payroll Phishing', date: '2026-04-01', targets: 450, clicked: 89, reported: 178, failRate: 19.8, status: 'completed' },
  { id: 'SIM-007', name: 'Fake IT Reset', date: '2026-03-15', targets: 320, clicked: 124, reported: 89, failRate: 38.8, status: 'completed' },
  { id: 'SIM-006', name: 'CEO Wire Transfer', date: '2026-03-01', targets: 45, clicked: 12, reported: 22, failRate: 26.7, status: 'completed' },
  { id: 'SIM-009', name: 'Tax Season Lure', date: '2026-04-20', targets: 2148, clicked: 0, reported: 0, failRate: 0, status: 'active' },
];

// ---- TRAINING MODULES ----
export const trainingModules = [
  { id: 'TRN-01', title: 'Phishing Recognition Fundamentals', category: 'Phishing', duration: '15 min', difficulty: 'Beginner', enrolled: 1847, completed: 1234, avgScore: 84, icon: '🎣', color: '#FF4757' },
  { id: 'TRN-02', title: 'BEC & CEO Fraud Defense', category: 'BEC', duration: '22 min', difficulty: 'Intermediate', enrolled: 892, completed: 541, avgScore: 79, icon: '💼', color: '#7C3AED' },
  { id: 'TRN-03', title: 'Vishing & Call Scam Awareness', category: 'Vishing', duration: '18 min', difficulty: 'Beginner', enrolled: 2148, completed: 1834, avgScore: 91, icon: '📞', color: '#FFA502' },
  { id: 'TRN-04', title: 'Cognitive Bias in Security', category: 'Psychology', duration: '30 min', difficulty: 'Advanced', enrolled: 445, completed: 178, avgScore: 72, icon: '🧠', color: '#00D9FF' },
  { id: 'TRN-05', title: 'OTP & MFA Best Practices', category: 'Authentication', duration: '12 min', difficulty: 'Beginner', enrolled: 2148, completed: 2089, avgScore: 96, icon: '🔐', color: '#2ED573' },
  { id: 'TRN-06', title: 'Deepfake & AI-Driven Attacks', category: 'Emerging Threats', duration: '25 min', difficulty: 'Advanced', enrolled: 312, completed: 89, avgScore: 68, icon: '🤖', color: '#FF6B35' },
];

// ---- POLICY RULES ----
export const policyRules = [
  { id: 'POL-01', name: 'High-Risk User MFA Lock', desc: 'Auto-enforce step-up MFA for users with risk score > 75', enabled: true, triggeredCount: 34, category: 'Access Control' },
  { id: 'POL-02', name: 'Wire Transfer Approval Hold', desc: 'Pause all outbound payments > ₹5L for users flagged for BEC patterns', enabled: true, triggeredCount: 8, category: 'Finance' },
  { id: 'POL-03', name: 'Mandatory Training Assignment', desc: 'Auto-enroll users who fail simulations in targeted remediation module', enabled: true, triggeredCount: 124, category: 'Training' },
  { id: 'POL-04', name: 'Email Attachment Quarantine', desc: 'Quarantine all attachments from external senders to Finance team', enabled: false, triggeredCount: 0, category: 'Email Security' },
  { id: 'POL-05', name: 'Executive Alert Escalation', desc: 'Immediately notify CISO for any C-suite targeting event', enabled: true, triggeredCount: 7, category: 'Incident Response' },
  { id: 'POL-06', name: 'Browser Navigation Block', desc: 'Block navigation to phishing URLs detected by TrustNet extension', enabled: true, triggeredCount: 247, category: 'Browser' },
];

// ---- WEEKLY SCORES BY ATTACK TYPE ----
export const attackTrend7d = [
  { day: 'Mon', phishing: 45, bec: 22, vishing: 18, smishing: 12 },
  { day: 'Tue', phishing: 52, bec: 18, vishing: 24, smishing: 15 },
  { day: 'Wed', phishing: 38, bec: 31, vishing: 19, smishing: 11 },
  { day: 'Thu', phishing: 61, bec: 24, vishing: 21, smishing: 19 },
  { day: 'Fri', phishing: 49, bec: 27, vishing: 16, smishing: 22 },
  { day: 'Sat', phishing: 28, bec: 11, vishing: 9, smishing: 8 },
  { day: 'Sun', phishing: 31, bec: 8, vishing: 12, smishing: 7 },
];
