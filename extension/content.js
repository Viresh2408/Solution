// TrustNet AI — Content Script
// Injects into all web pages to scan content and show contextual warnings

(function() {
  'use strict';

  // Prevent double injection
  if (window.__trustNetInjected) return;
  window.__trustNetInjected = true;

  // ============================================================
  // STYLES (injected into page)
  // ============================================================
  const style = document.createElement('style');
  style.textContent = `
    .trustnet-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 100px;
      cursor: pointer;
      margin-left: 4px;
      vertical-align: middle;
      text-decoration: none;
      transition: all 0.2s;
      z-index: 2147483640;
      position: relative;
    }
    .trustnet-badge.safe { background: rgba(46,213,115,0.15); border: 1px solid rgba(46,213,115,0.4); color: #2ED573; }
    .trustnet-badge.warn { background: rgba(255,165,2,0.15); border: 1px solid rgba(255,165,2,0.4); color: #FFA502; }
    .trustnet-badge.danger { background: rgba(255,71,87,0.15); border: 1px solid rgba(255,71,87,0.4); color: #FF4757; }
    .trustnet-badge:hover { transform: scale(1.05); }
    .trustnet-badge .tn-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: tnPulse 2s infinite; }
    @keyframes tnPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .trustnet-warning-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      background: linear-gradient(135deg, #1a0a0a, #0a0812);
      border-bottom: 2px solid #FF4757;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      box-shadow: 0 4px 30px rgba(255,71,87,0.3);
      animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }

    .trustnet-warning-banner .tn-logo {
      font-size: 16px;
      font-weight: 800;
      color: #FF4757;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .trustnet-warning-banner .tn-content { flex: 1; }
    .trustnet-warning-banner .tn-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; }
    .trustnet-warning-banner .tn-reasons { font-size: 11px; color: rgba(255,255,255,0.6); }
    .trustnet-warning-banner .tn-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .trustnet-warning-banner button {
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tn-btn-proceed { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
    .tn-btn-proceed:hover { background: rgba(255,255,255,0.15); }
    .tn-btn-leave { background: #FF4757; color: #fff; }
    .tn-btn-leave:hover { background: #ff6070; transform: scale(1.02); }
    .tn-btn-dismiss { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 18px; padding: 4px 8px; cursor: pointer; }

    .trustnet-otp-warning {
      position: absolute;
      background: linear-gradient(135deg, #1a0a0a, #0a0812);
      border: 1px solid #FF4757;
      border-radius: 10px;
      padding: 12px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      font-size: 12px;
      color: #fff;
      z-index: 2147483645;
      box-shadow: 0 8px 30px rgba(255,71,87,0.4);
      max-width: 300px;
      animation: popIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes popIn { from { transform: scale(0.9) translateY(-5px); opacity:0; } to { transform: scale(1) translateY(0); opacity:1; } }
    .trustnet-otp-warning .tn-warn-title { font-weight: 700; color: #FF4757; margin-bottom: 4px; display: flex; align-items: center; gap: 5px; }
    .trustnet-otp-warning .tn-warn-body { color: rgba(255,255,255,0.7); line-height: 1.4; margin-bottom: 8px; }
    .trustnet-otp-warning .tn-warn-dismiss { font-size: 11px; color: rgba(255,255,255,0.4); cursor: pointer; }
    .trustnet-otp-warning .tn-warn-dismiss:hover { color: rgba(255,255,255,0.7); }

    .tn-link-safe::after { content: ' ✓'; color: #2ED573; font-size: 10px; }
    .tn-link-warn::after { content: ' ⚠'; color: #FFA502; font-size: 10px; }
    .tn-link-danger::after { content: ' ✗'; color: #FF4757; font-size: 10px; }

    .trustnet-form-guard {
      outline: 2px solid #FF4757 !important;
      outline-offset: 2px;
    }

    /* Risk/Fraud Feedback Overlay */
    .tn-risk-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #FF4757;
      border-radius: 16px;
      padding: 40px;
      z-index: 2147483647;
      text-align: center;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      box-shadow: 0 0 50px rgba(255, 71, 87, 0.5);
      animation: tnFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 500px;
    }
    @keyframes tnFadeIn { from { opacity: 0; transform: translate(-50%, -55%); } to { opacity: 1; transform: translate(-50%, -50%); } }
    .tn-risk-overlay h1 { font-size: 28px; font-weight: 800; color: #FF4757; margin-bottom: 16px; }
    .tn-risk-overlay p { font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 24px; }
    .tn-risk-overlay .tn-score-inc { font-size: 48px; font-weight: 900; color: #FF4757; display: block; margin-bottom: 12px; }
    .tn-risk-overlay button { background: #FF4757; color: #fff; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // ============================================================
  // SEARCH MONITORING
  // ============================================================
  const RISKY_SEARCH_TERMS = ['illegal', 'drugs', 'weapons', 'hacking', 'darknet', 'scam', 'fraud', 'stolen', 'bypass', 'exploit', 'malware', 'ransomware', 'tor market'];

  function monitorSearches() {
    const url = new URL(window.location.href);
    let query = '';

    if (url.hostname.includes('google.com')) {
      query = url.searchParams.get('q');
    } else if (url.hostname.includes('bing.com')) {
      query = url.searchParams.get('q');
    }

    if (query) {
      const detectedTerms = RISKY_SEARCH_TERMS.filter(term => query.toLowerCase().includes(term));
      if (detectedTerms.length > 0) {
        showRiskIncrease('Risky Search Detected', `Your search for "${query}" contains restricted keywords: ${detectedTerms.join(', ')}. This activity has been flagged for administrative review.`);
        chrome.runtime.sendMessage({ 
          type: 'REPORT_ACTIVITY', 
          activity: { 
            type: 'RISKY_SEARCH', 
            detail: `Worker searched for: ${query}`,
            severity: 'high'
          } 
        });
      }
    }
  }

  function showRiskIncrease(title, message) {
    const overlay = document.createElement('div');
    overlay.className = 'tn-risk-overlay';
    overlay.innerHTML = `
      <h1>⚠️ ${title}</h1>
      <span class="tn-score-inc">+25% RISK</span>
      <p>${message}</p>
      <button onclick="this.closest('.tn-risk-overlay').remove()">I UNDERSTAND</button>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 8000);
  }

  // ============================================================
  // CLICK MONITORING
  // ============================================================
  function setupClickMonitoring() {
    document.addEventListener('click', async (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.href;
      if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;

      // We use the results already attached to the link by scanLinks
      const badge = link.nextSibling;
      if (badge && badge.classList?.contains('trustnet-badge') && badge.classList.contains('danger')) {
        e.preventDefault();
        showFraudAlert(href);
      }
    }, true); // Capture phase to prevent navigation before we decide
  }

  function showFraudAlert(url) {
    const overlay = document.createElement('div');
    overlay.className = 'tn-risk-overlay';
    overlay.innerHTML = `
      <h1>🚫 FRAUD LINK BLOCKED</h1>
      <span class="tn-score-inc">FRAUD ALERT</span>
      <p>The link <strong>${url}</strong> has been identified as a phishing or fraud attempt. Navigation has been blocked to protect your credentials and company data.</p>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button onclick="this.closest('.tn-risk-overlay').remove()" style="background:rgba(255,255,255,0.1)">Dismiss</button>
        <button onclick="window.history.back()" style="background:#2ED573">Safety First</button>
      </div>
    `;
    document.body.appendChild(overlay);

    chrome.runtime.sendMessage({ 
      type: 'REPORT_ACTIVITY', 
      activity: { 
        type: 'FRAUD_CLICK', 
        detail: `Worker attempted to click on a known fraud link: ${url}`,
        severity: 'critical'
      } 
    });
  }

  // ============================================================
  // STATE
  // ============================================================
  let pageRisk = null;
  let warningBannerShown = false;
  let analyzedLinks = new WeakSet();
  let settings = {};

  // ============================================================
  // INITIALIZATION
  // ============================================================
  async function init() {
    // Load settings
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      settings = response?.settings || {};
    } catch {}

    // Analyze current page
    const url = window.location.href;
    try {
      pageRisk = await chrome.runtime.sendMessage({ type: 'ANALYZE_URL', url, context: { trigger: 'pageload' } });
      handlePageRisk(pageRisk);
    } catch (err) {
      console.warn('[TrustNet] Could not contact background:', err?.message);
    }

    // Scan visible links
    scanLinks();

    // Monitor searches
    monitorSearches();

    // Monitor clicks
    setupClickMonitoring();

    // F1 — Behavioral Biometrics (Agent 15)
    setupBiometricTracking();

    // F7 — Zero-Trust Credential Enforcer (Agent 19)
    setupCredentialEnforcer();

    // Watch for new links (SPAs)
    const linkObserver = new MutationObserver(() => scanLinks());
    linkObserver.observe(document.body, { childList: true, subtree: true });

    // Monitor form fields for sensitive data entry
    monitorFormFields();

    // Monitor Gmail/Outlook DOM for email content
    if (document.location.hostname.match(/mail\.google\.com|outlook\.live\.com|outlook\.office\.com/)) {
      monitorEmailClient();
    }
  }

  // ============================================================
  // PAGE RISK HANDLING
  // ============================================================
  function handlePageRisk(risk) {
    if (!risk) return;
    if (!settings.enableWarningOverlays) return;

    if (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'HIGH') {
      if (!warningBannerShown) {
        showWarningBanner(risk);
        warningBannerShown = true;
      }
    }
  }

  function showWarningBanner(risk) {
    const banner = document.createElement('div');
    banner.className = 'trustnet-warning-banner';
    banner.id = 'trustnet-warning-banner';

    const reasonsText = risk.reasons.slice(0, 2).join(' · ') || 'Multiple threat indicators detected';
    const riskColor = risk.riskLevel === 'CRITICAL' ? '#FF4757' : '#FFA502';
    const attackTypes = (risk.attackTypes || []).join(', ') || 'THREAT';

    banner.innerHTML = `
      <div class="tn-logo">🛡 TrustNet AI</div>
      <div class="tn-content">
        <div class="tn-title">⚠ ${risk.riskLevel} RISK — ${attackTypes} detected on this page (Score: ${risk.score}/100)</div>
        <div class="tn-reasons">${reasonsText}</div>
      </div>
      <div class="tn-actions">
        <button class="tn-btn-proceed" id="tn-proceed">I understand, proceed</button>
        <button class="tn-btn-leave" id="tn-leave">← Go Back to Safety</button>
      </div>
      <button class="tn-btn-dismiss" id="tn-dismiss">×</button>
    `;

    document.body.prepend(banner);
    // Push content down
    document.body.style.marginTop = (banner.offsetHeight + 'px');

    document.getElementById('tn-dismiss')?.addEventListener('click', () => {
      banner.remove();
      document.body.style.marginTop = '';
    });
    document.getElementById('tn-proceed')?.addEventListener('click', () => {
      banner.remove();
      document.body.style.marginTop = '';
      chrome.runtime.sendMessage({ type: 'LOG_INTERACTION', interaction: { type: 'WARNING_DISMISSED', riskLevel: risk.riskLevel } });
    });
    document.getElementById('tn-leave')?.addEventListener('click', () => {
      window.history.back();
    });
  }

  // ============================================================
  // LINK SCANNING
  // ============================================================
  async function scanLinks() {
    const links = document.querySelectorAll('a[href]');
    const toAnalyze = [];

    links.forEach(link => {
      if (analyzedLinks.has(link)) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
        toAnalyze.push({ link, url: url.href });
        analyzedLinks.add(link);
      } catch {}
    });

    // Analyze in batches of 5
    for (let i = 0; i < Math.min(toAnalyze.length, 20); i += 5) {
      const batch = toAnalyze.slice(i, i + 5);
      await Promise.all(batch.map(async ({ link, url }) => {
        try {
          const result = await chrome.runtime.sendMessage({ type: 'ANALYZE_URL', url, context: { trigger: 'link_scan' } });
          addLinkBadge(link, result);
        } catch {}
      }));
      await sleep(100);
    }
  }

  function addLinkBadge(link, result) {
    if (!result) return;
    const cls = result.riskLevel === 'SAFE' ? 'safe' : result.riskLevel === 'MEDIUM' ? 'warn' : 'danger';
    const label = result.riskLevel === 'SAFE' ? 'Safe' : result.riskLevel === 'MEDIUM' ? 'Caution' : '⚠ Risk';

    const badge = document.createElement('span');
    badge.className = `trustnet-badge ${cls}`;
    badge.innerHTML = `<span class="tn-dot"></span>${label}`;
    badge.title = result.reasons?.join('\n') || 'TrustNet Analysis';
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showLinkTooltip(badge, result);
    });

    link.parentNode?.insertBefore(badge, link.nextSibling);
  }

  function showLinkTooltip(badge, result) {
    // Remove existing tooltips
    document.querySelectorAll('.trustnet-link-tooltip').forEach(t => t.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 'trustnet-otp-warning trustnet-link-tooltip';
    const cls = result.riskLevel === 'SAFE' ? '#2ED573' : result.riskLevel === 'MEDIUM' ? '#FFA502' : '#FF4757';

    tooltip.innerHTML = `
      <div class="tn-warn-title" style="color:${cls}">🛡 TrustNet — ${result.riskLevel}</div>
      <div class="tn-warn-body">
        Score: ${result.score}/100<br>
        ${result.reasons?.slice(0, 3).map(r => `• ${r}`).join('<br>') || 'No threats detected'}
      </div>
      <span class="tn-warn-dismiss" onclick="this.closest('.trustnet-link-tooltip').remove()">Dismiss ×</span>
    `;

    const rect = badge.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.top = (rect.bottom + 8) + 'px';
    tooltip.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

    document.body.appendChild(tooltip);
    setTimeout(() => { document.addEventListener('click', () => tooltip.remove(), { once: true }); }, 100);
  }

  // ============================================================
  // FORM FIELD PROTECTION (OTP / Password on unverified domains)
  // ============================================================
  function monitorFormFields() {
    function checkField(field) {
      const type = field.type?.toLowerCase();
      const name = (field.name + field.id + field.placeholder + field.autocomplete).toLowerCase();
      const isOTP = name.match(/otp|one.?time|verification.?code|token/);
      const isPassword = type === 'password';
      const isSensitive = name.match(/card|cvv|pin|aadhaar|pan\b|password|credential/);

      if ((isOTP || isPassword || isSensitive) && pageRisk && pageRisk.score > 40) {
        field.classList.add('trustnet-form-guard');
        field.addEventListener('focus', () => showOTPWarning(field, isOTP ? 'OTP' : 'Sensitive Data'), { once: true });
      }
    }

    document.querySelectorAll('input').forEach(checkField);

    const formObserver = new MutationObserver(() => {
      document.querySelectorAll('input:not([data-tn-checked])').forEach(field => {
        field.setAttribute('data-tn-checked', '1');
        checkField(field);
      });
    });
    formObserver.observe(document.body, { childList: true, subtree: true });
  }

  function showOTPWarning(field, dataType) {
    const existing = document.getElementById('trustnet-otp-warn');
    if (existing) existing.remove();

    const warning = document.createElement('div');
    warning.className = 'trustnet-otp-warning';
    warning.id = 'trustnet-otp-warn';
    warning.innerHTML = `
      <div class="tn-warn-title">⚠️ TrustNet Alert — ${dataType} Field</div>
      <div class="tn-warn-body">This page has a risk score of <strong>${pageRisk?.score}/100</strong>. 
      Never share ${dataType === 'OTP' ? 'OTPs' : 'sensitive data'} on sites you didn't navigate to directly. 
      Legitimate services NEVER ask for OTPs via links.</div>
      <span class="tn-warn-dismiss" id="tn-otp-dismiss">I understand, dismiss →</span>
    `;

    const rect = field.getBoundingClientRect();
    warning.style.position = 'fixed';
    warning.style.top = (rect.bottom + 8) + 'px';
    warning.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';

    document.body.appendChild(warning);
    document.getElementById('tn-otp-dismiss')?.addEventListener('click', () => warning.remove());
    setTimeout(() => warning.remove(), 10000);
  }

  // ============================================================
  // GMAIL / OUTLOOK EMAIL MONITORING
  // ============================================================
  function monitorEmailClient() {
    let lastEmailId = null;

    const emailObserver = new MutationObserver(async () => {
      // Try to find email content in Gmail DOM
      const emailBody = document.querySelector('[data-message-id] .a3s') // Gmail
        || document.querySelector('[aria-label="Message body"]'); // Outlook

      if (!emailBody) return;

      const emailId = emailBody.textContent.slice(0, 50); // Use first 50 chars as ID
      if (emailId === lastEmailId) return;
      lastEmailId = emailId;

      const subject = document.querySelector('h2.hP')?.textContent // Gmail subject
        || document.querySelector('[aria-label^="Subject"]')?.textContent
        || '';
      const body = emailBody.textContent || '';
      const hasAttachments = !!document.querySelector('[data-tooltip="Download attachment"]');

      if (body.length < 10) return;

      try {
        const result = await chrome.runtime.sendMessage({
          type: 'ANALYZE_EMAIL',
          content: { subject, body: body.slice(0, 2000), hasAttachments }
        });

        if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
          showEmailWarning(result, emailBody);
        }
      } catch {}
    });

    emailObserver.observe(document.body, { childList: true, subtree: true });
  }

  function showEmailWarning(result, emailBody) {
    const existing = document.getElementById('trustnet-email-warn');
    if (existing) existing.remove();

    const warn = document.createElement('div');
    warn.id = 'trustnet-email-warn';
    warn.style.cssText = `
      background: linear-gradient(135deg, #1a0a0a, #0a0812);
      border: 1px solid #FF4757;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 12px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      color: #fff;
      box-shadow: 0 4px 20px rgba(255,71,87,0.3);
    `;

    warn.innerHTML = `
      <div style="font-weight:700;color:#FF4757;margin-bottom:6px;font-size:14px">
        🛡️ TrustNet AI — Phishing Alert (Score: ${result.score}/100)
      </div>
      <div style="color:rgba(255,255,255,0.7);line-height:1.5;margin-bottom:10px">
        ${result.signals?.slice(0, 3).map(s => `• ${s}`).join('<br>') || 'Suspicious patterns detected'}
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="this.closest('#trustnet-email-warn').remove()" 
          style="background:rgba(255,255,255,0.1);border:none;color:rgba(255,255,255,0.7);padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px">
          Dismiss
        </button>
        <button style="background:#FF4757;border:none;color:#fff;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;font-weight:600">
          Report Email
        </button>
      </div>
    `;

    emailBody.parentNode?.insertBefore(warn, emailBody);
  }

  // ============================================================
  // F1 — BEHAVIORAL BIOMETRICS TRACKER (Agent 15)
  // ============================================================
  function setupBiometricTracking() {
    const sensitiveSelectors = [
      'input[type="password"]',
      'input[name*="otp"]', 'input[id*="otp"]',
      'input[name*="pin"]', 'input[id*="pin"]',
      'input[name*="card"]', 'input[id*="card"]',
      'input[autocomplete="cc-number"]',
      'input[autocomplete="current-password"]',
    ];

    document.querySelectorAll(sensitiveSelectors.join(',')).forEach(attachBiometricMonitor);

    // Watch for dynamically added fields
    const bioObserver = new MutationObserver(() => {
      document.querySelectorAll(sensitiveSelectors.join(','))
        .forEach(f => { if (!f._tnBioAttached) attachBiometricMonitor(f); });
    });
    bioObserver.observe(document.body, { childList: true, subtree: true });
  }

  function attachBiometricMonitor(field) {
    if (field._tnBioAttached) return;
    field._tnBioAttached = true;

    const fieldType = field.type === 'password' ? 'password' : 'sensitive';
    let typingIntervals = [];
    let lastKeyTime = null;
    let pasteCount = 0;
    let copyCount  = 0;
    const sessionStart = Date.now();

    field.addEventListener('keydown', () => {
      const now = Date.now();
      if (lastKeyTime) typingIntervals.push(now - lastKeyTime);
      lastKeyTime = now;
      if (typingIntervals.length > 50) typingIntervals = typingIntervals.slice(-50);
    });

    field.addEventListener('paste', async () => {
      pasteCount++;
      // Report immediately on paste in password fields
      if (fieldType === 'password' || pasteCount >= 2) {
        const result = await chrome.runtime.sendMessage({
          type: 'BIOMETRIC_EVENT',
          event: { typingIntervals, pasteCount, copyCount, fieldType, sessionMs: Date.now() - sessionStart },
        }).catch(() => null);

        if (result && result.anomalyScore >= 60) {
          showBiometricAlert(result.anomalyScore, result.triggerType);
        }
      }
    });

    document.addEventListener('copy', () => { copyCount++; });

    field.addEventListener('blur', async () => {
      if (typingIntervals.length < 3 && pasteCount === 0) return;
      const result = await chrome.runtime.sendMessage({
        type: 'BIOMETRIC_EVENT',
        event: { typingIntervals, pasteCount, copyCount, fieldType, sessionMs: Date.now() - sessionStart },
      }).catch(() => null);

      if (result && result.anomalyScore >= 60) {
        showBiometricAlert(result.anomalyScore, result.triggerType);
      }
    });
  }

  function showBiometricAlert(score, trigger) {
    const existing = document.getElementById('tn-bio-alert');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'tn-bio-alert';
    el.style.cssText = `
      position:fixed; top:16px; right:16px; z-index:2147483646;
      background:linear-gradient(135deg,#1a0f00,#0d0a00);
      border:1px solid #FFA502; border-radius:12px; padding:14px 18px;
      font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
      color:#fff; max-width:300px; box-shadow:0 8px 30px rgba(255,165,2,0.35);
      animation:popIn 0.25s cubic-bezier(0.4,0,0.2,1);
    `;
    const triggerLabel = {
      paste_velocity: 'Paste velocity spike',
      bot_typing_speed: 'Inhuman typing speed',
      clipboard_cycling: 'Clipboard cycling',
      erratic_timing: 'Erratic timing pattern',
    }[trigger] || 'Anomalous input pattern';

    el.innerHTML = `
      <div style="font-weight:700;color:#FFA502;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        🧬 Unusual Behavior Detected
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.5;margin-bottom:10px;">
        Anomaly score: <strong style="color:#FFA502;">${score}/100</strong><br>
        Trigger: <strong>${triggerLabel}</strong><br>
        This session has been flagged for admin review.
      </div>
      <span style="font-size:11px;color:rgba(255,255,255,0.4);cursor:pointer;"
        onclick="document.getElementById('tn-bio-alert').remove()">Dismiss ×</span>
    `;
    document.body.appendChild(el);
    setTimeout(() => el?.remove(), 12000);
  }

  // ============================================================
  // F5 — SESSION ALERT HANDLER (Tab-napping Banner)
  // ============================================================
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SESSION_ALERT') {
      showSessionAlert(msg.detail);
    }
    if (msg.type === 'CREDENTIAL_UNBLOCK') {
      removeCredentialBlockOverlay();
      console.log('[POLICY] Credential submission unblocked by admin.');
    }
    if (msg.type === 'CREDENTIAL_DENIED') {
      updateCredentialBlockOverlay('denied');
    }
  });

  function showSessionAlert(detail) {
    const existing = document.getElementById('tn-session-alert');
    if (existing) return;

    const el = document.createElement('div');
    el.id = 'tn-session-alert';
    el.style.cssText = `
      position:fixed; top:0; left:0; right:0; z-index:2147483647;
      background:linear-gradient(135deg,#1a0505,#0d0010);
      border-bottom:2px solid #FF4757; padding:14px 20px;
      font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
      display:flex; align-items:center; gap:16px;
      box-shadow:0 4px 30px rgba(255,71,87,0.4);
      animation:slideDown 0.3s cubic-bezier(0.4,0,0.2,1);
    `;
    el.innerHTML = `
      <div style="font-size:20px;">🚨</div>
      <div style="flex:1;">
        <div style="font-weight:700;color:#FF4757;font-size:13px;margin-bottom:2px;">
          Tab-napping Attempt Detected
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65);">
          This page (<strong style="color:#fff;">${detail.detected}</strong>) appears to impersonate 
          <strong style="color:#FFA502;">${detail.realDomain}</strong>. 
          Do NOT enter any credentials.
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button onclick="window.close()" 
          style="background:#FF4757;border:none;color:#fff;padding:7px 14px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px;">
          Close This Tab
        </button>
        <button onclick="document.getElementById('tn-session-alert').remove()"
          style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.6);padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">
          Dismiss
        </button>
      </div>
    `;
    document.body.prepend(el);
  }

  // ============================================================
  // F7 — ZERO-TRUST CREDENTIAL ENFORCER (Agent 19)
  // ============================================================
  function setupCredentialEnforcer() {
    document.addEventListener('submit', async (e) => {
      if (!pageRisk || pageRisk.score < 50) return;

      const form = e.target;
      const hasPassword = form.querySelector('input[type="password"]');
      const hasOTP      = form.querySelector('input[name*="otp"], input[id*="otp"], input[name*="pin"]');

      if (!hasPassword && !hasOTP) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      const domain = window.location.hostname;
      showCredentialBlockOverlay(domain, pageRisk.score, form);
    }, true);
  }

  function showCredentialBlockOverlay(domain, riskScore, form) {
    const existing = document.getElementById('tn-cred-block');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.id = 'tn-cred-block';
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:2147483647;
      background:rgba(0,0,0,0.92);
      display:flex; align-items:center; justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
      animation:tnFadeIn 0.3s cubic-bezier(0.4,0,0.2,1);
    `;
    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a0005,#080014);border:2px solid #FF4757;
        border-radius:20px;padding:40px;max-width:500px;width:90%;text-align:center;
        box-shadow:0 0 80px rgba(255,71,87,0.3);">
        <div style="font-size:3rem;margin-bottom:16px;">🔒</div>
        <h2 style="color:#FF4757;font-size:1.3rem;font-weight:800;margin-bottom:12px;">
          Credential Submission Blocked
        </h2>
        <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin-bottom:8px;">
          This page (<strong style="color:#fff;">${domain}</strong>) has a risk score of 
          <strong style="color:#FF4757;">${riskScore}/100</strong>.<br>
          Submitting credentials here has been blocked by your organization's Zero-Trust policy.
        </p>
        <div id="tn-cred-status" style="margin:16px 0;font-size:13px;color:#FFA502;">
          ⏳ Requesting admin override…
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button onclick="window.history.back()"
            style="background:#FF4757;border:none;color:#fff;padding:10px 24px;border-radius:8px;font-weight:700;cursor:pointer;">
            ← Go Back to Safety
          </button>
          <button onclick="document.getElementById('tn-cred-block').remove()"
            style="background:rgba(255,255,255,0.08);border:none;color:rgba(255,255,255,0.5);padding:10px 18px;border-radius:8px;cursor:pointer;font-size:12px;">
            Cancel Request
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Notify background — starts OTP creation + polling
    chrome.runtime.sendMessage({
      type: 'CREDENTIAL_BLOCK',
      domain,
      riskScore,
    }).catch(() => {});
  }

  function removeCredentialBlockOverlay() {
    document.getElementById('tn-cred-block')?.remove();
  }

  function updateCredentialBlockOverlay(status) {
    const statusEl = document.getElementById('tn-cred-status');
    if (!statusEl) return;
    if (status === 'denied') {
      statusEl.style.color = '#FF4757';
      statusEl.textContent = '❌ Admin denied the override request.';
    }
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ============================================================
  // START
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

