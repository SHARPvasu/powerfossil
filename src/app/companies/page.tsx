'use client'

import { useState, useEffect } from 'react'

interface Product { planName: string; type: string; minPremium: string; commissionPct: string }
interface Company {
    id: string
    name: string
    logo: string | null
    category: string
    contact: string | null
    email: string | null
    website: string | null
    products: string | null
    notes: string | null
    isActive: boolean
    createdAt: string
}

const CATEGORIES = ['HEALTH', 'MOTOR', 'LIFE', 'GENERAL']
const CAT_COLORS: Record<string, string> = { HEALTH: '#10b981', MOTOR: '#3b82f6', LIFE: '#8b5cf6', GENERAL: '#f59e0b' }
const CAT_ICONS: Record<string, string> = { HEALTH: '🏥', MOTOR: '🚗', LIFE: '❤️', GENERAL: '🛡️' }

const emptyForm = { name: '', category: 'HEALTH', contact: '', email: '', website: '', notes: '' }
const emptyProduct: Product = { planName: '', type: 'HEALTH', minPremium: '', commissionPct: '' }

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [products, setProducts] = useState<Product[]>([])
    const [saving, setSaving] = useState(false)
    const [filterCat, setFilterCat] = useState('ALL')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/auth/session').then(r => r.json()).then(d => { if (d.user) setUserRole(d.user.role) }).catch(() => { })
        fetch('/api/companies').then(r => r.json()).then(d => { setCompanies(d.companies || []); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    function openAdd() { setForm(emptyForm); setProducts([]); setEditId(null); setShowForm(true) }
    function openEdit(c: Company) {
        setForm({ name: c.name, category: c.category, contact: c.contact || '', email: c.email || '', website: c.website || '', notes: c.notes || '' })
        setProducts(c.products ? JSON.parse(c.products) : [])
        setEditId(c.id); setShowForm(true)
    }

    async function save() {
        setSaving(true)
        const body = { ...form, products }
        if (editId) {
            const res = await fetch(`/api/companies/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            const d = await res.json()
            if (res.ok) setCompanies(prev => prev.map(c => c.id === editId ? d.company : c))
        } else {
            const res = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            const d = await res.json()
            if (res.ok) setCompanies(prev => [...prev, d.company])
        }
        setSaving(false); setShowForm(false); setEditId(null)
    }

    async function deleteCompany(id: string) {
        if (!confirm('Delete this company tie-up?')) return
        await fetch(`/api/companies/${id}`, { method: 'DELETE' })
        setCompanies(prev => prev.filter(c => c.id !== id))
    }

    const inputS: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', width: '100%' }

    const filtered = companies.filter(c => filterCat === 'ALL' || c.category === filterCat)

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    return (
        <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '1100px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>🤝 Insurance Company Tie-ups</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Manage all insurance companies your agency works with and their products</p>
                </div>
                {userRole === 'ADMIN' && (
                    <button onClick={openAdd} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--gradient-primary)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        + Add Company
                    </button>
                )}
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
                {CATEGORIES.map(cat => {
                    const count = companies.filter(c => c.category === cat && c.isActive).length
                    return (
                        <button key={cat} onClick={() => setFilterCat(f => f === cat ? 'ALL' : cat)}
                            style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${filterCat === cat ? CAT_COLORS[cat] : 'var(--border)'}`, background: filterCat === cat ? `${CAT_COLORS[cat]}12` : 'var(--bg-card)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                            <p style={{ fontSize: '20px' }}>{CAT_ICONS[cat]}</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: CAT_COLORS[cat], marginTop: '4px' }}>{count}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{cat}</p>
                        </button>
                    )
                })}
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                            {editId ? '✏️ Edit Company' : '➕ Add Insurance Company'}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Company Name *</label>
                                <input style={inputS} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Star Health Insurance" />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category</label>
                                <select style={inputS} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Contact Number</label>
                                <input style={inputS} value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="1800-XXX-XXXX" />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email</label>
                                <input style={inputS} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="support@company.com" />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Website</label>
                                <input style={inputS} value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="www.company.com" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notes</label>
                                <input style={inputS} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any tie-up details, special terms..." />
                            </div>
                        </div>

                        {/* Products */}
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>📦 Products / Plans</label>
                                <button onClick={() => setProducts(p => [...p, { ...emptyProduct }])}
                                    style={{ padding: '5px 12px', borderRadius: '7px', border: 'none', background: 'rgba(99,102,241,0.15)', color: 'var(--accent-blue)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                    + Add Plan
                                </button>
                            </div>
                            {products.map((prod, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
                                    <input style={inputS} placeholder="Plan name" value={prod.planName} onChange={e => setProducts(p => p.map((x, i) => i === idx ? { ...x, planName: e.target.value } : x))} />
                                    <select style={inputS} value={prod.type} onChange={e => setProducts(p => p.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))}>
                                        <option value="HEALTH">Health</option><option value="MOTOR">Motor</option><option value="LIFE">Life</option><option value="TERM">Term</option>
                                    </select>
                                    <input style={inputS} placeholder="Min ₹" type="number" value={prod.minPremium} onChange={e => setProducts(p => p.map((x, i) => i === idx ? { ...x, minPremium: e.target.value } : x))} />
                                    <input style={inputS} placeholder="Comm %" type="number" value={prod.commissionPct} onChange={e => setProducts(p => p.map((x, i) => i === idx ? { ...x, commissionPct: e.target.value } : x))} />
                                    <button onClick={() => setProducts(p => p.filter((_, i) => i !== idx))} style={{ padding: '8px', borderRadius: '7px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                            {products.length > 0 && (
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Plan Name · Type · Min Premium (₹) · Commission %</p>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ padding: '9px 18px', borderRadius: '9px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={save} disabled={saving || !form.name} style={{ padding: '9px 22px', borderRadius: '9px', border: 'none', background: 'var(--gradient-primary)', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                                {saving ? 'Saving...' : editId ? 'Update' : 'Add Company'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Company Cards */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>🤝</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No insurance companies added yet</p>
                    {userRole === 'ADMIN' && <button onClick={openAdd} style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--gradient-primary)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add First Company</button>}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(c => {
                        const parsedProducts: Product[] = c.products ? JSON.parse(c.products) : []
                        const isExpanded = expandedId === c.id
                        return (
                            <div key={c.id} style={{ background: 'var(--bg-card)', border: `1px solid ${c.isActive ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '14px', padding: '20px 24px', opacity: c.isActive ? 1 : 0.6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${CAT_COLORS[c.category]}15`, border: `1px solid ${CAT_COLORS[c.category]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                                            {CAT_ICONS[c.category]}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</h3>
                                                <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, background: `${CAT_COLORS[c.category]}15`, color: CAT_COLORS[c.category] }}>{c.category}</span>
                                                {!c.isActive && <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '10px', color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>INACTIVE</span>}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                {c.contact && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>📞 {c.contact}</span>}
                                                {c.email && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✉️ {c.email}</span>}
                                                {c.website && <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>🌐 {c.website}</a>}
                                            </div>
                                            {c.notes && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>{c.notes}</p>}
                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Added: {fmtDate(c.createdAt)} · {parsedProducts.length} plan{parsedProducts.length !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        {parsedProducts.length > 0 && (
                                            <button onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                                {isExpanded ? '▲ Plans' : `▼ ${parsedProducts.length} Plans`}
                                            </button>
                                        )}
                                        {userRole === 'ADMIN' && (
                                            <>
                                                <button onClick={() => openEdit(c)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>✏️</button>
                                                <button onClick={() => deleteCompany(c.id)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}>🗑️</button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Products */}
                                {isExpanded && parsedProducts.length > 0 && (
                                    <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                                        {parsedProducts.map((p, i) => (
                                            <div key={i} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.planName}</p>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '5px', background: `${CAT_COLORS[p.type] || '#6b7280'}15`, color: CAT_COLORS[p.type] || '#6b7280', fontWeight: 700 }}>{p.type}</span>
                                                    {p.minPremium && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹{Number(p.minPremium).toLocaleString('en-IN')}+</span>}
                                                    {p.commissionPct && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>🤝 {p.commissionPct}%</span>}
                                                </div>
                                            </div>
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
