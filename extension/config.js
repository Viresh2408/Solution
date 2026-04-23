// TrustNet AI — Extension Configuration
// ⚠️  Values here are sourced from the root .env file
// ⚠️  DO NOT hardcode keys directly — update from .env
//
// How to update:
//   1. Open /.env (root of project)
//   2. Copy each value into the matching string below
//   3. Reload the extension at chrome://extensions
//
// Note: Chrome extensions cannot read .env files at runtime —
// this config.js is the "compiled" version of the .env for the extension.

export const CONFIG = {
  // ── Google Safe Browsing ──────────────────────────────────
  SAFE_BROWSING_API_KEY:  import.meta.env?.SAFE_BROWSING_API_KEY  || 'AIzaSyDL711R_bq6iTkkH9ZEA4oT2D8lcCPSZ3Y',
  SAFE_BROWSING_ENDPOINT: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',

  // ── VirusTotal ────────────────────────────────────────────
  VIRUSTOTAL_API_KEY:  import.meta.env?.VIRUSTOTAL_API_KEY  || 'f211adf9adb2f769a19fe9cb2bf6539607f8366df61bcd667f658e3c79d70f25',
  VIRUSTOTAL_ENDPOINT: 'https://www.virustotal.com/api/v3',

  // ── Google Gemini AI ──────────────────────────────────────
  GEMINI_API_KEY:  import.meta.env?.GEMINI_API_KEY  || 'AIzaSyDD_f4YfiKB89NtI0rtP5d8yKMHBEifphg',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',

  // ── AbuseIPDB ─────────────────────────────────────────────
  ABUSEIPDB_API_KEY:  import.meta.env?.ABUSEIPDB_API_KEY  || '118c04d60dbbff039923a924125ad9693ae63463553f88f05f7c39e767a69864d954dd19c19fcd8c',
  ABUSEIPDB_ENDPOINT: 'https://api.abuseipdb.com/api/v2',

  // ── Shodan ────────────────────────────────────────────────
  SHODAN_API_KEY:  import.meta.env?.SHODAN_API_KEY  || 'HbbqaPQbe9hkKFyRyFz8deNKbZFH7moF',
  SHODAN_ENDPOINT: 'https://api.shodan.io',

  // ── Cloudflare DNS-over-HTTPS (no key needed) ─────────────
  DOH_ENDPOINT: 'https://cloudflare-dns.com/dns-query',

  // ── Runtime settings ─────────────────────────────────────
  UPDATE_INTERVAL_MS:  30000,
  SCORE_DECAY_FACTOR:  0.95,
};
