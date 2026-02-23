'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Policy {
    id: string
    policyNumber: string
    type: string
    company: string
    planName: string
    premium: number
    endDate: string
    status: string
    customer: { firstName: string; lastName: string; phone: string; email: string }
    agent: { name: string }
}

export default function RenewalsPage() {
    const [filter, setFilter] = useState<7 | 15 | 30 | 60>(30)
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/policies?daysToExpiry=${filter}`)
            .then(r => r.json())
            .then(d => { setPolicies(d.policies || []); setLoading(false) })
    }, [filter])

    function daysLeft(endDate: string) {
        return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }

    function urgencyColor(days: number) {
        if (days <= 7) return '#ef4444'
        if (days <= 15) return '#f59e0b'
        return '#10b981'
    }

    const overdue = policies.filter(p => daysLeft(p.endDate) <= 0)
    const critical = policies.filter(p => daysLeft(p.endDate) > 0 && daysLeft(p.endDate) <= 7)


    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Policy Renewals</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Track and manage upcoming policy renewals</p>
            </div>

            {/* Alert Banner */}
            {(overdue.length > 0 || critical.length > 0) && (
                <div style={{ marginBottom: '20px', padding: '14px 20px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>Urgent Action Required</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {overdue.length > 0 && `${overdue.length} policies already expired. `}
                            {critical.length > 0 && `${critical.length} policies expiring within 7 days.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {([7, 15, 30, 60] as const).map(days => (
                    <button key={days} onClick={() => setFilter(days)} style={{
                        padding: '8px 20px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: filter === days ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                        color: filter === days ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s ease',
                    }}>
                        Next {days} days
                    </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total:</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{policies.length}</span>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : policies.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎉</span>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>All Clear!</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No policies expiring in the next {filter} days.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {policies.map(pol => {
                        const days = daysLeft(pol.endDate)
                        const color = urgencyColor(days)
                        return (
                            <div key={pol.id} style={{
                                background: 'var(--bg-card)', border: `1px solid ${days <= 7 ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                                borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                            }}>
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center', minWidth: '52px' }}>
                                        <p style={{ fontSize: '24px', fontWeight: 900, color, lineHeight: 1 }}>{days <= 0 ? 'X' : days}</p>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{days <= 0 ? 'EXPIRED' : 'DAYS'}</p>
                                    </div>
                                    <div style={{ width: '1px', height: '40px', background: 'var(--border)' }} />
                                    <div>
                                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{pol.customer.firstName} {pol.customer.lastName}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>📞 {pol.customer.phone} · {pol.policyNumber}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type</p>
                                        <span className={`badge badge-${pol.type.toLowerCase()}`}>{pol.type}</span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Company</p>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{pol.company}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Premium</p>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{pol.premium?.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expiry</p>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color }}>{pol.endDate}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {pol.customer.phone && (
                                            <a href={`https://wa.me/${pol.customer.phone.replace(/[\s+-]/g, '').length === 10 ? '91' + pol.customer.phone.replace(/[\s+-]/g, '') : pol.customer.phone.replace(/[\s+-]/g, '')}?text=${encodeURIComponent(`Hi ${pol.customer.firstName},\n\nThis is a gentle reminder regarding your ${pol.company} ${pol.type} policy (No: ${pol.policyNumber}).\n\nIt is due for renewal on ${new Date(pol.endDate).toLocaleDateString('en-IN')}. Please let me know a good time to connect so we can process this before it expires and ensure continuous coverage!\n\nThanks,\nUV Insurance`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                                WhatsApp
                                            </a>
                                        )}
                                        {pol.customer.phone && (
                                            <a href={`tel:${pol.customer.phone}`} style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                                📞 Call
                                            </a>
                                        )}
                                        <Link href={`/policies/${pol.id}`} style={{ padding: '7px 12px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                            View →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
