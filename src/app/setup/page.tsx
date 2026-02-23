'use client'

import { useCallback, useEffect, useState } from 'react'

type DbHealthResponse = {
  status: string
  database: string
  env?: {
    databaseUrl: boolean
    directUrl: boolean
  }
  issues?: string[]
  error?: string
  timestamp?: string
}

export default function SetupPage() {
  const [health, setHealth] = useState<DbHealthResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health/db')
      const data = await response.json()
      setHealth(data)
    } catch {
      setHealth({
        status: 'unhealthy',
        database: 'disconnected',
        error: 'Unable to reach the health endpoint.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const statusColor = health?.status === 'healthy' ? '#22c55e' : '#ef4444'

  return (
    <div style={{
      minHeight: '100vh',
      padding: '48px 20px',
      display: 'flex',
      justifyContent: 'center',
    }} className="animated-bg">
      <div style={{ width: '100%', maxWidth: '920px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>UV Insurance Agency Setup</h1>
          <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
            Use this checklist to confirm your database and authentication configuration before onboarding agents.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}>
          <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Database Status</h2>
            <p style={{ marginTop: '10px', color: statusColor, fontWeight: 700 }}>
              {health ? `${health.status.toUpperCase()} · ${health.database}` : 'Checking...'}
            </p>
            <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {health?.error ?? 'Connection pooler and direct URLs verified.'}
            </p>
            {health?.issues?.length ? (
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                Missing: {health.issues.join(', ')}
              </p>
            ) : null}
            <button
              type="button"
              onClick={fetchHealth}
              disabled={loading}
              className="btn-glow"
              style={{
                marginTop: '12px',
                width: '100%',
                border: 'none',
                color: 'white',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Rechecking...' : 'Recheck connection'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Environment Variables</h2>
            <ul style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.7 }}>
              <li>DATABASE_URL (pooler connection)</li>
              <li>DIRECT_URL (direct connection)</li>
              <li>JWT_SECRET (64-char secret)</li>
            </ul>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Check <code>.env</code> and <code>.env.local</code> before running migrations.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Demo Accounts</h2>
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <p><strong>Admin:</strong> admin@uvinsurance.in / admin123</p>
              <p style={{ marginTop: '6px' }}><strong>Agent:</strong> agent@uvinsurance.in / agent123</p>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>First-run checklist</h2>
          <ol style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.8 }}>
            <li>Confirm the Neon pooler URL is stored in <code>DATABASE_URL</code>.</li>
            <li>Set the non-pooler Neon host in <code>DIRECT_URL</code>.</li>
            <li>Run <code>npm run db:migrate</code> (or <code>npm run db:migrate:dev</code> locally).</li>
            <li>Seed demo data with <code>npm run db:seed</code>.</li>
            <li>Login and verify customer, policy, call log, notes, renewals, and reports modules.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
