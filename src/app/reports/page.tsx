'use client'

import { useEffect, useState } from 'react'

interface DashStats {
    totalCustomers: number
    totalPolicies: number
    activePolicies: number
    expiredPolicies: number
    totalPremium: number
    policyBreakdown: { health: number; motor: number; life: number }
    callsToday: number
    notesCount: number
}

export default function ReportsPage() {
    const [stats, setStats] = useState<DashStats | null>(null)
    const [policies, setPolicies] = useState<{ id: string; type: string; premium: number; status: string; endDate: string; company: string; customer: { firstName: string; lastName: string } }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch('/api/dashboard').then(r => r.json()),
            fetch('/api/policies').then(r => r.json()),
        ]).then(([d, p]) => {
            setStats(d.stats)
            setPolicies(p.policies || [])
            setLoading(false)
        })
    }, [])

    function exportCSV() {
        if (!policies.length) return
        const headers = ['Customer', 'Type', 'Company', 'Premium', 'Status', 'End Date']
        const rows = policies.map(p => [
            `${p.customer.firstName} ${p.customer.lastName}`,
            p.type, p.company, p.premium, p.status, p.endDate,
        ])
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `powerfossil-policies-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    const totalPremium = stats?.totalPremium || 0
    const conversionRate = stats && stats.totalCustomers > 0 ? ((stats.totalPolicies / stats.totalCustomers) * 100).toFixed(1) : '0'
    const activeRate = stats && stats.totalPolicies > 0 ? ((stats.activePolicies / stats.totalPolicies) * 100).toFixed(1) : '0'

    // Premium by type
    const premiumByType = policies.filter(p => p.status === 'ACTIVE').reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + (p.premium || 0)
        return acc
    }, {} as Record<string, number>)

    // Premium by company
    const premiumByCompany = policies.filter(p => p.status === 'ACTIVE').reduce((acc, p) => {
        acc[p.company] = (acc[p.company] || 0) + (p.premium || 0)
        return acc
    }, {} as Record<string, number>)
    const topCompanies = Object.entries(premiumByCompany).sort((a, b) => b[1] - a[1]).slice(0, 5)

    const maxCompanyPremium = topCompanies[0]?.[1] || 1

    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Reports & Analytics</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Business performance overview</p>
                </div>
                <button onClick={exportCSV} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer', color: '#10b981', background: 'rgba(16,185,129,0.08)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export CSV
                </button>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Revenue', value: `₹${Math.round(totalPremium).toLocaleString('en-IN')}`, sub: 'Active policy premiums', icon: '💰' },
                    { label: 'Conversion Rate', value: `${conversionRate}%`, sub: 'Customers to policies', icon: '📈' },
                    { label: 'Active Rate', value: `${activeRate}%`, sub: 'Of all policies active', icon: '✅' },
                    { label: 'Avg Premium', value: stats?.activePolicies ? `₹${Math.round(totalPremium / stats.activePolicies).toLocaleString('en-IN')}` : '—', sub: 'Per active policy', icon: '📊' },
                ].map(k => (
                    <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{k.label}</p>
                            <span style={{ fontSize: '20px' }}>{k.icon}</span>
                        </div>
                        <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '10px' }}>{k.value}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{k.sub}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Policy Type Distribution */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Policy Distribution</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[
                            { type: 'Health', count: stats?.policyBreakdown.health || 0, premium: premiumByType['HEALTH'] || 0, color: '#10b981' },
                            { type: 'Motor', count: stats?.policyBreakdown.motor || 0, premium: premiumByType['MOTOR'] || 0, color: '#3b82f6' },
                            { type: 'Life', count: stats?.policyBreakdown.life || 0, premium: premiumByType['LIFE'] || 0, color: '#8b5cf6' },
                        ].map(item => {
                            const pct = stats?.totalPolicies ? (item.count / stats.totalPolicies) * 100 : 0
                            return (
                                <div key={item.type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block', marginTop: 3 }} />
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 8 }}>{item.type}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.count}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>({pct.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                    <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 4, transition: 'width 1.2s ease' }} />
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Premium: ₹{Math.round(item.premium).toLocaleString('en-IN')}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Top Companies */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Top Companies by Premium</h3>
                    {topCompanies.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No data yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {topCompanies.map(([company, premium], idx) => {
                                const pct = (premium / maxCompanyPremium) * 100
                                const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
                                return (
                                    <div key={company}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>#{idx + 1} {company}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{Math.round(premium).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: colors[idx] || '#6366f1', borderRadius: 3, transition: 'width 1.2s ease' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Summary */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Portfolio Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                    {[
                        { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: '👥', color: '#6366f1' },
                        { label: 'Total Policies', value: stats?.totalPolicies || 0, icon: '📋', color: '#8b5cf6' },
                        { label: 'Active Policies', value: stats?.activePolicies || 0, icon: '✅', color: '#10b981' },
                        { label: 'Expired Policies', value: stats?.expiredPolicies || 0, icon: '❌', color: '#ef4444' },
                        { label: "Today's Calls", value: stats?.callsToday || 0, icon: '📞', color: '#06b6d4' },
                        { label: 'Total Notes', value: stats?.notesCount || 0, icon: '📝', color: '#f59e0b' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>{s.icon}</span>
                            <p style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
