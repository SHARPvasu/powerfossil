'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 30

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [capsLock, setCapsLock] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  // Focus email on mount
  useEffect(() => { emailRef.current?.focus() }, [])

  // Restore lockout from sessionStorage on page reload
  useEffect(() => {
    const stored = sessionStorage.getItem('pf_lockout')
    const storedAttempts = sessionStorage.getItem('pf_attempts')
    if (stored) setLockedUntil(parseInt(stored))
    if (storedAttempts) setAttempts(parseInt(storedAttempts))
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!lockedUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) {
        setLockedUntil(null)
        setCountdown(0)
        sessionStorage.removeItem('pf_lockout')
      } else {
        setCountdown(remaining)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [lockedUntil])

  // Detect caps lock
  function handleKeyDown(e: React.KeyboardEvent) {
    setCapsLock(e.getModifierState('CapsLock'))
  }

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked) return
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        sessionStorage.setItem('pf_attempts', String(newAttempts))

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_SECONDS * 1000
          setLockedUntil(lockTime)
          sessionStorage.setItem('pf_lockout', String(lockTime))
          setError(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS} seconds.`)
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts
          setError(`${data.error || 'Invalid credentials'}. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`)
        }
      } else {
        sessionStorage.removeItem('pf_attempts')
        sessionStorage.removeItem('pf_lockout')
        router.push('/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${isLocked ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
    color: 'var(--text-primary)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s ease',
  }

  const strengthLevel = attempts === 0 ? 5 : Math.max(0, MAX_ATTEMPTS - attempts)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }} className="animated-bg">
      {/* Animated background grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          width: '100%', height: '100%',
        }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }} className="animate-fade-in">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="btn-glow" style={{ width: 64, height: 64, borderRadius: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-1px', fontFamily: 'Inter, sans-serif' }}>UV</span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            UV Insurance <span className="gradient-text">Agency</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Insurance Management System</p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ borderRadius: '20px', padding: '36px', boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Sign in to your account</h2>

          {/* Lockout alert */}
          {isLocked && (
            <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>Account Temporarily Locked</p>
                <p style={{ fontSize: '12px', color: 'rgba(239,68,68,0.7)', marginTop: '2px' }}>Try again in <b>{countdown}s</b></p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ ...inputBase, paddingLeft: '40px' }}
                  placeholder="agent@uvinsurance.in"
                  required
                  disabled={isLocked}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ ...inputBase, paddingLeft: '40px', paddingRight: '44px' }}
                  placeholder="••••••••"
                  required
                  disabled={isLocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                    color: showPassword ? 'var(--accent-blue)' : 'var(--text-muted)',
                    transition: 'color 0.2s ease',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {capsLock && (
                <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  Caps Lock is ON
                </p>
              )}
            </div>

            {/* Attempt strength bar */}
            {attempts > 0 && !isLocked && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Attempts remaining</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: strengthLevel <= 1 ? '#ef4444' : strengthLevel <= 2 ? '#f59e0b' : 'var(--accent-green)' }}>{strengthLevel}/{MAX_ATTEMPTS}</p>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(strengthLevel / MAX_ATTEMPTS) * 100}%`,
                    borderRadius: 4,
                    background: strengthLevel <= 1 ? '#ef4444' : strengthLevel <= 2 ? '#f59e0b' : 'var(--accent-green)',
                    transition: 'all 0.4s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && !isLocked && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <svg style={{ flexShrink: 0, marginTop: '1px' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-btn"
              type="submit"
              disabled={loading || isLocked}
              className="btn-glow"
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer',
                color: 'white', fontSize: '14px', fontWeight: 700, opacity: (loading || isLocked) ? 0.6 : 1,
                letterSpacing: '0.3px', marginTop: '4px',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Signing in...
                </span>
              ) : isLocked ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  🔒 Locked ({countdown}s)
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In Securely
                </span>
              )}
            </button>
          </form>

          {/* Security badge */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>256-bit JWT · HTTP-only Cookies · Brute-force Protected</span>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px', letterSpacing: '0.5px' }}>DEMO CREDENTIALS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { role: 'Admin', email: 'admin@uvinsurance.in', pass: 'admin123', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
                { role: 'Agent', email: 'agent@uvinsurance.in', pass: 'agent123', color: '#06b6d4', bg: 'rgba(6,182,212,0.10)' },
                { role: 'Auditor', email: 'auditor@uvinsurance.in', pass: 'auditor123', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
              ].map(cred => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => { setEmail(cred.email); setPassword(cred.pass); setError('') }}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = cred.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: cred.color, background: `${cred.bg}`, border: `1px solid ${cred.color}33`, borderRadius: '5px', padding: '2px 7px', letterSpacing: '0.5px', flexShrink: 0 }}>
                    {cred.role.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {cred.email}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>/ {cred.pass}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', marginTop: '20px', color: 'var(--text-muted)' }}>
          UV Insurance Agency © 2026 · Secure Insurance Platform
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: var(--accent-blue) !important; background: rgba(99,102,241,0.05) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
        input:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
