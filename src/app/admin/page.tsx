'use client'

import { useState, useEffect } from 'react'

interface User {
    id: string
    name: string
    email: string
    role: string
    phone: string
    createdAt: string
    _count?: { customers: number; policies: number; calls: number }
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'AGENT', phone: '' })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/admin/users')
            .then(r => r.json())
            .then(d => { setUsers(d.users || []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    async function createUser() {
        if (!form.name || !form.email || !form.password) {
            setError('Name, email and password are required')
            return
        }
        setSaving(true)
        setError('')
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        const d = await res.json()
        if (!res.ok) setError(d.error || 'Failed')
        else {
            setUsers(prev => [...prev, d.user])
            setShowAdd(false)
            setForm({ name: '', email: '', password: '', role: 'AGENT', phone: '' })
        }
        setSaving(false)
    }

    async function deleteUser(id: string) {
        if (!confirm('Are you sure?')) return
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
        setUsers(prev => prev.filter(u => u.id !== id))
    }

    const fieldStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '9px 12px', fontSize: '13px', outline: 'none', width: '100%' }
    const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' }

    const roleColors: Record<string, string> = {
        ADMIN: 'rgba(239,68,68,0.15)',
        AGENT: 'rgba(99,102,241,0.15)',
        AUDITOR: 'rgba(245,158,11,0.15)',
    }
    const roleTextColors: Record<string, string> = {
        ADMIN: '#ef4444',
        AGENT: 'var(--accent-blue)',
        AUDITOR: '#f59e0b',
    }

    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Panel</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Manage users and system settings</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-glow" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600 }}>
                    + Add User
                </button>
            </div>

            {/* Add User Modal */}
            {showAdd && (
                <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)', width: '440px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', fontSize: '16px' }}>Add New User</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Full Name', key: 'name', placeholder: 'Rahul Sharma', type: 'text' },
                                { label: 'Email', key: 'email', placeholder: 'rahul@powerfossil.in', type: 'email' },
                                { label: 'Password', key: 'password', placeholder: '••••••••', type: 'password' },
                                { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210', type: 'tel' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={labelStyle}>{f.label}</label>
                                    <input type={f.type} style={fieldStyle} placeholder={f.placeholder} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                            <div>
                                <label style={labelStyle}>Role</label>
                                <select style={fieldStyle} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                    <option value="AGENT">Agent</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="AUDITOR">Auditor</option>
                                </select>
                            </div>
                        </div>
                        {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px' }}>{error}</p>}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAdd(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', background: 'none', fontSize: '12px' }}>Cancel</button>
                            <button onClick={createUser} disabled={saving} className="btn-glow" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>{saving ? 'Creating...' : 'Create User'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Phone</th>
                                <th>Customers</th>
                                <th>Policies</th>
                                <th>Calls</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                return (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
                                                <div>
                                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{u.name}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '11px', fontWeight: 700, background: roleColors[u.role] || 'rgba(255,255,255,0.05)', color: roleTextColors[u.role] || 'var(--text-secondary)' }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                                        <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{u._count?.customers || 0}</td>
                                        <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{u._count?.policies || 0}</td>
                                        <td style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{u._count?.calls || 0}</td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            <button onClick={() => deleteUser(u.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
