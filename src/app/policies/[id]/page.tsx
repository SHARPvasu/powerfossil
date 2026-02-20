'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Policy {
    id: string
    policyNumber: string
    type: string
    subType: string
    company: string
    planName: string
    sumInsured: number
    premium: number
    paymentMode: string
    startDate: string
    endDate: string
    issueDate: string
    status: string
    tags: string
    vehicleNo: string
    vehicleModel: string
    vehicleYear: string
    nominee: string
    nomineeRelation: string
    reminderSent: boolean
    createdAt: string
    customer: {
        id: string
        firstName: string
        lastName: string
        phone: string
        email: string
        city: string
    }
    proposer: { firstName: string; lastName: string } | null
    agent: { name: string }
    documents: { id: string; name: string; type: string; url: string; size: number }[]
}

const STATUS_OPTIONS = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWED']

export default function PolicyDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [policy, setPolicy] = useState<Policy | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Policy>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch(`/api/policies/${id}`)
            .then(r => r.json())
            .then(d => { setPolicy(d.policy); setEditForm(d.policy); setLoading(false) })
            .catch(() => setLoading(false))
    }, [id])

    async function saveEdit() {
        setSaving(true)
        const res = await fetch(`/api/policies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        })
        const d = await res.json()
        if (res.ok) { setPolicy(d.policy); setEditing(false) }
        setSaving(false)
    }

    async function deletePolicy() {
        if (!confirm('Delete this policy permanently?')) return
        await fetch(`/api/policies/${id}`, { method: 'DELETE' })
        router.push('/policies')
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!policy) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Policy not found.</div>

    const tags: string[] = policy.tags ? JSON.parse(policy.tags) : []
    const daysLeft = Math.ceil((new Date(policy.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const typeIcon = policy.type === 'HEALTH' ? '🏥' : policy.type === 'MOTOR' ? '🚗' : policy.type === 'LIFE' ? '❤️' : '📋'
    const typeColor = policy.type === 'HEALTH' ? '#10b981' : policy.type === 'MOTOR' ? '#3b82f6' : policy.type === 'LIFE' ? '#8b5cf6' : '#f59e0b'

    const inputCls: React.CSSProperties = {
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)',
        borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%',
    }
    const labelCls: React.CSSProperties = {
        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase',
    }

    return (
        <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '8px', borderRadius: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <div style={{ width: 52, height: 52, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', background: `${typeColor}22`, border: `1px solid ${typeColor}44`, flexShrink: 0 }}>
                        {typeIcon}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{policy.planName || policy.policyNumber}</h1>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{policy.policyNumber}</span>
                            <span className={`badge badge-${policy.type.toLowerCase()}`}>{policy.type}</span>
                            <span className={`badge badge-${policy.status.toLowerCase()}`}>{policy.status}</span>
                            {policy.status === 'ACTIVE' && (
                                <span style={{ fontSize: '12px', fontWeight: 700, color: daysLeft <= 30 ? '#ef4444' : 'var(--accent-green)' }}>
                                    {daysLeft <= 0 ? 'Overdue!' : `${daysLeft} days left`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', background: 'none', fontSize: '12px' }}>Cancel</button>
                            <button onClick={saveEdit} disabled={saving} className="btn-glow" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>{saving ? 'Saving...' : '✓ Save'}</button>
                        </>
                    ) : (
                        <>
                            <Link href={`/customers/${policy.customer.id}`} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                                View Customer →
                            </Link>
                            <button onClick={() => setEditing(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', background: 'none', fontSize: '12px', fontWeight: 600 }}>
                                ✏️ Edit
                            </button>
                            <button onClick={deletePolicy} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', color: '#ef4444', background: 'rgba(239,68,68,0.08)', fontSize: '12px', fontWeight: 600 }}>
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Policy Details */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Policy Details</h3>
                    {editing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Plan Name', key: 'planName' },
                                { label: 'Company', key: 'company' },
                                { label: 'Sub Type', key: 'subType' },
                                { label: 'Sum Insured', key: 'sumInsured', type: 'number' },
                                { label: 'Premium', key: 'premium', type: 'number' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={labelCls}>{f.label}</label>
                                    <input type={f.type || 'text'} style={inputCls} value={(editForm as Record<string, string | number>)[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={labelCls}>Status</label>
                                <select style={inputCls} value={editForm.status || 'ACTIVE'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            {[
                                { label: 'Start Date', key: 'startDate', type: 'date' },
                                { label: 'End Date', key: 'endDate', type: 'date' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={labelCls}>{f.label}</label>
                                    <input type="date" style={inputCls} value={(editForm as Record<string, string>)[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {[
                                { label: 'Company', value: policy.company },
                                { label: 'Plan Name', value: policy.planName || '—' },
                                { label: 'Sub Type', value: policy.subType || '—' },
                                { label: 'Payment Mode', value: policy.paymentMode },
                                { label: 'Premium', value: `₹${policy.premium?.toLocaleString('en-IN')}` },
                                { label: 'Sum Insured', value: policy.sumInsured ? `₹${policy.sumInsured?.toLocaleString('en-IN')}` : '—' },
                                { label: 'Start Date', value: policy.startDate },
                                { label: 'End Date', value: policy.endDate },
                                { label: 'Issue Date', value: policy.issueDate || '—' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Customer Info */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Policy Holder</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.1)' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                {policy.customer.firstName[0]}{policy.customer.lastName[0]}
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{policy.customer.firstName} {policy.customer.lastName}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📞 {policy.customer.phone}</p>
                                {policy.customer.city && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {policy.customer.city}</p>}
                            </div>
                            <Link href={`/customers/${policy.customer.id}`} style={{ marginLeft: 'auto', color: 'var(--accent-blue)', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>View →</Link>
                        </div>

                        {policy.proposer && (
                            <div style={{ marginTop: '12px' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>PROPOSER</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{policy.proposer.firstName} {policy.proposer.lastName}</p>
                            </div>
                        )}
                    </div>

                    {/* Type-specific Info */}
                    {(policy.type === 'MOTOR' && (policy.vehicleNo || policy.vehicleModel)) && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>🚗 Vehicle Details</h3>
                            {[
                                { label: 'Vehicle Number', value: policy.vehicleNo || '—' },
                                { label: 'Model', value: policy.vehicleModel || '—' },
                                { label: 'Year', value: policy.vehicleYear || '—' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {(policy.type === 'LIFE' || policy.type === 'TERM') && policy.nominee && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>👤 Nominee Details</h3>
                            {[
                                { label: 'Nominee', value: policy.nominee },
                                { label: 'Relation', value: policy.nomineeRelation || '—' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Tags</h3>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {tags.map(tag => (
                                    <span key={tag} style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(99,102,241,0.2)' }}>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Documents</h3>
                            <label style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '11px', fontWeight: 600 }}>
                                + Upload
                                <input type="file" style={{ display: 'none' }} />
                            </label>
                        </div>
                        {policy.documents.length === 0 ? (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No documents uploaded.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {policy.documents.map(doc => (
                                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📄 {doc.name}</span>
                                        <a href={doc.url} download style={{ color: 'var(--accent-blue)', fontSize: '11px', textDecoration: 'none', fontWeight: 600 }}>Download</a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Renewal Action Bar */}
            {policy.status === 'ACTIVE' && daysLeft <= 60 && (
                <div style={{
                    marginTop: '20px', padding: '18px 24px', borderRadius: '14px',
                    background: daysLeft <= 15 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.06)',
                    border: `1px solid ${daysLeft <= 15 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.2)'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                }}>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: daysLeft <= 15 ? '#ef4444' : '#f59e0b' }}>
                            {daysLeft <= 0 ? '⚠️ Policy Has Expired!' : `⚠️ Policy expires in ${daysLeft} days`}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Contact {policy.customer.firstName} at {policy.customer.phone} for renewal
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <a href={`tel:${policy.customer.phone}`} style={{ padding: '9px 18px', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                            📞 Call Now
                        </a>
                        <button onClick={() => {
                            setEditForm(prev => ({ ...prev, status: 'RENEWED' }))
                            setEditing(true)
                        }} style={{ padding: '9px 18px', borderRadius: '8px', background: 'var(--gradient-primary)', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600 }}>
                            ♻️ Mark Renewed
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
