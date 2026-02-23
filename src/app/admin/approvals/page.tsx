'use client'

import { useState, useEffect } from 'react'

interface Policy {
    id: string
    policyNumber: string
    type: string
    company: string
    status: string
    endDate: string
}

interface PendingCustomer {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string
    status: string
    kycStatus: string
    agentId: string
    agent: { name: string; email: string }
    policies: Policy[]
    createdAt: string
    updatedAt: string
}

export default function ApprovalsPage() {
    const [pendingNew, setPendingNew] = useState<PendingCustomer[]>([])
    const [pendingKyc, setPendingKyc] = useState<PendingCustomer[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/approvals')
            if (res.ok) {
                const data = await res.json()
                setPendingNew(data.pendingNew || [])
                setPendingKyc(data.pendingKyc || [])
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleAction(id: string, action: 'APPROVE' | 'REJECT', type: 'CUSTOMER' | 'KYC') {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this ${type.toLowerCase()}?`)) return

        setProcessing(id)
        try {
            const res = await fetch('/api/admin/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, type })
            })
            if (res.ok) {
                // Refresh data
                await fetchData()
            } else {
                alert('Failed to process approval')
            }
        } catch (error) {
            console.error('Action failed:', error)
            alert('Something went wrong')
        } finally {
            setProcessing(null)
        }
    }

    const CustomerCard = ({ customer, type }: { customer: PendingCustomer, type: 'CUSTOMER' | 'KYC' }) => {
        return (
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {customer.firstName} {customer.lastName}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                            Created by: <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{customer.agent.name}</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => handleAction(customer.id, 'REJECT', type)}
                            disabled={processing === customer.id}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: processing === customer.id ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Reject
                        </button>
                        <button
                            onClick={() => handleAction(customer.id, 'APPROVE', type)}
                            disabled={processing === customer.id}
                            className="btn-glow"
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: processing === customer.id ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {processing === customer.id ? 'Processing...' : 'Approve'}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Email</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{customer.email || '—'}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Phone</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{customer.phone || '—'}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Current Status</span>
                        <span style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 600 }}>{type === 'CUSTOMER' ? 'Pending Creation' : 'Pending KYC Docs'}</span>
                    </div>
                </div>

                {/* Show policies if they have any */}
                {customer.policies && customer.policies.length > 0 && (
                    <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                            Existing Policies ({customer.policies.length})
                        </h4>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {customer.policies.map(policy => (
                                <div key={policy.id} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    minWidth: '180px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{policy.type}</span>
                                        <span style={{
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: policy.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: policy.status === 'ACTIVE' ? '#22c55e' : '#ef4444'
                                        }}>{policy.status}</span>
                                    </div>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{policy.company}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ends: {new Date(policy.endDate).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Approvals</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Review new customers and KYC documents submitted by agents</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    {/* New Customers Section */}
                    <section>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                            New Customer Approvals
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {pendingNew.length}
                            </span>
                        </h2>
                        {pendingNew.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                No new customers pending approval.
                            </div>
                        ) : (
                            pendingNew.map(c => <CustomerCard key={c.id} customer={c} type="CUSTOMER" />)
                        )}
                    </section>

                    {/* KYC Updates Section */}
                    <section>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                            Pending KYC Documents
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {pendingKyc.length}
                            </span>
                        </h2>
                        {pendingKyc.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                No pending KYC documents to review.
                            </div>
                        ) : (
                            pendingKyc.map(c => <CustomerCard key={c.id} customer={c} type="KYC" />)
                        )}
                    </section>
                </div>
            )}
        </div>
    )
}
