'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface StageCustomer {
    id: string
    firstName: string
    lastName: string
    phone: string
    email: string
    leadSource: string
    leadDate: string
    pitchedDate: string | null
    interestedDate: string | null
    convertedDate: string | null
    lostDate: string | null
    lostReason: string | null
    stage: string
    createdAt: string
    agent: { name: string }
    policies: { id: string }[]
}

const STAGES = [
    { key: 'LEAD', label: '📋 Lead', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
    { key: 'PITCHED', label: '💬 Pitched', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    { key: 'INTERESTED', label: '🤩 Interested', color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
    { key: 'CONVERTED', label: '✅ Converted', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    { key: 'LOST', label: '❌ Lost', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
]

const LEAD_SOURCES: Record<string, string> = {
    WALK_IN: '🚶 Walk-in', REFERRAL: '🤝 Referral', COLD_CALL: '📞 Cold Call',
    SOCIAL_MEDIA: '📱 Social Media', WEBSITE: '🌐 Website', CAMP: '⛺ Camp/Event', OTHER: '💡 Other'
}

function fmtDate(d: string | null | undefined) {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function daysSince(d: string | null | undefined) {
    if (!d) return null
    return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
}

export default function LeadsPage() {
    const [customers, setCustomers] = useState<StageCustomer[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('ALL')
    const [search, setSearch] = useState('')
    const [userRole, setUserRole] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [lostModal, setLostModal] = useState<{ id: string } | null>(null)
    const [lostReason, setLostReason] = useState('')
    const [view, setView] = useState<'pipeline' | 'list'>('pipeline')

    useEffect(() => {
        fetch('/api/auth/session').then(r => r.json()).then(d => { if (d.user) setUserRole(d.user.role) }).catch(() => { })
        fetch('/api/customers?limit=500')
            .then(r => r.json())
            .then(d => { setCustomers(d.customers || []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    async function updateStage(id: string, stage: string, reason?: string) {
        setUpdatingId(id)
        await fetch(`/api/customers/${id}/stage`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage, lostReason: reason })
        })
        setCustomers(prev => prev.map(c => c.id === id ? {
            ...c, stage,
            pitchedDate: stage === 'PITCHED' ? new Date().toISOString() : c.pitchedDate,
            interestedDate: stage === 'INTERESTED' ? new Date().toISOString() : c.interestedDate,
            convertedDate: stage === 'CONVERTED' ? new Date().toISOString() : c.convertedDate,
            lostDate: stage === 'LOST' ? new Date().toISOString() : c.lostDate,
            lostReason: reason || c.lostReason,
        } : c))
        setUpdatingId(null)
        setLostModal(null)
        setLostReason('')
    }

    const filtered = customers.filter(c => {
        const matchStage = filter === 'ALL' || c.stage === filter
        const matchSearch = !search || `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
        return matchStage && matchSearch
    })

    const stageCounts = STAGES.reduce((acc, s) => { acc[s.key] = customers.filter(c => c.stage === s.key).length; return acc }, {} as Record<string, number>)

    const inputS: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    return (
        <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '1400px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>🔄 Sales Pipeline</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Track every lead from first contact to policy conversion — with dates</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => setView(v => v === 'pipeline' ? 'list' : 'pipeline')} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        {view === 'pipeline' ? '📋 List View' : '🗂️ Pipeline View'}
                    </button>
                    {userRole !== 'AUDITOR' && (
                        <Link href="/customers/new" style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--gradient-primary)', color: 'white', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                            + Add Lead
                        </Link>
                    )}
                </div>
            </div>

            {/* Stage Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '20px' }}>
                {STAGES.map(s => (
                    <button key={s.key} onClick={() => setFilter(f => f === s.key ? 'ALL' : s.key)}
                        style={{ padding: '14px 12px', borderRadius: '12px', border: `1px solid ${filter === s.key ? s.color : s.border}`, background: filter === s.key ? s.bg : 'var(--bg-card)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', boxShadow: filter === s.key ? `0 0 12px ${s.color}20` : 'none' }}>
                        <p style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{stageCounts[s.key] || 0}</p>
                        <p style={{ fontSize: '11px', color: filter === s.key ? s.color : 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{s.label}</p>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '20px' }}>
                <input style={{ ...inputS, maxWidth: '360px' }} placeholder="🔍 Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* PIPELINE VIEW */}
            {view === 'pipeline' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', alignItems: 'start' }}>
                    {STAGES.map(stage => {
                        const stageCusts = filtered.filter(c => c.stage === stage.key)
                        return (
                            <div key={stage.key} style={{ background: stage.bg, border: `1px solid ${stage.border}`, borderRadius: '12px', padding: '12px', minHeight: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: 700, color: stage.color }}>{stage.label}</p>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: stage.color, background: `${stage.color}20`, padding: '2px 7px', borderRadius: '999px' }}>{stageCusts.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {stageCusts.map(c => (
                                        <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
                                            <Link href={`/customers/${c.id}`} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', display: 'block' }}>
                                                {c.firstName} {c.lastName}
                                            </Link>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.phone}</p>
                                            {c.leadSource && <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{LEAD_SOURCES[c.leadSource] || c.leadSource}</p>}
                                            {/* Stage dates */}
                                            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '10px', color: stage.color }}>📅 Lead: {fmtDate(c.leadDate)}</span>
                                                {c.pitchedDate && <span style={{ fontSize: '10px', color: '#f59e0b' }}>💬 Pitched: {fmtDate(c.pitchedDate)}</span>}
                                                {c.interestedDate && <span style={{ fontSize: '10px', color: '#06b6d4' }}>🤩 Interested: {fmtDate(c.interestedDate)}</span>}
                                                {c.convertedDate && <span style={{ fontSize: '10px', color: '#10b981' }}>✅ Converted: {fmtDate(c.convertedDate)}</span>}
                                                {c.lostDate && <span style={{ fontSize: '10px', color: '#ef4444' }}>❌ Lost: {fmtDate(c.lostDate)}</span>}
                                                {c.lostReason && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{c.lostReason}</span>}
                                            </div>
                                            {/* Move stage buttons */}
                                            {userRole !== 'AUDITOR' && (
                                                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {STAGES.filter(s2 => s2.key !== stage.key).map(s2 => (
                                                        <button key={s2.key} disabled={updatingId === c.id}
                                                            onClick={() => s2.key === 'LOST' ? setLostModal({ id: c.id }) : updateStage(c.id, s2.key)}
                                                            style={{ padding: '3px 7px', borderRadius: '5px', border: `1px solid ${s2.border}`, background: s2.bg, color: s2.color, fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}>
                                                            {s2.label.split(' ')[0]}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {stageCusts.length === 0 && <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No leads</p>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                // LIST VIEW
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table className="table-dark" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Name</th><th>Phone</th><th>Source</th><th>Stage</th>
                                <th>Lead Date</th><th>Days in Stage</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No leads found</td></tr>
                            ) : filtered.map(c => {
                                const stageInfo = STAGES.find(s => s.key === c.stage)!
                                const lastDate = c.lostDate || c.convertedDate || c.interestedDate || c.pitchedDate || c.leadDate
                                const days = daysSince(lastDate)
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <Link href={`/customers/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                                                {c.firstName} {c.lastName}
                                            </Link>
                                            <br /><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.agent?.name}</span>
                                        </td>
                                        <td>{c.phone}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{LEAD_SOURCES[c.leadSource] || c.leadSource || '—'}</td>
                                        <td>
                                            <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: stageInfo.bg, color: stageInfo.color, border: `1px solid ${stageInfo.border}` }}>
                                                {stageInfo.label}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {fmtDate(c.leadDate)}<br />
                                            {c.pitchedDate && <span style={{ color: '#f59e0b' }}>→ {fmtDate(c.pitchedDate)}</span>}<br />
                                            {c.interestedDate && <span style={{ color: '#06b6d4' }}>→ {fmtDate(c.interestedDate)}</span>}<br />
                                            {c.convertedDate && <span style={{ color: '#10b981' }}>→ {fmtDate(c.convertedDate)}</span>}
                                            {c.lostDate && <span style={{ color: '#ef4444' }}>→ {fmtDate(c.lostDate)}</span>}
                                        </td>
                                        <td style={{ fontSize: '12px', color: days !== null && days > 30 ? '#ef4444' : 'var(--text-muted)' }}>
                                            {days !== null ? `${days}d` : '—'}
                                        </td>
                                        <td>
                                            {userRole !== 'AUDITOR' && (
                                                <select value={c.stage} disabled={updatingId === c.id}
                                                    onChange={e => e.target.value === 'LOST' ? setLostModal({ id: c.id }) : updateStage(c.id, e.target.value)}
                                                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>
                                                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Lost Reason Modal */}
            {lostModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '400px', maxWidth: '90vw' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>❌ Mark as Lost</h3>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Reason for losing this lead</label>
                        <input style={inputS} placeholder="e.g. Premium too high, went with competitor..." value={lostReason} onChange={e => setLostReason(e.target.value)} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setLostModal(null); setLostReason('') }} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => updateStage(lostModal.id, 'LOST', lostReason)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.8)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Confirm Lost</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
