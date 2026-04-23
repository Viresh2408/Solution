// TrustNet AI — Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {

  // ---- ELEMENT REFS ----
  const $ = id => document.getElementById(id);
  const statusDot = $('statusDot');
  const riskBadge = $('riskBadge');
  const pageUrl = $('pageUrl');
  const pageRiskScore = $('pageRiskScore');
  const riskBarFill = $('riskBarFill');
  const riskReasons = $('riskReasons');
  const attackTypes = $('attackTypes');
  const vulnScore = $('vulnScore');
  const scoreLevel = $('scoreLevel');
  const modelVer = $('modelVer');
  const miniGaugeFill = $('miniGaugeFill');
  const statBlocked = $('statBlocked');
  const statAnalyzed = $('statAnalyzed');
  const statSessions = $('statSessions');
  const threatsList = $('threatsList');

  // ---- VIEW TOGGLE ----
  $('settingsBtn').addEventListener('click', () => {
    $('mainView').classList.add('hidden');
    $('settingsView').classList.remove('hidden');
    loadSettings();
  });
  $('backBtn').addEventListener('click', () => {
    $('settingsView').classList.add('hidden');
    $('mainView').classList.remove('hidden');
  });

  // ---- ACTIONS ----
  $('reportBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      await chrome.runtime.sendMessage({
        type: 'REPORT_THREAT',
        threat: { url: tab.url, type: 'USER_REPORTED', score: 50 }
      });
      $('reportBtn').textContent = '✓ Reported';
      $('reportBtn').style.color = '#2ED573';
      setTimeout(() => { $('reportBtn').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg> Report This Page'; $('reportBtn').style.color = ''; }, 2000);
    }
  });

  $('dashboardBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://trustnet-dashboard.example.com' });
  });

  // ---- LOAD CURRENT TAB ----
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const domain = new URL(tab.url).hostname;
      pageUrl.textContent = domain;

      // Analyze current tab
      const result = await chrome.runtime.sendMessage({ type: 'ANALYZE_URL', url: tab.url, context: { trigger: 'popup' } });
      renderPageRisk(result);
    }
  } catch (err) {
    pageUrl.textContent = 'Unable to analyze this page';
    riskBadge.textContent = 'N/A';
  }

  // ---- LOAD STATE ----
  try {
    const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    renderState(state);
  } catch {}

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  function renderPageRisk(result) {
    if (!result) return;

    const { riskLevel, score, reasons, attackTypes: types } = result;

    // Risk badge
    const cls = riskLevel === 'SAFE' ? 'safe' : riskLevel === 'MEDIUM' ? 'warn' : riskLevel === 'HIGH' ? 'danger' : 'critical';
    riskBadge.className = 'risk-badge ' + cls;
    riskBadge.textContent = riskLevel;

    // Status dot
    statusDot.className = 'status-dot ' + (riskLevel === 'SAFE' ? '' : riskLevel === 'MEDIUM' ? 'warning' : 'danger');

    // Score
    pageRiskScore.textContent = score;
    pageRiskScore.style.color = score >= 75 ? '#FF4757' : score >= 40 ? '#FFA502' : '#2ED573';
    riskBarFill.style.width = score + '%';

    // Reasons
    riskReasons.innerHTML = '';
    if (reasons && reasons.length > 0) {
      reasons.slice(0, 4).forEach(r => {
        const div = document.createElement('div');
        div.className = 'risk-reason';
        div.textContent = r;
        riskReasons.appendChild(div);
      });
    } else {
      const div = document.createElement('div');
      div.className = 'risk-reason';
      div.style.color = '#2ED573';
      div.textContent = 'No threats detected on this page';
      riskReasons.appendChild(div);
    }

    // Attack types
    attackTypes.innerHTML = '';
    if (types && types.length > 0) {
      types.forEach(t => {
        const tag = document.createElement('span');
        tag.className = 'attack-tag';
        tag.textContent = t;
        attackTypes.appendChild(tag);
      });
    }
  }

  function renderState(state) {
    if (!state) return;

    // Vulnerability score
    const score = state.vulnerabilityScore || 50;
    vulnScore.textContent = score;

    // Update mini gauge
    const pct = score / 100;
    const offset = 157 - (pct * 157);
    miniGaugeFill.style.strokeDashoffset = offset;

    // Score level
    const level = score >= 75 ? '⚠ High Risk' : score >= 50 ? '~ Moderate Risk' : score >= 25 ? '↑ Low Risk' : '✓ Very Low Risk';
    const color = score >= 75 ? '#FF4757' : score >= 50 ? '#FFA502' : score >= 25 ? '#FFA502' : '#2ED573';
    scoreLevel.textContent = level;
    scoreLevel.style.color = color;
    vulnScore.style.color = color;

    // Model version
    if (state.modelVersion) modelVer.textContent = state.modelVersion;

    // Stats
    statBlocked.textContent = state.stats?.threatsBlocked || 0;
    statAnalyzed.textContent = state.stats?.urlsAnalyzed || 0;
    statSessions.textContent = state.stats?.sessionsProtected || 1;

    // Recent threats
    const threats = state.sessionThreats || [];
    if (threats.length > 0) {
      threatsList.innerHTML = '';
      threats.slice(-5).reverse().forEach(threat => {
        const item = document.createElement('div');
        item.className = 'threat-item';
        const time = new Date(threat.reportedAt || Date.now());
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        item.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF4757" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          <div>
            <div class="threat-type">${threat.type || 'THREAT'}</div>
            <div style="font-size:9px;color:#4A5568">${(threat.tabUrl || '').slice(0, 30) || 'Unknown URL'}</div>
          </div>
          <div class="threat-time">${timeStr}</div>
        `;
        threatsList.appendChild(item);
      });
    }
  }

  // ============================================================
  // SETTINGS
  // ============================================================
  async function loadSettings() {
    const data = await chrome.storage.local.get(['settings', 'apiKey']);
    const s = data.settings || {};

    $('toggleOverlays').checked = s.enableWarningOverlays !== false;
    $('toggleNotifs').checked = s.enableNotifications !== false;
    $('toggleSafeBrowsing').checked = s.enableSafeBrowsing !== false;
    $('toggleFL').checked = s.enableFL !== false;
    $('togglePrivacy').checked = s.privacyMode === true;

    if (data.apiKey) $('apiKeyInput').value = data.apiKey;
  }

  // Auto-save toggle settings
  ['toggleOverlays', 'toggleNotifs', 'toggleSafeBrowsing', 'toggleFL', 'togglePrivacy'].forEach(id => {
    $(id)?.addEventListener('change', saveSettings);
  });

  async function saveSettings() {
    await chrome.storage.local.set({
      settings: {
        enableWarningOverlays: $('toggleOverlays').checked,
        enableNotifications: $('toggleNotifs').checked,
        enableSafeBrowsing: $('toggleSafeBrowsing').checked,
        enableFL: $('toggleFL').checked,
        privacyMode: $('togglePrivacy').checked,
      }
    });
  }

  $('saveApiKey')?.addEventListener('click', async () => {
    const key = $('apiKeyInput').value.trim();
    await chrome.storage.local.set({ apiKey: key });
    // Send to background
    await chrome.runtime.sendMessage({ type: 'UPDATE_API_KEY', key });
    $('saveApiKey').textContent = '✓ Saved!';
    setTimeout(() => { $('saveApiKey').textContent = 'Save'; }, 2000);
  });

});
