// TrustNet AI — Landing Page JavaScript

document.addEventListener('DOMContentLoaded', () => {

  // ---- NAV SCROLL EFFECT ----
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });

  // ---- MOBILE NAV TOGGLE ----
  const navToggle = document.getElementById('navToggle');
  navToggle?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('mobile-open');
  });

  // ---- INTERSECTION OBSERVER for fade-up ----
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.classList.add('visible');
        observer.unobserve(el.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.feature-card, .flow-step, .stat-item, .tax-card, .privacy-badge').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });

  // ---- COUNTER ANIMATION ----
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stat = entry.target;
        const counterEl = stat.querySelector('.counter, .counter-b');
        if (!counterEl) return;
        const target = parseInt(stat.dataset.val);
        const isB = counterEl.classList.contains('counter-b');
        const duration = 2000;
        const start = performance.now();

        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const val = Math.round(ease * (isB ? 3.4 : target));
          counterEl.textContent = isB ? val.toFixed(1) : val;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(stat);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-item').forEach(el => counterObserver.observe(el));

  // ---- TAX BAR ANIMATION ----
  const taxObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.tax-fill').forEach(bar => {
          const width = bar.style.width;
          bar.style.width = '0%';
          setTimeout(() => { bar.style.width = width; }, 100);
        });
        taxObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  const taxGrid = document.querySelector('.taxonomy-grid');
  if (taxGrid) taxObserver.observe(taxGrid);

  // ---- VULNERABILITY SCORE DEMO ----
  let currentScore = 24;
  let targetScore = 24;
  const scoreNumber = document.getElementById('scoreNumber');
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeNeedle = document.getElementById('gaugeNeedle');
  const scoreCard = document.getElementById('scoreCard');

  const scenarios = [
    {
      score: 24, status: 'PROTECTED', statusClass: 'safe', color: '#2ED573',
      ticker: '✓ No threats detected on current page',
      factors: [78, 42, 31],
      factorColors: ['#2ED573', '#FFA502', '#2ED573']
    },
    {
      score: 78, status: 'AT RISK', statusClass: 'danger', color: '#FF4757',
      ticker: '⚠ Phishing attempt detected — urgency manipulation',
      factors: [32, 88, 71],
      factorColors: ['#FF4757', '#FF4757', '#FF4757']
    },
    {
      score: 51, status: 'CAUTION', statusClass: 'danger', color: '#FFA502',
      ticker: '🔍 Authority impersonation pattern detected',
      factors: [55, 65, 44],
      factorColors: ['#FFA502', '#FF4757', '#FFA502']
    },
    {
      score: 18, status: 'PROTECTED', statusClass: 'safe', color: '#2ED573',
      ticker: '✓ Suspicious email analyzed — threat neutralized',
      factors: [82, 28, 15],
      factorColors: ['#2ED573', '#2ED573', '#2ED573']
    }
  ];

  let scenarioIndex = 0;

  function updateGauge(score) {
    // Arc length = 251 (full semicircle). Offset 251 = empty, 0 = full.
    const pct = score / 100;
    const offset = 251 - (pct * 251);
    if (gaugeFill) gaugeFill.style.strokeDashoffset = offset;

    // Needle: arc goes from left (x=20,y=100) to right (x=180,y=100), center (100,100), r=80
    // angle: -180deg (left) to 0deg (right)
    const angleDeg = -180 + pct * 180;
    const angleRad = (angleDeg * Math.PI) / 180;
    const nx = 100 + 80 * Math.cos(angleRad);
    const ny = 100 + 80 * Math.sin(angleRad);
    if (gaugeNeedle) {
      gaugeNeedle.setAttribute('cx', nx.toFixed(1));
      gaugeNeedle.setAttribute('cy', ny.toFixed(1));
    }
  }

  function applyScenario(s) {
    if (scoreNumber) {
      scoreNumber.textContent = s.score;
      scoreNumber.style.color = s.color;
    }
    updateGauge(s.score);

    const statusEl = scoreCard?.querySelector('.score-status');
    if (statusEl) {
      statusEl.textContent = s.status;
      statusEl.className = 'score-status ' + s.statusClass;
    }

    const ticker = scoreCard?.querySelector('.score-ticker .ticker-item');
    if (ticker) ticker.textContent = s.ticker;

    const fills = scoreCard?.querySelectorAll('.factor-fill');
    const pcts = scoreCard?.querySelectorAll('.factor-pct');
    if (fills) {
      fills.forEach((f, i) => {
        f.style.width = s.factors[i] + '%';
        f.style.background = s.factorColors[i];
        if (pcts) pcts[i].textContent = s.factors[i] + '%';
      });
    }
  }

  // Animate gauge on load
  setTimeout(() => {
    updateGauge(0);
    setTimeout(() => {
      applyScenario(scenarios[0]);
    }, 300);
  }, 500);

  // Cycle through scenarios
  setInterval(() => {
    scenarioIndex = (scenarioIndex + 1) % scenarios.length;
    applyScenario(scenarios[scenarioIndex]);
  }, 4000);

  // ---- ALERT CARD ANIMATION ----
  const alertCard = document.getElementById('alertCard');
  const alertTexts = [
    { icon: '⚠️', title: 'Phishing Detected', desc: 'Urgency manipulation + spoofed domain', badge: 'HIGH', cls: 'danger' },
    { icon: '🔑', title: 'OTP Interlock', desc: 'OTP arrival during active suspicious call', badge: 'CRITICAL', cls: 'danger' },
    { icon: '✅', title: 'Safe Domain', desc: 'SSL verified, no suspicious patterns', badge: 'SAFE', cls: 'safe' },
    { icon: '📞', title: 'Vishing Pattern', desc: 'Known scam number detected', badge: 'HIGH', cls: 'danger' },
  ];
  let alertIdx = 0;

  setInterval(() => {
    alertIdx = (alertIdx + 1) % alertTexts.length;
    const a = alertTexts[alertIdx];
    if (alertCard) {
      alertCard.querySelector('.alert-icon').textContent = a.icon;
      alertCard.querySelector('.alert-title').textContent = a.title;
      alertCard.querySelector('.alert-desc').textContent = a.desc;
      const badge = alertCard.querySelector('.alert-badge');
      badge.textContent = a.badge;
      badge.className = 'alert-badge ' + a.cls;
      alertCard.style.borderColor = a.cls === 'safe' ? 'rgba(46,213,115,0.3)' : 'rgba(255,71,87,0.3)';
    }
  }, 3200);

  // ---- STAGGERED FEATURE CARD APPEARANCES ----
  document.querySelectorAll('.feature-card').forEach((card, i) => {
    card.style.transitionDelay = (i * 100) + 'ms';
  });

  // ---- SMOOTH SCROLL for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- DASHBOARD PREVIEW MINI NAV ----
  document.querySelectorAll('.mini-nav-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.mini-nav-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
    });
  });

});
