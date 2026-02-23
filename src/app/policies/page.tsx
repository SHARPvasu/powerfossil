'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'



interface Policy {
    id: string
    policyNumber: string
    type: string
    company: string
    planName: string
    premium: number
    sumInsured: number
    startDate: string
    endDate: string
    status: string
    customer: { firstName: string; lastName: string; phone: string }
    agent: { name: string }
}

export default function PoliciesPage() {
    const router = useRouter()
    const [policies, setPolicies] = useState<Policy[]>([])
    const [loading, setLoading] = useState(true)
    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const fetchPolicies = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (typeFilter) params.set('type', typeFilter)
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/policies?${params}`)
        const data = await res.json()
        setPolicies(data.policies || [])
        setLoading(false)
    }, [typeFilter, statusFilter])

    useEffect(() => {
        fetchPolicies()
    }, [fetchPolicies])

    function typeIcon(type: string) {
        return type === 'HEALTH' ? '🏥' : type === 'MOTOR' ? '🚗' : type === 'LIFE' ? '❤️' : type === 'TERM' ? '📋' : '📄'
    }

    function expiryColor(endDate: string, status: string) {
        if (status !== 'ACTIVE') return 'var(--text-muted)'
        const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (days <= 7) return '#ef4444'
        if (days <= 30) return '#f59e0b'
        return 'var(--text-secondary)'
    }

    const totalPremium = policies.filter(p => p.status === 'ACTIVE').reduce((sum, p) => sum + (p.premium || 0), 0)

    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Policies</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                        {policies.length} policies · Active Premium: ₹{Math.round(totalPremium).toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Type pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {['', 'HEALTH', 'MOTOR', 'LIFE', 'TERM'].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)} style={{
                        padding: '7px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                        background: typeFilter === t ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                        color: typeFilter === t ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s ease',
                    }}>
                        {t ? `${typeIcon(t)} ${t}` : 'All Types'}
                    </button>
                ))}
                <select
                    className="input-dark"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ width: '150px', padding: '7px 12px', marginLeft: 'auto' }}
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RENEWED">Renewed</option>
                </select>
            </div>

            {/* Policies Grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : policies.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No policies found</p>
                </div>
            ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Policy</th>
                                <th>Customer</th>
                                <th>Company / Plan</th>
                                <th>Premium</th>
                                <th>Sum Insured</th>
                                <th>Expiry</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {policies.map(pol => (
                                <tr key={pol.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/policies/${pol.id}`)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0,
                                                background: pol.type === 'HEALTH' ? 'rgba(16,185,129,0.1)' : pol.type === 'MOTOR' ? 'rgba(59,130,246,0.1)' : pol.type === 'LIFE' ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)',
                                            }}>
                                                {typeIcon(pol.type)}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '12px' }}>{pol.policyNumber}</p>
                                                <span className={`badge badge-${pol.type.toLowerCase()}`}>{pol.type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{pol.customer.firstName} {pol.customer.lastName}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pol.customer.phone}</p>
                                    </td>
                                    <td>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pol.company}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pol.planName}</p>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{pol.premium?.toLocaleString('en-IN')}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{pol.sumInsured ? `₹${pol.sumInsured?.toLocaleString('en-IN')}` : '—'}</td>
                                    <td>
                                        <p style={{ fontSize: '12px', fontWeight: 600, color: expiryColor(pol.endDate, pol.status) }}>{pol.endDate}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {pol.status === 'ACTIVE' ? (
                                                `${Math.max(0, Math.ceil((new Date(pol.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d left`
                                            ) : '—'}
                                        </p>
                                    </td>
                                    <td><span className={`badge badge-${pol.status.toLowerCase()}`}>{pol.status}</span></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <Link href={`/policies/${pol.id}`} style={{ color: 'var(--accent-blue)', fontSize: '12px', textDecoration: 'none', fontWeight: 600, padding: '4px 10px', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px' }}>View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
