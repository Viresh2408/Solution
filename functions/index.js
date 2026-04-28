// TrustNet AI — Firebase Cloud Function: sendSimulationEmail
// Secure server-side proxy: Dashboard → Cloud Function → SendGrid
// This keeps the SendGrid API key off the browser entirely.
//
// DEPLOY: firebase deploy --only functions
// REQUIRES: Firebase Blaze plan (pay-as-you-go)

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const sgMail    = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

// Key is stored as a Firebase Secret (not in code)
// Set it once: firebase functions:secrets:set SENDGRID_API_KEY
sgMail.setApiKey(functions.config().sendgrid?.key || process.env.SENDGRID_API_KEY);

// ── Phishing Simulation Email Templates ───────────────────────────────────────
const TEMPLATES = {
  payroll: {
    subject: 'ACTION REQUIRED: Verify your payroll details before Friday',
    previewText: 'Your payroll deposit may be affected',
    body: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <div style="background:#1a237e;padding:16px;border-radius:6px 6px 0 0;margin:-20px -20px 20px;">
          <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ Payroll Verification Required</h2>
        </div>
        <p>Dear {{name}},</p>
        <p>Our payroll system has flagged your account for mandatory re-verification. 
           <strong>Failure to verify before Friday will delay your salary deposit.</strong></p>
        <p style="background:#fff3cd;padding:12px;border-left:4px solid #ffc107;border-radius:4px;">
          Your Employee ID: <strong>{{empId}}</strong><br>
          Deadline: <strong>Friday, 5:00 PM IST</strong>
        </p>
        <a href="{{trackingUrl}}" 
           style="display:inline-block;background:#1a237e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Verify Payroll Details →
        </a>
        <p style="font-size:12px;color:#666;margin-top:20px;">
          This is an automated message from HR Systems. Do not reply to this email.<br>
          <em>{{footer}}</em>
        </p>
      </div>
    `,
  },
  itReset: {
    subject: 'IT Security Alert: Password reset required within 24 hours',
    previewText: 'Your corporate account security has been flagged',
    body: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <div style="background:#b71c1c;padding:16px;border-radius:6px 6px 0 0;margin:-20px -20px 20px;">
          <h2 style="color:#fff;margin:0;font-size:18px;">🔒 Security Alert — Immediate Action Required</h2>
        </div>
        <p>Hi {{name}},</p>
        <p>Our security systems have detected unusual login activity on your account 
           from <strong>an unrecognized device in Singapore</strong>.</p>
        <p>As a precaution, your account password <strong>must be reset within 24 hours</strong> 
           or your account will be temporarily suspended.</p>
        <a href="{{trackingUrl}}"
           style="display:inline-block;background:#b71c1c;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Reset Password Now →
        </a>
        <p style="font-size:12px;color:#666;margin-top:20px;">
          IT Security Team | {{company}}<br>
          <em>{{footer}}</em>
        </p>
      </div>
    `,
  },
  ceoFraud: {
    subject: 'Urgent — Confidential Request from {{ceoName}}',
    previewText: 'Please handle this personally and urgently',
    body: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <p>Hi {{name}},</p>
        <p>I need you to handle something <strong>urgently and confidentially</strong> for me. 
           I'm currently in a board meeting and cannot take calls.</p>
        <p>Please process a vendor payment of <strong>₹{{amount}}</strong> to our new supplier. 
           I'll explain the details after the meeting. Do not discuss this with anyone else.</p>
        <a href="{{trackingUrl}}"
           style="display:inline-block;background:#1b5e20;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Access Payment Portal →
        </a>
        <p style="margin-top:20px;font-size:14px;">
          Sent from my iPhone<br>
          <strong>{{ceoName}}</strong><br>
          CEO, {{company}}
        </p>
        <p style="font-size:12px;color:#666;"><em>{{footer}}</em></p>
      </div>
    `,
  },
};

// ── Cloud Function Entry Point ────────────────────────────────────────────────
exports.sendSimulationEmail = functions
  .runWith({ secrets: ['SENDGRID_API_KEY'] })
  .https.onCall(async (data, context) => {

    // Auth guard — only authenticated dashboard users can trigger simulations
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const {
      simulationId,
      templateId,    // 'payroll' | 'itReset' | 'ceoFraud'
      targets,       // [{ email, name, dept }]
      orgId,
      fromEmail,
      fromName,
      companyName,
    } = data;

    const template = TEMPLATES[templateId];
    if (!template) {
      throw new functions.https.HttpsError('invalid-argument', `Unknown template: ${templateId}`);
    }

    // Base tracking URL — embeds recipient email as query param for click tracking
    const trackingBase = `https://${orgId}.trustnet.ai/track`;
    
    const results = { sent: 0, failed: 0, errors: [] };

    // Send in batches of 10 to respect SendGrid rate limits
    const batches = [];
    for (let i = 0; i < targets.length; i += 10) {
      batches.push(targets.slice(i, i + 10));
    }

    for (const batch of batches) {
      const messages = batch.map(target => {
        const trackingUrl = `${trackingBase}?sim=${simulationId}&email=${encodeURIComponent(target.email)}&t=${Date.now()}`;
        
        // Replace template variables
        const personalizedBody = template.body
          .replace(/{{name}}/g, target.name || 'Employee')
          .replace(/{{empId}}/g, `EMP${Math.floor(Math.random()*9000)+1000}`)
          .replace(/{{company}}/g, companyName || 'Your Company')
          .replace(/{{ceoName}}/g, 'Rajesh Kumar')
          .replace(/{{amount}}/g, '2,40,000')
          .replace(/{{trackingUrl}}/g, trackingUrl)
          .replace(/{{footer}}/g, '⚠️ THIS IS A SECURITY AWARENESS SIMULATION — Not a real threat');

        const personalizedSubject = template.subject
          .replace(/{{ceoName}}/g, 'Rajesh Kumar');

        return {
          to:      { email: target.email, name: target.name },
          from:    { email: fromEmail || 'no-reply@trustnet-sim.ai', name: fromName || 'TrustNet Security' },
          subject: personalizedSubject,
          html:    personalizedBody,
          trackingSettings: {
            clickTracking:  { enable: true, enableText: true },
            openTracking:   { enable: true },
          },
        };
      });

      try {
        await Promise.all(messages.map(msg => sgMail.send(msg)));
        results.sent += batch.length;
      } catch (err) {
        results.failed += batch.length;
        results.errors.push(err.message);
        console.error('[TrustNet] SendGrid batch failed:', err.message);
      }

      // Rate limit pause between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Write results back to Firestore
    await db.doc(`organizations/${orgId}/simulations/${simulationId}`).update({
      status:    'sent',
      sentAt:    admin.firestore.FieldValue.serverTimestamp(),
      sentCount: results.sent,
      failCount: results.failed,
    });

    console.log(`[TrustNet] Simulation ${simulationId}: sent=${results.sent} failed=${results.failed}`);
    return results;
  });



// ── Click Tracking HTTP endpoint ──────────────────────────────────────────────
exports.trackSimulationClick = functions.https.onRequest(async (req, res) => {
  const { sim, email } = req.query;
  if (sim && email) {
    // Increment click counter in Firestore
    const snapshot = await db.collectionGroup('simulations')
      .where('__name__', '>=', sim)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        clicked: admin.firestore.FieldValue.increment(1),
        failRate: admin.firestore.FieldValue.increment(0), // recalculated below
      });
    }
    console.log(`[TrustNet] Simulation click: sim=${sim} email=${email}`);
  }
  res.redirect('https://stock-market-app-5ef5c.web.app/phishing-caught');
});

// ── Slack Notification ────────────────────────────────────────────────────────
exports.notifySlack = functions
  .runWith({ secrets: ['SLACK_WEBHOOK_URL'] })
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    
    const { alertId, type, severity, user, detail, orgId } = data;
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || functions.config().slack?.webhook;

    if (!webhookUrl) {
      console.warn('[TrustNet] No Slack webhook configured');
      return { success: false, error: 'No webhook' };
    }

    try {
      const axios = require('axios');
      const payload = {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚨 *TrustNet Security Alert* | *${severity.toUpperCase()}*`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Type:*\n${type}` },
              { type: 'mrkdwn', text: `*User:*\n${user}` },
              { type: 'mrkdwn', text: `*Organization:*\n${orgId}` },
              { type: 'mrkdwn', text: `*Detail:*\n${detail}` },
            ],
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Incident' },
                url: `https://trustnet-dashboard.example.com/alerts?id=${alertId}`,
                style: 'danger',
              },
            ],
          },
        ],
      };

      await axios.post(webhookUrl, payload);
      console.log(`[TrustNet] Slack notified for alert=${alertId}`);
      return { success: true };
    } catch (err) {
      console.error('[TrustNet] Slack notify failed:', err.message);
      return { success: false, error: err.message };
    }
  });

// ── Red Team Simulation Launcher ──────────────────────────────────────────────
exports.launchRedTeamSimulation = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const { orgId, channels, targets, simId } = data;
  console.log(`[TrustNet] Launching Red Team sim=${simId} for org=${orgId} via channels=${channels.join(',')}`);

  // In production, this would trigger different worker jobs (SendGrid, Twilio, etc.)
  // For MVP, we log the intent and return success
  return { 
    success: true, 
    simId, 
    startTime: new Date().toISOString(),
    status: 'scheduled' 
  };
});

// ── Weekly Report Generator ───────────────────────────────────────────────────
exports.generateWeeklyReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { orgId } = data;
  console.log(`[TrustNet] Generating weekly AI report for org=${orgId}`);

  // In production, this would use Gemini 1.5 Flash to summarize the week's alerts
  return { 
    success: true, 
    summary: 'AI summarization in progress...',
    timestamp: new Date().toISOString() 
  };
});
