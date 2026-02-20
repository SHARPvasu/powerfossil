'use client'

import { useState, useEffect } from 'react'

interface Call {
    id: string
    type: string
    duration: number
    notes: string
    outcome: string
    callDate: string
    customer: { firstName: string; lastName: string; phone: string }
    agent: { name: string }
}

const OUTCOME_LABELS: Record<string, string> = {
    INTERESTED: '✅ Interested',
    NOT_INTERESTED: '❌ Not Interested',
    CALLBACK: '🔄 Callback',
    POLICY_SOLD: '🎉 Policy Sold',
    RENEWAL: '♻️ Renewal',
}

const OUTCOME_COLORS: Record<string, string> = {
    INTERESTED: 'rgba(16,185,129,0.15)',
    NOT_INTERESTED: 'rgba(239,68,68,0.12)',
    CALLBACK: 'rgba(245,158,11,0.15)',
    POLICY_SOLD: 'rgba(99,102,241,0.15)',
    RENEWAL: 'rgba(6,182,212,0.15)',
}

export default function CallsPage() {
    const [calls, setCalls] = useState<Call[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [customers, setCustomers] = useState<{ id: string; firstName: string; lastName: string; phone: string }[]>([])
    const [form, setForm] = useState({ customerId: '', type: 'OUTGOING', duration: '', notes: '', outcome: 'INTERESTED' })

    useEffect(() => {
        Promise.all([
            fetch('/api/calls').then(r => r.json()),
            fetch('/api/customers?limit=100').then(r => r.json()),
        ]).then(([callsData, customersData]) => {
            setCalls(callsData.calls || [])
            setCustomers(customersData.customers || [])
            setLoading(false)
        })
    }, [])

    async function logCall() {
        if (!form.customerId) return
        const res = await fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, duration: form.duration ? parseInt(form.duration) : null }),
        })
        const d = await res.json()
        if (res.ok) {
            setCalls(prev => [d.call, ...prev])
            setShowForm(false)
            setForm({ customerId: '', type: 'OUTGOING', duration: '', notes: '', outcome: 'INTERESTED' })
        }
    }

    // Stats
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayCalls = calls.filter(c => new Date(c.callDate) >= todayStart).length
    const soldCalls = calls.filter(c => c.outcome === 'POLICY_SOLD').length
    const totalDuration = calls.reduce((s, c) => s + (c.duration || 0), 0)
    const avgDuration = calls.length > 0 ? Math.round(totalDuration / calls.filter(c => c.duration).length) : 0

    const fieldStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', width: '100%' }

    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Call Tracker</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Track all customer interactions</p>
                </div>
                <button onClick={() => setShowForm(true)} className="btn-glow" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    Log Call
                </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                    { label: "Today's Calls", value: todayCalls, icon: '📞', color: 'var(--accent-blue)' },
                    { label: 'Total Calls', value: calls.length, icon: '📊', color: 'var(--accent-purple)' },
                    { label: 'Policies Sold', value: soldCalls, icon: '🎉', color: 'var(--accent-green)' },
                    { label: 'Avg Duration', value: avgDuration > 0 ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : '—', icon: '⏱️', color: 'var(--accent-orange)' },
                ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{s.label}</p>
                            <span style={{ fontSize: '18px' }}>{s.icon}</span>
                        </div>
                        <p style={{ fontSize: '26px', fontWeight: 800, color: s.color, marginTop: '8px' }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Log Call Form Modal */}
            {showForm && (
                <div className="modal-backdrop" onClick={() => setShowForm(false)}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)', width: '480px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', fontSize: '16px' }}>Log New Call</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>CUSTOMER *</label>
                                <select style={fieldStyle} value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}>
                                    <option value="">Select customer...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} - {c.phone}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>TYPE</label>
                                    <select style={fieldStyle} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="OUTGOING">📤 Outgoing</option>
                                        <option value="INCOMING">📥 Incoming</option>
                                        <option value="MISSED">📵 Missed</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>DURATION (SEC)</label>
                                    <input type="number" style={fieldStyle} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="120" />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>OUTCOME</label>
                                <select style={fieldStyle} value={form.outcome} onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))}>
                                    {Object.entries(OUTCOME_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>CALL NOTES</label>
                                <textarea style={{ ...fieldStyle, resize: 'none', height: '70px' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Summary of the conversation..." />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowForm(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', background: 'none', fontSize: '12px' }}>Cancel</button>
                            <button onClick={logCall} disabled={!form.customerId} className="btn-glow" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600, opacity: form.customerId ? 1 : 0.5 }}>Save Call</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Calls List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : calls.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No calls logged yet. Start tracking!</p>
                </div>
            ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Duration</th>
                                <th>Outcome</th>
                                <th>Notes</th>
                                <th>Agent</th>
                                <th>Date & Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calls.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{c.customer.firstName} {c.customer.lastName}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.customer.phone}</p>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '13px' }}>{c.type === 'OUTGOING' ? '📤' : c.type === 'INCOMING' ? '📥' : '📵'}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>{c.type}</span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : '—'}
                                    </td>
                                    <td>
                                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '11px', fontWeight: 600, background: OUTCOME_COLORS[c.outcome] || 'rgba(255,255,255,0.05)', color: c.outcome === 'POLICY_SOLD' ? '#10b981' : c.outcome === 'NOT_INTERESTED' ? '#ef4444' : 'var(--text-secondary)' }}>
                                            {OUTCOME_LABELS[c.outcome] || c.outcome}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                                        <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes || '—'}</p>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.agent.name}</td>
                                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(c.callDate).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
