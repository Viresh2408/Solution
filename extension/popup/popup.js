// TrustNet AI — Extension Popup Script (v2 — with Vishing Guard + AI Trainer)

document.addEventListener('DOMContentLoaded', async () => {

  // ---- ELEMENT REFS ----
  const $ = id => document.getElementById(id);
  const statusDot     = $('statusDot');
  const riskBadge     = $('riskBadge');
  const pageUrl       = $('pageUrl');
  const pageRiskScore = $('pageRiskScore');
  const riskBarFill   = $('riskBarFill');
  const riskReasons   = $('riskReasons');
  const attackTypes   = $('attackTypes');
  const vulnScore     = $('vulnScore');
  const scoreLevel    = $('scoreLevel');
  const modelVer      = $('modelVer');
  const miniGaugeFill = $('miniGaugeFill');
  const statBlocked   = $('statBlocked');
  const statAnalyzed  = $('statAnalyzed');
  const statSessions  = $('statSessions');
  const threatsList   = $('threatsList');

  // ── TAB NAVIGATION ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panelId = btn.getAttribute('data-tab');
      $( panelId )?.classList.add('active');

      // Auto-start chatbot first message when Train tab opens
      if (panelId === 'panelTrain' && $('chatMessages').children.length <= 1) {
        startChatSession();
      }
    });
  });

  // ---- VIEW TOGGLE (Settings) ----
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
  // F2 — VISHING GUARD UI
  // ============================================================
  $('vishingAnalyzeBtn')?.addEventListener('click', async () => {
    const transcript = $('vishingInput')?.value?.trim();
    if (!transcript) {
      $('vishingInput').style.borderColor = 'rgba(255,71,87,0.5)';
      setTimeout(() => { $('vishingInput').style.borderColor = ''; }, 1500);
      return;
    }

    $('vishingLoading').style.display = 'block';
    $('vishingResult').style.display  = 'none';
    $('vishingAnalyzeBtn').disabled = true;
    $('vishingAnalyzeBtn').textContent = 'Analyzing…';

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'ANALYZE_VISHING',
        transcript,
      });
      renderVishingResult(result);
    } catch (err) {
      console.error('[Vishing] Analysis failed:', err);
    } finally {
      $('vishingLoading').style.display = 'none';
      $('vishingAnalyzeBtn').disabled = false;
      $('vishingAnalyzeBtn').textContent = '🔍 Analyze Call';
    }
  });

  function renderVishingResult(result) {
    if (!result) return;
    const el = $('vishingResult');
    const { riskScore, riskLevel, patterns = [], signals = [], summary } = result;

    // Colour scheme
    const colorMap = { SAFE: '#2ED573', MEDIUM: '#FFA502', HIGH: '#FF6B35', CRITICAL: '#FF4757' };
    const clsMap   = { SAFE: 'safe', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' };
    const color = colorMap[riskLevel] || '#FFA502';

    el.className = `vishing-result ${clsMap[riskLevel] || 'medium'}`;
    $('vishingRiskBadge').textContent = riskLevel;
    $('vishingRiskBadge').style.cssText = `background:${color}22;color:${color};border:1px solid ${color}44;`;
    $('vishingScore').textContent = `${riskScore}/100`;
    $('vishingScore').style.color = color;
    $('vishingSummary').textContent = summary || 'Analysis complete.';

    $('vishingPatterns').innerHTML = patterns.length
      ? patterns.map(p => `<span style="display:inline-block;font-size:10px;background:rgba(255,165,2,0.12);color:#FFA502;border:1px solid rgba(255,165,2,0.2);border-radius:8px;padding:1px 7px;margin:2px;">${p.replace(/_/g,' ')}</span>`).join('')
      : '';

    $('vishingSignals').innerHTML = signals.length
      ? `<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;">${signals.slice(0,4).map(s => `• ${s}`).join('<br>')}</div>`
      : '';

    el.style.display = 'block';
  }

  // ============================================================
  // F6 — AI TRAINING CHATBOT UI
  // ============================================================
  let chatHistory = [];
  let chatActive  = false;

  $('chatStart')?.addEventListener('click', () => {
    $('chatStart').style.display = 'none';
    startChatSession();
  });

  $('chatSend')?.addEventListener('click', () => sendChatMessage());
  $('chatInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });

  async function startChatSession() {
    if (chatActive) return;
    chatActive = true;
    chatHistory = [];

    $('chatInput').disabled  = false;
    $('chatSend').disabled   = false;
    $('chatStart').style.display = 'none';

    appendChatMsg('ai', '⏳ Loading your personalized quiz…');

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'TRAINING_CHAT',
        userMessage: '',
        history: [],
      });
      // Remove loading placeholder
      const msgs = $('chatMessages');
      msgs.lastChild?.remove();
      appendChatMsg('ai', result.reply);
      chatHistory.push({ role: 'ai', content: result.reply });
      if (result.score !== null && result.score !== undefined) showChatScore(result.score);
    } catch {
      appendChatMsg('ai', 'Could not connect to Gemini. Check your API key in Settings.');
    }
  }

  async function sendChatMessage() {
    const input = $('chatInput');
    const text  = input?.value?.trim();
    if (!text) return;

    input.value = '';
    appendChatMsg('user', text);
    chatHistory.push({ role: 'user', content: text });

    $('chatSend').disabled  = true;
    $('chatInput').disabled = true;
    appendChatMsg('ai', '⏳ Thinking…');

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'TRAINING_CHAT',
        userMessage: text,
        history: chatHistory.slice(-6),
      });
      $('chatMessages').lastChild?.remove(); // remove thinking placeholder
      appendChatMsg('ai', result.reply);
      chatHistory.push({ role: 'ai', content: result.reply });
      if (result.score !== null && result.score !== undefined) {
        showChatScore(result.score);
        $('chatSend').disabled  = true;
        $('chatInput').disabled = true;
        return;
      }
    } catch {
      $('chatMessages').lastChild?.remove();
      appendChatMsg('ai', 'Error connecting to AI. Try again.');
    }

    $('chatSend').disabled  = false;
    $('chatInput').disabled = false;
    $('chatInput').focus();
  }

  function appendChatMsg(role, text) {
    const msgs = $('chatMessages');
    const div  = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = text.replace(/\n/g, '<br>');
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showChatScore(score) {
    const el = $('chatScore');
    if (!el) return;
    const emoji = score >= 80 ? '🏆' : score >= 60 ? '✅' : '📚';
    el.textContent = `${emoji} Training Complete! Score: ${score}%`;
    el.style.display = 'block';
  }

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  function renderPageRisk(result) {
    if (!result) return;

    const { riskLevel, score, reasons, attackTypes: types } = result;

    const cls = riskLevel === 'SAFE' ? 'safe' : riskLevel === 'MEDIUM' ? 'warn' : riskLevel === 'HIGH' ? 'danger' : 'critical';
    riskBadge.className = 'risk-badge ' + cls;
    riskBadge.textContent = riskLevel;

    statusDot.className = 'status-dot ' + (riskLevel === 'SAFE' ? '' : riskLevel === 'MEDIUM' ? 'warning' : 'danger');

    pageRiskScore.textContent = score;
    pageRiskScore.style.color = score >= 75 ? '#FF4757' : score >= 40 ? '#FFA502' : '#2ED573';
    riskBarFill.style.width = score + '%';

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

    const score = state.vulnerabilityScore || 50;
    vulnScore.textContent = score;

    const pct = score / 100;
    const offset = 157 - (pct * 157);
    miniGaugeFill.style.strokeDashoffset = offset;

    const level = score >= 75 ? '⚠ High Risk' : score >= 50 ? '~ Moderate Risk' : score >= 25 ? '↑ Low Risk' : '✓ Very Low Risk';
    const color = score >= 75 ? '#FF4757' : score >= 50 ? '#FFA502' : score >= 25 ? '#FFA502' : '#2ED573';
    scoreLevel.textContent = level;
    scoreLevel.style.color = color;
    vulnScore.style.color  = color;

    if (state.modelVersion) modelVer.textContent = state.modelVersion;

    statBlocked.textContent  = state.stats?.threatsBlocked  || 0;
    statAnalyzed.textContent = state.stats?.urlsAnalyzed    || 0;
    statSessions.textContent = state.stats?.sessionsProtected || 1;

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
  $('saveApiKey')?.addEventListener('click', async () => {
    const key = $('apiKeyInput').value.trim();
    await chrome.storage.local.set({ apiKey: key });
    await chrome.runtime.sendMessage({ type: 'UPDATE_API_KEY', key });
    $('saveApiKey').textContent = '✓ Saved!';
    setTimeout(() => { $('saveApiKey').textContent = 'Save'; }, 2000);
  });

  $('syncAccountBtn')?.addEventListener('click', async () => {
    const orgId = $('orgIdInput').value.trim();
    const email = $('workerEmailInput').value.trim();
    
    if (!orgId || !email) {
      alert('Please enter both Company ID and Worker Email.');
      return;
    }

    await chrome.storage.local.set({ 
      profile: { orgId, email, displayName: email.split('@')[0] } 
    });

    $('syncAccountBtn').textContent = '✓ Synchronized!';
    $('syncAccountBtn').style.background = '#2ED573';
    setTimeout(() => { 
      $('syncAccountBtn').textContent = 'Sync Profile'; 
      $('syncAccountBtn').style.background = '';
    }, 2000);
  });

  async function loadSettings() {
    const data = await chrome.storage.local.get(['settings', 'apiKey', 'profile']);
    const s = data.settings || {};
    $('toggleOverlays').checked     = s.enableWarningOverlays !== false;
    $('toggleNotifs').checked       = s.enableNotifications   !== false;
    $('toggleSafeBrowsing').checked = s.enableSafeBrowsing    !== false;
    $('toggleFL').checked           = s.enableFL              !== false;
    $('togglePrivacy').checked      = s.privacyMode === true;
    if (data.apiKey)  $('apiKeyInput').value        = data.apiKey;
    if (data.profile) {
      $('orgIdInput').value       = data.profile.orgId  || '';
      $('workerEmailInput').value = data.profile.email  || '';
    }
  }

  ['toggleOverlays', 'toggleNotifs', 'toggleSafeBrowsing', 'toggleFL', 'togglePrivacy'].forEach(id => {
    $(id)?.addEventListener('change', saveSettings);
  });

  async function saveSettings() {
    await chrome.storage.local.set({
      settings: {
        enableWarningOverlays: $('toggleOverlays').checked,
        enableNotifications:   $('toggleNotifs').checked,
        enableSafeBrowsing:    $('toggleSafeBrowsing').checked,
        enableFL:              $('toggleFL').checked,
        privacyMode:           $('togglePrivacy').checked,
      }
    });
  }

});


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
  $('saveApiKey')?.addEventListener('click', async () => {
    const key = $('apiKeyInput').value.trim();
    await chrome.storage.local.set({ apiKey: key });
    // Send to background
    await chrome.runtime.sendMessage({ type: 'UPDATE_API_KEY', key });
    $('saveApiKey').textContent = '✓ Saved!';
    setTimeout(() => { $('saveApiKey').textContent = 'Save'; }, 2000);
  });

  // ---- Sync Profile ----
  $('syncAccountBtn')?.addEventListener('click', async () => {
    const orgId = $('orgIdInput').value.trim();
    const email = $('workerEmailInput').value.trim();
    
    if (!orgId || !email) {
      alert('Please enter both Company ID and Worker Email.');
      return;
    }

    await chrome.storage.local.set({ 
      profile: { 
        orgId, 
        email, 
        displayName: email.split('@')[0] 
      } 
    });

    $('syncAccountBtn').textContent = '✓ Synchronized!';
    $('syncAccountBtn').style.background = '#2ED573';
    setTimeout(() => { 
      $('syncAccountBtn').textContent = 'Sync Profile'; 
      $('syncAccountBtn').style.background = '';
    }, 2000);
  });

  async function loadSettings() {
    const data = await chrome.storage.local.get(['settings', 'apiKey', 'profile']);
    const s = data.settings || {};

    $('toggleOverlays').checked = s.enableWarningOverlays !== false;
    $('toggleNotifs').checked = s.enableNotifications !== false;
    $('toggleSafeBrowsing').checked = s.enableSafeBrowsing !== false;
    $('toggleFL').checked = s.enableFL !== false;
    $('togglePrivacy').checked = s.privacyMode === true;

    if (data.apiKey) $('apiKeyInput').value = data.apiKey;
    if (data.profile) {
      $('orgIdInput').value = data.profile.orgId || '';
      $('workerEmailInput').value = data.profile.email || '';
    }
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

});
