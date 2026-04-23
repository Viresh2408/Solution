// TrustNet AI — Phishing Simulation Client
// Calls the Firebase Cloud Function which securely proxies SendGrid
// Key never leaves the server — this file has NO sensitive credentials.

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db, ORG_ID } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const functions = getFunctions(app, 'us-central1');

export const SIMULATION_TEMPLATES = [
  {
    id: 'payroll',
    name: 'Payroll Verification Lure',
    icon: '💰',
    color: '#FFA502',
    description: 'Urgent payroll re-verification with deadline pressure',
    tactics: ['Urgency', 'Authority', 'Fear of financial loss'],
    difficulty: 'Beginner',
    avgFailRate: '~22%',
  },
  {
    id: 'itReset',
    name: 'IT Security Alert — Password Reset',
    icon: '🔒',
    color: '#FF4757',
    description: 'Fake IT security alert demanding immediate password reset',
    tactics: ['Fear', 'Authority impersonation', 'Urgency'],
    difficulty: 'Intermediate',
    avgFailRate: '~35%',
  },
  {
    id: 'ceoFraud',
    name: 'CEO Wire Transfer (BEC)',
    icon: '🎭',
    color: '#7C3AED',
    description: 'CEO impersonation requesting urgent confidential payment',
    tactics: ['Authority', 'Confidentiality', 'Time pressure'],
    difficulty: 'Advanced',
    avgFailRate: '~18%',
  },
];

/**
 * Launch a phishing simulation campaign
 * Creates a Firestore record, then calls the Cloud Function to send emails
 *
 * @param {Object} opts
 * @param {string} opts.templateId - 'payroll' | 'itReset' | 'ceoFraud'
 * @param {string} opts.name       - Campaign display name
 * @param {Array}  opts.targets    - [{ email, name, dept }] or count (uses mock targets if count)
 * @param {string} opts.fromEmail  - Verified SendGrid sender email
 * @param {string} opts.fromName   - Display name for sender
 * @returns {Promise<{ simulationId, sent, failed }>}
 */
export async function launchSimulation({ templateId, name, targets, fromEmail, fromName }) {
  // 1. Create simulation record in Firestore first
  const simRef = await addDoc(collection(db, `organizations/${ORG_ID}/simulations`), {
    name,
    templateId,
    targets: Array.isArray(targets) ? targets.length : targets,
    clicked:  0,
    reported: 0,
    failRate: 0,
    status:   'sending',
    createdAt: serverTimestamp(),
  });

  const simulationId = simRef.id;

  // 2. Resolve targets list
  const targetList = Array.isArray(targets)
    ? targets
    : generateMockTargets(targets); // fallback for demo

  // 3. Call the Firebase Cloud Function
  try {
    const sendFn = httpsCallable(functions, 'sendSimulationEmail');
    const result = await sendFn({
      simulationId,
      templateId,
      targets:     targetList,
      orgId:       ORG_ID,
      fromEmail,
      fromName,
      companyName: 'Apex Financial Services',
    });

    console.log('[TrustNet] Simulation launched:', result.data);
    return { simulationId, ...result.data };
  } catch (err) {
    console.error('[TrustNet] Simulation failed:', err.message);

    // Mark as failed in Firestore
    await simRef.update({ status: 'failed', error: err.message });
    throw err;
  }
}

/**
 * Generate realistic mock employee targets for demo campaigns
 */
function generateMockTargets(count) {
  const names = [
    'Priya Sharma', 'Arjun Mehta', 'Sneha Patel', 'Vikram Nair',
    'Anjali Kapoor', 'Rahul Gupta', 'Divya Krishnan', 'Sanjay Rao',
    'Pooja Iyer', 'Rohit Verma', 'Meera Pillai', 'Karan Singh',
    'Deepa Menon', 'Anil Joshi', 'Sunita Reddy',
  ];
  const depts = ['Finance', 'HR', 'Executive Office', 'Operations', 'Legal', 'IT', 'Marketing'];

  return Array.from({ length: Math.min(count, names.length) }, (_, i) => ({
    name:  names[i],
    email: `${names[i].toLowerCase().replace(' ', '.')}@apex-financial.com`,
    dept:  depts[i % depts.length],
  }));
}
