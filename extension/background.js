// TrustNet AI — Background Service Worker (Manifest V3)
// Handles URL analysis, Safe Browsing API, vulnerability scoring, and state management

// ---- CONFIGURATION (loaded from extension/config.js → sourced from .env) ----
import { CONFIG } from './config.js';



// ---- STATE ----
let state = {
  vulnerabilityScore: 50,
  sessionThreats: [],
  pageRiskCache: new Map(),
  globalModelVersion: '1.0.0',
  lastUpdated: Date.now(),
};

// ---- INITIALIZATION ----
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[TrustNet] Installed/Updated:', details.reason);

  // Set default storage values
  await chrome.storage.local.set({
    vulnerabilityScore: 50,
    sessionThreats: [],
    settings: {
      enableNotifications: true,
      enableWarningOverlays: true,
      enableSafeBrowsing: true,
      warningThreshold: 40,
      privacyMode: false,
    },
    stats: {
      threatsBlocked: 0,
      urlsAnalyzed: 0,
      sessionsProtected: 1,
    }
  });

  // Open welcome page
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/welcome.html') });
  }
});

// ---- MESSAGE HANDLER ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'ANALYZE_URL':
      analyzeUrl(message.url, message.context).then(sendResponse);
      return true;

    case 'ANALYZE_EMAIL':
      analyzeEmailContent(message.content).then(sendResponse);
      return true;

    case 'GET_PAGE_RISK':
      getPageRisk(sender.tab?.url || '').then(sendResponse);
      return true;

    case 'REPORT_THREAT':
      reportThreat(message.threat, sender.tab).then(sendResponse);
      return true;

    case 'GET_STATE':
      getFullState().then(sendResponse);
      return true;

    case 'UPDATE_SCORE':
      updateVulnerabilityScore(message.delta, message.reason).then(sendResponse);
      return true;

    case 'LOG_INTERACTION':
      logInteraction(message.interaction).then(sendResponse);
      return true;

    case 'ANALYZE_PAGE_CONTENT':
      analyzePageContentWithGemini(message.text, message.url).then(sendResponse);
      return true;

    case 'REPORT_ACTIVITY':
      reportActivityToSupabase(message.activity).then(sendResponse);
      return true;
  }
});

/**
 * Reports risky activity to Supabase alerts table
 */
async function reportActivityToSupabase(activity) {
  const { vulnerabilityScore } = await chrome.storage.local.get(['vulnerabilityScore']);
  const profile = await chrome.storage.local.get(['profile']);
  
  const orgId = profile?.profile?.orgId || 'apex-financial';
  const email = profile?.profile?.email || 'worker@trustnet.ai';
  const name  = profile?.profile?.displayName || 'TrustNet Worker';

  const alertData = {
    orgId: orgId,
    type: activity.type === 'RISKY_SEARCH' ? 'Policy Violation' : 'Fraud Attempt',
    severity: activity.severity || 'high',
    detail: activity.detail,
    user: name,
    dept: 'Operations', // Default
    blocked: true,
    status: 'active',
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/alerts`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(alertData)
    });

    if (res.ok) {
      console.log('[TrustNet] Activity reported to owner successfully.');
      
      // Also update the local vulnerability score
      const newScore = Math.min(100, (vulnerabilityScore || 50) + (activity.severity === 'critical' ? 15 : 5));
      await chrome.storage.local.set({ vulnerabilityScore: newScore });
      
      // Update employee risk score in DB
      await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/employees?name=eq.${encodeURIComponent(name)}`, {
        method: 'PATCH',
        headers: {
          'apikey': CONFIG.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riskScore: newScore })
      });
    }
  } catch (err) {
    console.error('[TrustNet] Failed to report activity:', err);
  }
}

// ---- TAB EVENTS ----
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Run automatic analysis on page load
    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      analyzeUrl(tab.url, { trigger: 'pageload', tabId }).then(result => {
        if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
          // Badge the icon
          chrome.action.setBadgeText({ text: '!', tabId });
          chrome.action.setBadgeBackgroundColor({ color: '#FF4757', tabId });
        } else if (result.riskLevel === 'MEDIUM') {
          chrome.action.setBadgeText({ text: '~', tabId });
          chrome.action.setBadgeBackgroundColor({ color: '#FFA502', tabId });
        } else {
          chrome.action.setBadgeText({ text: '✓', tabId });
          chrome.action.setBadgeBackgroundColor({ color: '#2ED573', tabId });
        }
      });
    }
  }
});

// ============================================================
// CORE ANALYSIS ENGINE
// ============================================================

/**
 * Analyzes a URL using Google Safe Browsing + local NLP heuristics
 */
async function analyzeUrl(url, context = {}) {
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return { riskLevel: 'SAFE', score: 0, reasons: [], url };
  }

  const cacheKey = url;
  const cached = state.pageRiskCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.result;
  }

  const results = await Promise.allSettled([
    checkSafeBrowsing(url),
    analyzeUrlHeuristics(url),
    checkDomainReputation(url),
    checkIpReputation(url),    // AbuseIPDB — abuse history + ISP reputation
    checkShodanHost(url),      // Shodan    — open ports, CVEs, malware tags
  ]);

  const safeBrowsingResult = results[0].status === 'fulfilled' ? results[0].value : { threatTypes: [], score: 0 };
  const heuristicResult    = results[1].status === 'fulfilled' ? results[1].value : { score: 0, signals: [] };
  const domainResult       = results[2].status === 'fulfilled' ? results[2].value : { score: 0, signals: [] };
  const ipAbuseResult      = results[3].status === 'fulfilled' ? results[3].value : { score: 0, signals: [] };
  const shodanResult       = results[4].status === 'fulfilled' ? results[4].value : { score: 0, signals: [] };

  // ── Scoring weights (totals 100%)
  //  Safe Browsing  35%  — authoritative Google threat feed
  //  VirusTotal     25%  — 70+ AV engine consensus
  //  AbuseIPDB      15%  — community-reported IP abuse history
  //  Shodan         15%  — infrastructure exposure & CVE intelligence
  //  Heuristics     10%  — local NLP signals (fast, offline)
  const combinedScore = Math.min(100,
    safeBrowsingResult.score * 0.35 +
    domainResult.score       * 0.25 +
    ipAbuseResult.score      * 0.15 +
    shodanResult.score       * 0.15 +
    heuristicResult.score    * 0.10
  );

  const riskLevel = combinedScore >= 75 ? 'CRITICAL'
    : combinedScore >= 50 ? 'HIGH'
    : combinedScore >= 25 ? 'MEDIUM'
    : 'SAFE';

  const reasons = [
    ...safeBrowsingResult.threatTypes.map(t => `Safe Browsing: ${formatThreatType(t)}`),
    ...heuristicResult.signals,
    ...domainResult.signals,
    ...ipAbuseResult.signals,
    ...shodanResult.signals,
  ];

  const result = {
    url,
    riskLevel,
    score: Math.round(combinedScore),
    reasons,
    attackTypes: classifyAttackTypes(reasons, url),
    timestamp: Date.now(),
    context,
  };

  // Update cache
  state.pageRiskCache.set(cacheKey, { result, timestamp: Date.now() });

  // Update stats
  const data = await chrome.storage.local.get(['stats']);
  await chrome.storage.local.set({
    stats: { ...data.stats, urlsAnalyzed: (data.stats?.urlsAnalyzed || 0) + 1 }
  });

  return result;
}

/**
 * Google Safe Browsing v4 API Check
 */
async function checkSafeBrowsing(url) {
  if (!CONFIG.SAFE_BROWSING_API_KEY || CONFIG.SAFE_BROWSING_API_KEY === 'YOUR_GOOGLE_CLOUD_API_KEY_HERE') {
    // Fallback: heuristic only
    return { threatTypes: [], score: 0 };
  }

  try {
    const response = await fetch(`${CONFIG.SAFE_BROWSING_ENDPOINT}?key=${CONFIG.SAFE_BROWSING_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: { clientId: 'trustnet-ai', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      })
    });

    const data = await response.json();
    if (data.matches && data.matches.length > 0) {
      const threatTypes = data.matches.map(m => m.threatType);
      return { threatTypes, score: 90 };
    }
    return { threatTypes: [], score: 0 };
  } catch (err) {
    console.error('[TrustNet] Safe Browsing API error:', err);
    return { threatTypes: [], score: 0 };
  }
}

/**
 * Local NLP heuristic analysis of URL
 */
async function analyzeUrlHeuristics(url) {
  const signals = [];
  let score = 0;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();
    const path = urlObj.pathname.toLowerCase();

    // --- Domain Analysis ---
    // Check for excessive subdomains
    const subdomains = domain.split('.').length - 2;
    if (subdomains > 3) { signals.push('Excessive subdomain depth'); score += 20; }

    // Check for IP address as host
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) { signals.push('IP address used as domain'); score += 35; }

    // Check for brand impersonation in domain
    const brands = ['paypal', 'amazon', 'google', 'apple', 'microsoft', 'netflix', 'bank', 'hdfc', 'sbi', 'icici', 'rbi', 'irdai', 'trai', 'jio', 'airtel'];
    const tld = domain.split('.').slice(-2).join('.');
    brands.forEach(brand => {
      if (domain.includes(brand) && !domain.endsWith(brand + '.com') && !domain.endsWith(brand + '.co.in') && !domain.endsWith(brand + '.in')) {
        signals.push(`Brand impersonation: "${brand}" in domain`);
        score += 45;
      }
    });

    // Homograph/typosquatting detection
    const homoglyphs = { '0': 'o', '1': 'l', '4': 'a', '5': 's', '3': 'e', '@': 'a' };
    let normalizedDomain = domain;
    Object.entries(homoglyphs).forEach(([num, char]) => {
      normalizedDomain = normalizedDomain.replace(new RegExp(num, 'g'), char);
    });
    brands.forEach(brand => {
      if (normalizedDomain.includes(brand) && !domain.includes(brand)) {
        signals.push('Possible typosquatting/homograph attack');
        score += 50;
      }
    });

    // HTTP (not HTTPS)
    if (urlObj.protocol === 'http:' && !domain.includes('localhost')) {
      signals.push('Insecure HTTP connection');
      score += 15;
    }

    // Suspicious TLDs
    const suspiciousTlds = ['.xyz', '.top', '.click', '.loan', '.work', '.gq', '.ml', '.cf', '.tk', '.pw', '.download'];
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      signals.push('High-risk TLD domain extension');
      score += 25;
    }

    // --- URL Structure Analysis ---
    // Very long URL
    if (url.length > 200) { signals.push('Unusually long URL (obfuscation)'); score += 15; }

    // Excessive parameters (often data harvesting)
    if (urlObj.searchParams.toString().length > 200) { signals.push('Excessive query parameters'); score += 10; }

    // Redirect patterns
    if (fullUrl.includes('redirect=') || fullUrl.includes('url=http') || fullUrl.includes('return=http')) {
      signals.push('URL redirect pattern detected');
      score += 20;
    }

    // Suspicious path keywords
    const suspiciousPaths = ['verify', 'login', 'secure', 'update', 'confirm', 'account', 'suspended', 'unlock', 'kyc', 'otp', 'win', 'prize', 'claim'];
    suspiciousPaths.forEach(kw => {
      if (path.includes(kw)) {
        signals.push(`Sensitive path keyword: "${kw}"`);
        score += 8;
      }
    });

    score = Math.min(100, score);
  } catch (err) {
    console.error('[TrustNet] URL parse error:', err);
  }

  return { score, signals };
}

/**
 * Domain reputation check via VirusTotal API
 * Falls back to local heuristics if API fails or is rate-limited
 */
async function checkDomainReputation(url) {
  const signals = [];
  let score = 0;

  // --- VirusTotal URL Reputation Check ---
  try {
    // VT requires the URL to be base64url-encoded (no padding)
    const urlId = btoa(url).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const res = await fetch(`${CONFIG.VIRUSTOTAL_ENDPOINT}/urls/${urlId}`, {
      headers: { 'x-apikey': CONFIG.VIRUSTOTAL_API_KEY }
    });

    if (res.ok) {
      const data = await res.json();
      const stats = data.data?.attributes?.last_analysis_stats || {};
      const malicious  = stats.malicious  || 0;
      const suspicious = stats.suspicious || 0;
      const total      = (stats.harmless || 0) + malicious + suspicious + (stats.undetected || 0);

      if (malicious > 0) {
        signals.push(`VirusTotal: ${malicious} of ${total} engines flagged as malicious`);
        score += Math.min(80, malicious * 8);
      }
      if (suspicious > 0) {
        signals.push(`VirusTotal: ${suspicious} engines flagged as suspicious`);
        score += Math.min(30, suspicious * 5);
      }

      // Community reputation score (negative = bad)
      const rep = data.data?.attributes?.reputation || 0;
      if (rep < -5) {
        signals.push(`VirusTotal community reputation: ${rep}`);
        score += Math.min(25, Math.abs(rep));
      }

      // Last analysis categories
      const categories = data.data?.attributes?.categories || {};
      const badCats = Object.values(categories).filter(c =>
        ['phishing', 'malware', 'spam', 'scam', 'fraud'].some(k => c.toLowerCase().includes(k))
      );
      if (badCats.length > 0) {
        signals.push(`VirusTotal category: ${badCats[0]}`);
        score += 30;
      }

      console.log(`[TrustNet] VirusTotal result for ${url}: malicious=${malicious}, suspicious=${suspicious}`);
    } else if (res.status === 404) {
      // URL not yet in VT database — submit it for analysis
      submitUrlToVirusTotal(url);
    }
  } catch (err) {
    console.warn('[TrustNet] VirusTotal API error, falling back to heuristics:', err.message);

    // --- Fallback: Local Heuristics ---
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Newly registered domain patterns
      if (domain.match(/[a-z0-9]{15,}\.(com|net|org|xyz)$/)) {
        signals.push('Domain pattern matches newly-registered domain signature');
        score += 20;
      }

      // DGA-like random subdomain
      const subdomain = domain.split('.').slice(0, -2).join('.');
      const consonants = subdomain.replace(/[aeiou]/g, '').length;
      const vowels = subdomain.replace(/[^aeiou]/g, '').length;
      if (subdomain.length > 12 && consonants > vowels * 2.5) {
        signals.push('DGA-like random subdomain detected');
        score += 30;
      }
    } catch {}
  }

  return { score: Math.min(100, score), signals };
}

/**
 * Submit unknown URL to VirusTotal for analysis (fire-and-forget)
 */
async function submitUrlToVirusTotal(url) {
  try {
    const formData = new URLSearchParams();
    formData.append('url', url);
    await fetch(`${CONFIG.VIRUSTOTAL_ENDPOINT}/urls`, {
      method: 'POST',
      headers: {
        'x-apikey': CONFIG.VIRUSTOTAL_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    console.log('[TrustNet] Submitted unknown URL to VirusTotal for analysis:', url);
  } catch (err) {
    console.warn('[TrustNet] VT submission failed:', err.message);
  }
}

/**
 * IP Reputation check via AbuseIPDB
 * Resolves domain → IP via Cloudflare DNS-over-HTTPS, then checks AbuseIPDB
 */
async function checkIpReputation(url) {
  const signals = [];
  let score = 0;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Skip private/localhost addresses
    if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
      return { score: 0, signals: [] };
    }

    // Resolve hostname to IP (skip if it's already an IP)
    const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
    const ip = isIpv4 ? hostname : await resolveHostToIp(hostname);

    if (!ip) return { score: 0, signals: [] };

    const abuseResult = await checkAbuseIPDB(ip);
    if (!abuseResult) return { score: 0, signals: [] };

    const { abuseConfidenceScore, totalReports, usageType, isp, domain: ipDomain, countryCode } = abuseResult;

    // Abuse confidence score (0–100 from AbuseIPDB)
    if (abuseConfidenceScore > 0) {
      score += Math.round(abuseConfidenceScore * 0.8); // scale to our 0–100 range
      signals.push(`AbuseIPDB: ${abuseConfidenceScore}% abuse confidence (${totalReports} reports)`);
    }

    // Flag suspicious ISPs / hosting types
    const suspiciousUsageTypes = ['Data Center/Web Hosting/Transit', 'Reserved', 'Tor Proxy'];
    if (suspiciousUsageTypes.includes(usageType)) {
      signals.push(`Hosted on suspicious infrastructure: ${usageType}`);
      score += 15;
    }

    // High-risk countries (extend list as needed)
    if (abuseConfidenceScore > 20) {
      signals.push(`Malicious IP (${countryCode}) via ${isp || ipDomain || 'unknown'}`);
    }

    console.log(`[TrustNet] AbuseIPDB: ${ip} → abuse=${abuseConfidenceScore}% reports=${totalReports}`);
  } catch (err) {
    console.warn('[TrustNet] AbuseIPDB check failed:', err.message);
  }

  return { score: Math.min(100, score), signals };
}

/**
 * Resolve a hostname to its first A-record IP using Cloudflare DNS-over-HTTPS
 * Privacy-preserving: queries are encrypted, no ISP snooping
 */
async function resolveHostToIp(hostname) {
  try {
    const res = await fetch(
      `${CONFIG.DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=A`,
      { headers: { Accept: 'application/dns-json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Find first A record
    const aRecord = (data.Answer || []).find(r => r.type === 1);
    return aRecord?.data || null;
  } catch {
    return null;
  }
}

/**
 * Query AbuseIPDB v2 Check endpoint for an IP address
 */
async function checkAbuseIPDB(ip) {
  try {
    const params = new URLSearchParams({
      ipAddress:    ip,
      maxAgeInDays: '90',
      verbose:      '',
    });

    const res = await fetch(`${CONFIG.ABUSEIPDB_ENDPOINT}/check?${params}`, {
      headers: {
        Key:    CONFIG.ABUSEIPDB_API_KEY,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('[TrustNet] AbuseIPDB returned', res.status, 'for IP:', ip);
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('[TrustNet] AbuseIPDB fetch error:', err.message);
    return null;
  }
}

/**
 * Shodan Host Intelligence
 * Resolves domain → IP → Shodan host lookup
 * Extracts: open ports, CVEs, malware/botnet tags, dangerous services
 */
async function checkShodanHost(url) {
  const signals = [];
  let score = 0;

  // Dangerous ports that should never be open on a web server
  const DANGEROUS_PORTS = {
    21:   'FTP exposed (credential theft risk)',
    22:   'SSH exposed (brute-force target)',
    23:   'Telnet exposed (unencrypted remote access)',
    25:   'SMTP exposed (spam relay risk)',
    445:  'SMB exposed (ransomware / EternalBlue vector)',
    1433: 'MSSQL exposed (data exfiltration risk)',
    3306: 'MySQL exposed (data exfiltration risk)',
    3389: 'RDP exposed (ransomware delivery / lateral movement)',
    5900: 'VNC exposed (remote desktop takeover)',
    6379: 'Redis exposed (unauthenticated access)',
    27017:'MongoDB exposed (unauthenticated access)',
  };

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
      return { score: 0, signals: [] };
    }

    // Resolve hostname to IP (reuse existing DoH resolver)
    const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
    const ip = isIpv4 ? hostname : await resolveHostToIp(hostname);
    if (!ip) return { score: 0, signals: [] };

    // Shodan host lookup
    const res = await fetch(
      `${CONFIG.SHODAN_ENDPOINT}/shodan/host/${ip}?key=${CONFIG.SHODAN_API_KEY}`,
      { headers: { Accept: 'application/json' } }
    );

    if (res.status === 404) {
      // IP not in Shodan index — not necessarily bad, just unknown
      console.log(`[TrustNet] Shodan: ${ip} not in index`);
      return { score: 0, signals: [] };
    }

    if (!res.ok) {
      console.warn('[TrustNet] Shodan returned', res.status);
      return { score: 0, signals: [] };
    }

    const data = await res.json();

    // ── 1. Open dangerous ports ──
    const openPorts = data.ports || [];
    const dangerousOpen = openPorts.filter(p => p in DANGEROUS_PORTS);
    if (dangerousOpen.length > 0) {
      dangerousOpen.forEach(p => {
        signals.push(`Shodan: Port ${p} open — ${DANGEROUS_PORTS[p]}`);
        score += p === 445 || p === 3389 ? 25 : 15; // higher weight for critical ports
      });
    }

    // ── 2. Known CVEs ──
    const vulns = data.vulns || {};
    const cveList = Object.keys(vulns);
    if (cveList.length > 0) {
      const critical = cveList.filter(cve => (vulns[cve]?.cvss || 0) >= 9.0);
      const high     = cveList.filter(cve => (vulns[cve]?.cvss || 0) >= 7.0 && (vulns[cve]?.cvss || 0) < 9.0);
      if (critical.length > 0) {
        signals.push(`Shodan: ${critical.length} CRITICAL CVE(s) — ${critical.slice(0,2).join(', ')}`);
        score += Math.min(50, critical.length * 20);
      }
      if (high.length > 0) {
        signals.push(`Shodan: ${high.length} HIGH severity CVE(s)`);
        score += Math.min(25, high.length * 10);
      }
    }

    // ── 3. Malware / botnet / phishing tags ──
    const tags = data.tags || [];
    const malTags = tags.filter(t =>
      ['malware', 'botnet', 'phishing', 'scanner', 'c2', 'tor', 'honeypot'].includes(t.toLowerCase())
    );
    if (malTags.length > 0) {
      signals.push(`Shodan tags: ${malTags.join(', ')}`);
      score += Math.min(40, malTags.length * 20);
    }

    // ── 4. Banner / service info ──
    const org = data.org || '';
    const country = data.country_name || '';
    console.log(
      `[TrustNet] Shodan: ${ip} (${org}, ${country}) ` +
      `ports=${openPorts.length} cves=${cveList.length} tags=${tags.join(',')}`
    );

    if (score > 0) {
      signals.unshift(`Shodan host: ${ip} — ${org || 'Unknown org'} (${country})`);
    }

  } catch (err) {
    console.warn('[TrustNet] Shodan check failed:', err.message);
  }

  return { score: Math.min(100, score), signals };
}

/**
 * Email content analysis — powered by Gemini AI
 * Falls back to keyword heuristics if API is unavailable
 */
async function analyzeEmailContent(content) {
  // --- PRIMARY: Gemini AI Analysis ---
  try {
    const emailText = `Subject: ${content.subject}\n\nBody:\n${content.body}`;
    const truncated = emailText.slice(0, 4000); // stay within token limits

    const prompt = `You are a cybersecurity AI specializing in social engineering and phishing detection.

Analyze the following email and return a JSON object ONLY (no markdown, no explanation) with this exact structure:
{
  "riskScore": <integer 0-100>,
  "riskLevel": <"SAFE" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "signals": [<list of specific threat signals found, as short strings>],
  "attackTypes": [<list from: "PHISHING", "BEC", "MANIPULATION", "IMPERSONATION", "CREDENTIAL_HARVEST", "MALWARE">],
  "cognitivebiases": [<list from: "URGENCY", "AUTHORITY", "FEAR", "SCARCITY", "SOCIAL_PROOF", "RECIPROCITY">],
  "summary": <one sentence explanation>
}

Email to analyze:
${truncated}`;

    const res = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,      // low temp = consistent, factual output
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleaned);

      console.log('[TrustNet] Gemini email analysis:', result.summary);

      return {
        score:       Math.min(100, Math.max(0, result.riskScore || 0)),
        riskLevel:   result.riskLevel || 'SAFE',
        signals:     result.signals   || [],
        attackTypes: result.attackTypes || [],
        cognitiveBiases: result.cognitivebiases || [],
        summary:     result.summary   || '',
        engine:      'gemini',
      };
    }
  } catch (err) {
    console.warn('[TrustNet] Gemini email analysis failed, using heuristics:', err.message);
  }

  // --- FALLBACK: Keyword Heuristics ---
  const signals = [];
  let score = 0;
  const text = (content.subject + ' ' + content.body).toLowerCase();

  const urgencyPhrases = [
    'immediately', 'urgent', 'act now', 'expires in', 'within 24 hours',
    'account suspended', 'limited time', 'final notice', 'last chance',
    'verify immediately', 'suspended', 'locked', 'blocked'
  ];
  const urgencyCount = urgencyPhrases.filter(p => text.includes(p)).length;
  if (urgencyCount > 0) {
    signals.push(`Urgency manipulation detected (${urgencyCount} markers)`);
    score += Math.min(40, urgencyCount * 12);
  }

  const authorityPatterns = [
    'rbi', 'trai', 'income tax department', 'irs', 'fbi',
    'ceo', 'cfo', 'board of directors', 'hr department',
    'your bank', 'support team', 'security team', 'help desk'
  ];
  const authCount = authorityPatterns.filter(p => text.includes(p)).length;
  if (authCount > 0) {
    signals.push('Authority figure impersonation detected');
    score += Math.min(35, authCount * 15);
  }

  const fearPatterns = [
    'legal action', 'lawsuit', 'arrest', 'criminal charges',
    'account deleted', 'lose access', 'freeze your account', 'penalty', 'deactivated'
  ];
  const fearCount = fearPatterns.filter(p => text.includes(p)).length;
  if (fearCount > 0) {
    signals.push(`Fear/threat manipulation (${fearCount} markers)`);
    score += Math.min(35, fearCount * 15);
  }

  const dataRequestPatterns = ['otp', 'password', 'pin', 'cvv', 'card number', 'bank account', 'aadhaar', 'pan number'];
  const dataCount = dataRequestPatterns.filter(p => text.includes(p)).length;
  if (dataCount > 0) {
    signals.push('Request for sensitive credentials/data');
    score += Math.min(45, dataCount * 20);
  }

  if (content.hasAttachments && ['invoice', 'payment', 'receipt', 'urgent', 'document'].some(w => text.includes(w))) {
    signals.push('Suspicious attachment with financial trigger words');
    score += 25;
  }

  score = Math.min(100, score);
  const riskLevel = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'SAFE';
  return { score, riskLevel, signals, attackTypes: classifyAttackTypes(signals, ''), engine: 'heuristic' };
}

/**
 * Analyse visible page text content using Gemini AI
 * Called from content.js via ANALYZE_PAGE_CONTENT message
 */
async function analyzePageContentWithGemini(pageText, url) {
  try {
    const truncated = pageText.slice(0, 3000);
    const prompt = `You are a cybersecurity AI. Analyze the following webpage content for social engineering, phishing, or manipulation tactics.

Return JSON ONLY:
{
  "riskScore": <0-100>,
  "riskLevel": <"SAFE"|"MEDIUM"|"HIGH"|"CRITICAL">,
  "signals": [<specific threat signals>],
  "attackTypes": [<"PHISHING"|"BEC"|"MANIPULATION"|"IMPERSONATION"|"SCAM">],
  "summary": <one sentence>
}

Page URL: ${url}
Page content:
${truncated}`;

    const res = await fetch(`${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 400, responseMimeType: 'application/json' }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const result = JSON.parse(raw.replace(/```json|```/g, '').trim());
      console.log('[TrustNet] Gemini page analysis:', result.summary);
      return result;
    }
  } catch (err) {
    console.warn('[TrustNet] Gemini page analysis failed:', err.message);
  }
  return null;
}

/**
 * Classify detected attack types from signals
 */
function classifyAttackTypes(signals, url) {
  const types = new Set();
  const combined = (signals.join(' ') + ' ' + url).toLowerCase();

  if (combined.includes('impersonation') || combined.includes('authority') || combined.includes('brand')) types.add('IMPERSONATION');
  if (combined.includes('otp') || combined.includes('phishing') || combined.includes('credential')) types.add('PHISHING');
  if (combined.includes('urgency') || combined.includes('fear') || combined.includes('threat')) types.add('MANIPULATION');
  if (combined.includes('bec') || combined.includes('ceo') || combined.includes('wire transfer')) types.add('BEC');
  if (combined.includes('malware') || combined.includes('unwanted software')) types.add('MALWARE');
  if (combined.includes('social engineering')) types.add('SOCIAL_ENGINEERING');
  if (combined.includes('redirect')) types.add('REDIRECT_ATTACK');

  return Array.from(types);
}

/**
 * Format Safe Browsing threat type to human-readable
 */
function formatThreatType(type) {
  const map = {
    'MALWARE': 'Malware Distribution Site',
    'SOCIAL_ENGINEERING': 'Social Engineering / Phishing',
    'UNWANTED_SOFTWARE': 'Unwanted Software',
    'POTENTIALLY_HARMFUL_APPLICATION': 'Harmful Application',
  };
  return map[type] || type;
}

/**
 * Get full analysis for current page
 */
async function getPageRisk(url) {
  if (!url) return { riskLevel: 'SAFE', score: 0, reasons: [] };
  return await analyzeUrl(url, { trigger: 'popup' });
}

/**
 * Report a threat (updates local state + could forward to CERT)
 */
async function reportThreat(threat, tab) {
  const data = await chrome.storage.local.get(['sessionThreats', 'stats']);
  const threats = data.sessionThreats || [];
  threats.push({ ...threat, reportedAt: Date.now(), tabUrl: tab?.url });

  const stats = data.stats || {};
  stats.threatsBlocked = (stats.threatsBlocked || 0) + 1;

  await chrome.storage.local.set({ sessionThreats: threats, stats });

  // Show notification
  const settings = (await chrome.storage.local.get(['settings'])).settings || {};
  if (settings.enableNotifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'TrustNet AI — Threat Blocked',
      message: `${threat.type || 'Suspicious activity'} blocked. ${threat.url || ''}`,
      priority: 2,
    });
  }

  // Federated Learning: log this interaction (privacy-safe)
  await logInteraction({ type: 'THREAT_BLOCKED', attackType: threat.type, riskScore: threat.score });

  return { success: true };
}

/**
 * Update vulnerability score (RL adaptive system simulation)
 */
async function updateVulnerabilityScore(delta, reason) {
  const data = await chrome.storage.local.get(['vulnerabilityScore']);
  let score = data.vulnerabilityScore || 50;
  score = Math.max(0, Math.min(100, score + delta));
  await chrome.storage.local.set({ vulnerabilityScore: score });
  state.vulnerabilityScore = score;
  return { score, reason };
}

/**
 * Get full state for popup
 */
async function getFullState() {
  const data = await chrome.storage.local.get(['vulnerabilityScore', 'sessionThreats', 'stats', 'settings']);
  return {
    vulnerabilityScore: data.vulnerabilityScore || 50,
    sessionThreats: (data.sessionThreats || []).slice(-10),
    stats: data.stats || {},
    settings: data.settings || {},
    modelVersion: state.globalModelVersion,
  };
}

/**
 * Privacy-preserving interaction logging (simulates FL client)
 * Only logs behavioral patterns — never content
 */
async function logInteraction(interaction) {
  // In production: this would compute local gradient updates
  // and transmit encrypted, differentially-private gradients to aggregation server
  const entry = {
    type: interaction.type,
    attackType: interaction.attackType,
    riskLevel: interaction.riskLevel,
    timestamp: Date.now(),
    // NO URL, NO DOMAIN, NO USER DATA
  };

  const data = await chrome.storage.local.get(['interactionLog']);
  const log = (data.interactionLog || []).slice(-100); // Keep last 100
  log.push(entry);
  await chrome.storage.local.set({ interactionLog: log });
}

// ---- PERIODIC MODEL UPDATE (simulated) ----
setInterval(async () => {
  // Simulate receiving model update from FL server
  const data = await chrome.storage.local.get(['vulnerabilityScore']);
  let score = data.vulnerabilityScore || 50;

  // Apply score decay (RL: safe behavior improves score over time)
  score = Math.max(10, Math.round(score * CONFIG.SCORE_DECAY_FACTOR + 50 * (1 - CONFIG.SCORE_DECAY_FACTOR)));
  await chrome.storage.local.set({ vulnerabilityScore: score });
  state.vulnerabilityScore = score;
}, CONFIG.UPDATE_INTERVAL_MS);

console.log('[TrustNet AI] Background service worker initialized. Privacy-preserving protection active.');
