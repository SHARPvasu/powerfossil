'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AgentPerf {
    id: string
    name: string
    email: string
    phone: string
    totalCustomers: number
    totalPolicies: number
    activePolicies: number
    totalPremium: number
    totalCommission: number
    byType: Record<string, number>
}

const TYPE_COLORS: Record<string, string> = {
    HEALTH: '#10b981', MOTOR: '#3b82f6', LIFE: '#8b5cf6', TERM: '#f59e0b', OTHER: '#6b7280'
}

export default function AgentsPerformancePage() {
    const [agents, setAgents] = useState<AgentPerf[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/admin/agents-performance')
            .then(r => r.json())
            .then(d => { setAgents(d.performance || []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const totalPremium = agents.reduce((s, a) => s + a.totalPremium, 0)
    const totalCommission = agents.reduce((s, a) => s + a.totalCommission, 0)

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    return (
        <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Agent Performance</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Team leaderboard — active policies only</p>
                </div>
                <Link href="/admin" style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                    ← Back to Admin
                </Link>
            </div>

            {/* Agency Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: '🏆 Total Agents', value: agents.length },
                    { label: '💰 Agency Premium', value: `₹${totalPremium.toLocaleString('en-IN')}` },
                    { label: '🤝 Total Commission', value: `₹${Math.round(totalCommission).toLocaleString('en-IN')}` },
                ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 24px' }}>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{s.label}</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Agent Cards */}
            {agents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '48px', marginBottom: '16px' }}>👥</p>
                    <p style={{ color: 'var(--text-muted)' }}>No agents found yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {agents.map((agent, idx) => {
                        const rank = idx + 1
                        const premiumShare = totalPremium > 0 ? (agent.totalPremium / totalPremium) * 100 : 0
                        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
                        return (
                            <div key={agent.id} style={{
                                background: 'var(--bg-card)', border: rank === 1 ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)',
                                borderRadius: '14px', padding: '20px 24px',
                                boxShadow: rank === 1 ? '0 0 20px rgba(245,158,11,0.08)' : 'none',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                                            {typeof medal === 'string' && medal.startsWith('#') ? rank : medal}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{medal} {agent.name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{agent.email} {agent.phone ? `· ${agent.phone}` : ''}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Customers', value: agent.totalCustomers },
                                            { label: 'Policies', value: agent.totalPolicies },
                                            { label: 'Active', value: agent.activePolicies },
                                            { label: 'Premium', value: `₹${Math.round(agent.totalPremium).toLocaleString('en-IN')}` },
                                            { label: 'Commission', value: `₹${Math.round(agent.totalCommission).toLocaleString('en-IN')}` },
                                        ].map(stat => (
                                            <div key={stat.label} style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</p>
                                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ marginTop: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Premium share</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{premiumShare.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                                        <div style={{ height: '100%', width: `${premiumShare}%`, background: rank === 1 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'var(--gradient-primary)', borderRadius: '2px', transition: 'width 1s ease' }} />
                                    </div>
                                </div>
                                {/* Type breakdown pills */}
                                {Object.keys(agent.byType).length > 0 && (
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                                        {Object.entries(agent.byType).map(([type, count]) => (
                                            <span key={type} style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: `${TYPE_COLORS[type] || '#6b7280'}18`, color: TYPE_COLORS[type] || '#6b7280', border: `1px solid ${TYPE_COLORS[type] || '#6b7280'}33` }}>
                                                {type} {count}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
