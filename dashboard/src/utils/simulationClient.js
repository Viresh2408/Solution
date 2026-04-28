// TrustNet AI — Phishing Simulation Client
// Calls the Supabase Edge Function which securely proxies SendGrid
// Key never leaves the server — this file has NO sensitive credentials.

import { supabase } from '../supabase';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

const ORG_ID = 'apex-financial';

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
 * Creates a database record, then calls the Firebase Cloud Function to send emails
 *
 * @param {Object} opts
 */
export async function launchSimulation({ templateId, name, targets, fromEmail, fromName }) {
  // 1. Create simulation record in Supabase first
  const { data: simData, error: insertErr } = await supabase
    .from('simulations')
    .insert({
      orgId: ORG_ID,
      name,
      targets: Array.isArray(targets) ? targets.length : parseInt(targets),
      clicked:  0,
      reported: 0,
      failRate: 0,
      status:   'sending',
      createdAt: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertErr) throw insertErr;
  
  const simulationId = simData.id;

  // 2. Resolve targets list
  const targetList = Array.isArray(targets)
    ? targets
    : generateMockTargets(targets);

  // 3. Call the Firebase Cloud Function
  try {
    const sendSimulationEmail = httpsCallable(functions, 'sendSimulationEmail');
    const { data: result } = await sendSimulationEmail({
      simulationId,
      templateId,
      targets:     targetList,
      orgId:       ORG_ID,
      fromEmail,
      fromName,
      companyName: 'Apex Financial Services',
    });

    console.log('[TrustNet] Simulation launched:', result);
    return { simulationId, ...result };
  } catch (err) {
    console.error('[TrustNet] Simulation failed:', err.message);

    // Mark as failed in Supabase
    await supabase.from('simulations').update({ status: 'failed' }).eq('id', simulationId);
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
