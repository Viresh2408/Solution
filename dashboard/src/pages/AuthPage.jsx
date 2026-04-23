// TrustNet AI — Auth Page (Landing + Sign In + Sign Up)
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, error } = useAuth();
  const [mode, setMode]         = useState('landing'); // 'landing' | 'signin' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLocalErr('');
    setSubmitting(true);
    try {
      if (mode === 'signin') await loginWithEmail(email, password);
      else                   await registerWithEmail(email, password);
    } catch (err) {
      setLocalErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── LANDING PAGE ────────────────────────────────────────
  if (mode === 'landing') return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,217,255,0.1) 0%, transparent 60%), #060B14',
      color: '#E8EAF0',
      fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
      overflowX: 'hidden',
    }}>

      {/* ── NAV ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(6,11,20,0.85)', backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="url(#nlg)" strokeWidth="1.5"/>
            <path d="M14 4L20 10L14 8L8 10L14 4Z" fill="#00D9FF" opacity="0.9"/>
            <path d="M8 10L14 24L14 8L8 10Z" fill="#7C3AED" opacity="0.8"/>
            <path d="M20 10L14 24L14 8L20 10Z" fill="#00D9FF" opacity="0.5"/>
            <defs><linearGradient id="nlg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D9FF"/><stop offset="1" stopColor="#7C3AED"/>
            </linearGradient></defs>
          </svg>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
            TrustNet <span style={{ color: '#00D9FF' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
          {['Features', 'How It Works', 'Pricing', 'Docs'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color='#00D9FF'} onMouseLeave={e => e.target.style.color=''}>
              {l}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setMode('signin')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#E8EAF0', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor='rgba(0,217,255,0.5)'; e.target.style.color='#00D9FF'; }}
            onMouseLeave={e => { e.target.style.borderColor='rgba(255,255,255,0.15)'; e.target.style.color='#E8EAF0'; }}>
            Sign In
          </button>
          <button onClick={() => setMode('signup')} style={{ background: 'linear-gradient(135deg, #7C3AED, #00D9FF)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.target.style.opacity='0.85'} onMouseLeave={e => e.target.style.opacity='1'}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: '100px', padding: '6px 16px', fontSize: '0.78rem', color: '#00D9FF', marginBottom: '28px', fontWeight: 600 }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D9FF', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
          Real-time AI Threat Detection · 5 Live APIs
        </div>
        <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.03em' }}>
          Stop Social Engineering<br/>
          <span style={{ background: 'linear-gradient(135deg, #00D9FF, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Before It Starts
          </span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '640px', margin: '0 auto 40px' }}>
          TrustNet AI protects your organization from phishing, BEC, vishing, and deepfake attacks 
          using Google Safe Browsing, VirusTotal, Shodan, AbuseIPDB, and Gemini AI — all in real time.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setMode('signup')} style={{ background: 'linear-gradient(135deg, #7C3AED, #00D9FF)', border: 'none', color: '#fff', padding: '14px 32px', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, transition: 'transform 0.2s, opacity 0.2s' }}
            onMouseEnter={e => e.target.style.transform='translateY(-2px)'} onMouseLeave={e => e.target.style.transform='translateY(0)'}>
            Start Free Trial →
          </button>
          <button onClick={() => setMode('signin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#E8EAF0', padding: '14px 32px', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background='rgba(255,255,255,0.1)'; }} onMouseLeave={e => { e.target.style.background='rgba(255,255,255,0.06)'; }}>
            View Demo Dashboard
          </button>
        </div>

        {/* Trust logos */}
        <p style={{ marginTop: '48px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>POWERED BY</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '12px', flexWrap: 'wrap', opacity: 0.5 }}>
          {['Google Safe Browsing', 'VirusTotal', 'Shodan', 'AbuseIPDB', 'Gemini AI'].map(api => (
            <span key={api} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '0.02em' }}>{api}</span>
          ))}
        </div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section id="features" style={{ padding: '40px 48px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: '2rem', marginBottom: '48px' }}>
          Everything you need to <span style={{ color: '#00D9FF' }}>stop threats</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🛡️', title: 'Real-Time URL Analysis', desc: 'Every URL checked against Google Safe Browsing + VirusTotal (70+ AV engines) + AbuseIPDB + Shodan before the page loads.', color: '#00D9FF' },
            { icon: '🧠', title: 'Gemini AI Email Analysis', desc: 'Paste any suspicious email and Gemini AI instantly identifies phishing tactics, cognitive biases exploited, and attack type.', color: '#7C3AED' },
            { icon: '🎣', title: 'Phishing Simulations', desc: 'Launch real email campaigns via SendGrid with BEC, payroll lure, and IT reset templates. Track who clicked.', color: '#FFA502' },
            { icon: '🗺️', title: 'Global Risk Intelligence', desc: 'Live heatmap of worldwide threats. See where attacks originate and which IPs are active threat actors right now.', color: '#FF4757' },
            { icon: '📊', title: 'Employee Risk Scoring', desc: 'Every employee gets a dynamic risk score based on behavior, incidents, and training completion. AI identifies who needs help.', color: '#2ED573' },
            { icon: '⚙️', title: 'Automated Policy Engine', desc: 'Set rules that automatically enforce MFA, block payments, quarantine emails, and enroll employees in training.', color: '#FF6B35' },
          ].map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px', transition: 'all 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.border=`1px solid ${f.color}40`; e.currentTarget.style.background=`${f.color}08`; e.currentTarget.style.transform='translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.border='1px solid rgba(255,255,255,0.07)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px', color: f.color }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '64px', flexWrap: 'wrap' }}>
          {[
            { val: '5', label: 'Live Security APIs' },
            { val: '70+', label: 'AV Engines (VirusTotal)' },
            { val: '<2s', label: 'Threat Detection Time' },
            { val: '99.9%', label: 'Uptime SLA' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '2.4rem', fontWeight: 900, background: 'linear-gradient(135deg, #00D9FF, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ textAlign: 'center', padding: '80px 24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>
          Ready to protect your organization?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', fontSize: '1rem' }}>
          Set up your dashboard in under 5 minutes. No credit card required.
        </p>
        <button onClick={() => setMode('signup')} style={{ background: 'linear-gradient(135deg, #7C3AED, #00D9FF)', border: 'none', color: '#fff', padding: '16px 40px', borderRadius: '12px', cursor: 'pointer', fontSize: '1.05rem', fontWeight: 700, transition: 'transform 0.2s' }}
          onMouseEnter={e => e.target.style.transform='translateY(-2px)'} onMouseLeave={e => e.target.style.transform='translateY(0)'}>
          Create Free Account →
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
        <span>© 2026 TrustNet AI. Built for Google Solution Challenge.</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Privacy', 'Terms', 'Security', 'Contact'].map(l => (
            <a key={l} href="#" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color='#00D9FF'} onMouseLeave={e => e.target.style.color=''}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );

  // ─── AUTH FORM ────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.2) 0%, transparent 60%), #060B14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Back to landing */}
        <button onClick={() => setMode('landing')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color='#00D9FF'} onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
          ← Back to home
        </button>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '36px', backdropFilter: 'blur(16px)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <svg width="44" height="44" viewBox="0 0 28 28" fill="none" style={{ marginBottom: '10px' }}>
              <circle cx="14" cy="14" r="13" stroke="url(#alg)" strokeWidth="1.5"/>
              <path d="M14 4L20 10L14 8L8 10L14 4Z" fill="#00D9FF" opacity="0.9"/>
              <path d="M8 10L14 24L14 8L8 10Z" fill="#7C3AED" opacity="0.8"/>
              <path d="M20 10L14 24L14 8L20 10Z" fill="#00D9FF" opacity="0.5"/>
              <defs><linearGradient id="alg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00D9FF"/><stop offset="1" stopColor="#7C3AED"/>
              </linearGradient></defs>
            </svg>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#E8EAF0' }}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              {mode === 'signin' ? 'Sign in to TrustNet AI' : 'Start protecting your organization'}
            </div>
          </div>

          {/* Google SSO */}
          <button onClick={loginWithGoogle} style={{ width: '100%', background: '#fff', color: '#1a1a2e', border: 'none', borderRadius: '10px', padding: '11px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.target.style.opacity='0.9'} onMouseLeave={e => e.target.style.opacity='1'}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.2 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34 6.6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.3 0-9.6-2.8-11.3-7H6.3C9.7 39.7 16.4 44 24 44z"/>
              <path fill="#1565C0" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C41.4 34.9 44 29.9 44 24c0-1.3-.2-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>or with email</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}/>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth}>
            {mode === 'signup' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600 }}>FULL NAME</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Chaitra Joshi"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#E8EAF0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor='rgba(0,217,255,0.5)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
            )}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600 }}>WORK EMAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#E8EAF0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor='rgba(0,217,255,0.5)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600 }}>PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#E8EAF0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor='rgba(0,217,255,0.5)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
            </div>

            {(localErr || error) && (
              <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.82rem', color: '#FF4757', marginBottom: '16px' }}>
                ⚠️ {localErr || error}
              </div>
            )}

            <button type="submit" disabled={submitting} style={{ width: '100%', background: 'linear-gradient(135deg, #7C3AED, #00D9FF)', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.95rem', fontWeight: 700, opacity: submitting ? 0.7 : 1, transition: 'opacity 0.2s' }}>
              {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)' }}>
            {mode === 'signin' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: '#00D9FF', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 'inherit' }}>Sign up free</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('signin')} style={{ background: 'none', border: 'none', color: '#00D9FF', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 'inherit' }}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
