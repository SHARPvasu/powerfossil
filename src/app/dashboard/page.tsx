'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
    totalCustomers: number
    totalPolicies: number
    activePolicies: number
    expiredPolicies: number
    totalPremium: number
    policyBreakdown: { health: number; motor: number; life: number }
    callsToday: number
    notesCount: number
}

interface ExpiringPolicy {
    id: string
    policyNumber: string
    type: string
    endDate: string
    premium: number
    customer: { firstName: string; lastName: string; phone: string }
}

interface RecentCustomer {
    id: string
    firstName: string
    lastName: string
    phone: string
    createdAt: string
}

function StatCard({
    title, value, subtitle, icon, gradient, trend,
}: {
    title: string, value: string | number, subtitle?: string, icon: React.ReactNode, gradient: string, trend?: string
}) {
    return (
        <div className="stat-card card-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{title}</p>
                    <p style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1 }}>{value}</p>
                    {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{subtitle}</p>}
                    {trend && <p style={{ fontSize: '12px', color: 'var(--accent-green)', marginTop: '4px' }}>{trend}</p>}
                </div>
                <div style={{
                    width: 48, height: 48, borderRadius: '12px',
                    background: gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                    {icon}
                </div>
            </div>
        </div>
    )
}

function getDaysUntil(dateStr: string) {
    const date = new Date(dateStr)
    const today = new Date()
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [expiringPolicies, setExpiringPolicies] = useState<ExpiringPolicy[]>([])
    const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/dashboard')
            .then(r => r.json())
            .then(data => {
                setStats(data.stats)
                setExpiringPolicies(data.expiringPolicies || [])
                setRecentCustomers(data.recentCustomers || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        border: '3px solid rgba(99,102,241,0.2)',
                        borderTop: '3px solid var(--accent-blue)',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 12px',
                    }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading dashboard...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '1400px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    Dashboard Overview
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <StatCard
                    title="Total Customers"
                    value={stats?.totalCustomers || 0}
                    subtitle="All registered clients"
                    icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                    gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
                />
                <StatCard
                    title="Active Policies"
                    value={stats?.activePolicies || 0}
                    subtitle={`${stats?.expiredPolicies || 0} expired`}
                    icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                    gradient="linear-gradient(135deg, #10b981, #059669)"
                />
                <StatCard
                    title="Monthly Premium"
                    value={`₹${Math.round((stats?.totalPremium || 0)).toLocaleString('en-IN')}`}
                    subtitle="Active policies sum"
                    icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                    gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
                <StatCard
                    title="Today's Calls"
                    value={stats?.callsToday || 0}
                    subtitle="Logged call records"
                    icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.15h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.7a16 16 0 0 0 6.29 6.29l.83-.83a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>}
                    gradient="linear-gradient(135deg, #06b6d4, #0284c7)"
                />
            </div>

            {/* Policy Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Policy Type Breakdown */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Policy Breakdown</h2>
                        <Link href="/policies" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>View All →</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {[
                            { label: 'Health Insurance', count: stats?.policyBreakdown.health || 0, total: stats?.totalPolicies || 1, color: '#10b981', badge: 'health' },
                            { label: 'Motor Insurance', count: stats?.policyBreakdown.motor || 0, total: stats?.totalPolicies || 1, color: '#3b82f6', badge: 'motor' },
                            { label: 'Life Insurance', count: stats?.policyBreakdown.life || 0, total: stats?.totalPolicies || 1, color: '#8b5cf6', badge: 'life' },
                        ].map(item => (
                            <div key={item.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 700 }}>{item.count}</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%`,
                                        background: item.color,
                                        borderRadius: 3,
                                        transition: 'width 1s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expiring Soon */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Expiring Soon
                            {expiringPolicies.length > 0 && (
                                <span style={{
                                    marginLeft: 8, background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                                    fontSize: '11px', padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                                }}>
                                    {expiringPolicies.length}
                                </span>
                            )}
                        </h2>
                        <Link href="/renewals" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>View All →</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                        {expiringPolicies.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No policies expiring soon 🎉</p>
                        ) : (
                            expiringPolicies.map(pol => {
                                const days = getDaysUntil(pol.endDate)
                                return (
                                    <div key={pol.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 12px', borderRadius: '10px',
                                        background: days <= 7 ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.05)',
                                        border: `1px solid ${days <= 7 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)'}`,
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {pol.customer.firstName} {pol.customer.lastName}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {pol.policyNumber} · {pol.type}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 700, color: days <= 7 ? '#ef4444' : '#f59e0b' }}>
                                                {days <= 0 ? 'Expired' : `${days}d left`}
                                            </p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {pol.endDate}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Customers */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Customers</h2>
                    <Link href="/customers/new" style={{
                        fontSize: '12px', color: 'white', textDecoration: 'none',
                        background: 'var(--gradient-primary)', padding: '6px 14px', borderRadius: '8px', fontWeight: 600,
                    }}>
                        + Add Customer
                    </Link>
                </div>
                {recentCustomers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '14px' }}>No customers yet. Add your first customer!</p>
                    </div>
                ) : (
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Added</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCustomers.map(c => (
                                <tr key={c.id}>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.firstName} {c.lastName}</td>
                                    <td>{c.phone}</td>
                                    <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <Link href={`/customers/${c.id}`} style={{ color: 'var(--accent-blue)', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
