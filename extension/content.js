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
  `;
  document.head.appendChild(style);

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
