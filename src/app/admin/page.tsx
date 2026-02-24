'use client'

import { useState, useEffect } from 'react'

interface User {
    id: string
    name: string
    email: string
    role: string
    phone: string
    aadharNo?: string
    panNo?: string
    aadharFront?: string
    aadharBack?: string
    panPhoto?: string
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
    const [otpModalOpen, setOtpModalOpen] = useState(false)
    const [otpCode, setOtpCode] = useState('')

    useEffect(() => {
        fetch('/api/admin/users')
            .then(r => r.json())
            .then(d => { setUsers(d.users || []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    async function createUser() {
        if (!form.name || !form.email || !form.password || !form.phone) {
            setError('Name, email, password and phone are required')
            return
        }
        setSaving(true)
        setError('')

        try {
            // STEP 1: Dispatch OTP
            const otpRes = await fetch('/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: form.phone, type: 'phone' })
            })
            const otpData = await otpRes.json()
            if (!otpRes.ok) {
                setError(otpData.error || 'Failed to send OTP')
                setSaving(false)
                return
            }

            // Show the OTP Modal to proceed
            setSaving(false)
            setOtpModalOpen(true)
        } catch {
            setError('Network error during OTP dispatch')
            setSaving(false)
        }
    }

    async function verifyAndSubmit() {
        if (!otpCode || otpCode.length < 6) {
            alert('Please enter a 6-digit OTP code.')
            return
        }
        setSaving(true)
        setError('')

        try {
            // STEP 2: Verify OTP
            const verifyRes = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: form.phone, code: otpCode })
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) {
                setError(verifyData.error || 'Invalid OTP code')
                setSaving(false)
                return
            }

            // STEP 3: Complete User Creation
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const d = await res.json()
            if (!res.ok) {
                setError(d.error || 'Failed')
            } else {
                setUsers(prev => [...prev, d.user])
                setShowAdd(false)
                setOtpModalOpen(false)
                setForm({ name: '', email: '', password: '', role: 'AGENT', phone: '' })
                setOtpCode('')
            }
        } catch {
            setError('Network error during final submission')
        } finally {
            setSaving(false)
        }
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
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={async () => {
                            const res = await fetch('/api/cron/renewals')
                            const d = await res.json()
                            if (res.ok) {
                                alert(`Sync Complete! Date checked: ${d.checkedDate}. Notifications created: ${d.notificationsCreated}`)
                            } else {
                                alert(`Sync Failed: ${d.error}`)
                            }
                        }}
                        style={{ padding: '10px 18px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <span>🔄</span> Sync 30D Renewals
                    </button>
                    <button onClick={() => setShowAdd(true)} className="btn-glow" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600 }}>
                        + Add User
                    </button>
                </div>
            </div>

            {/* Add User Modal */}
            {showAdd && (
                <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)', width: '440px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', fontSize: '16px' }}>Add New User</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Full Name', key: 'name', placeholder: 'Rahul Sharma', type: 'text' },
                                { label: 'Email', key: 'email', placeholder: 'rahul@uvinsurance.in', type: 'email' },
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
                            <button onClick={createUser} disabled={saving} className="btn-glow" style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>{saving ? 'Requesting OTP...' : 'Create User'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP Verification Modal */}
            {otpModalOpen && (
                <div className="modal-backdrop">
                    <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border)', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700, fontSize: '18px' }}>Security Verification</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                            An OTP has been sent to the new user&apos;s phone number <strong>{form.phone}</strong>. (Check terminal/console for mock code). Please enter it below to authorize this account creation.
                        </p>
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit code"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--accent-blue)',
                                color: 'var(--text-primary)', fontSize: '20px', letterSpacing: '8px', textAlign: 'center',
                                outline: 'none', marginBottom: '16px'
                            }}
                        />
                        {error && <p style={{ color: '#ef4444', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>⚠ {error}</p>}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="button" onClick={() => { setOtpModalOpen(false); setError(''); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', background: 'none' }}>
                                Cancel
                            </button>
                            <button type="button" onClick={verifyAndSubmit} disabled={saving} className="btn-glow" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                                {saving ? 'Verifying...' : 'Verify OTP ✓'}
                            </button>
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
                                <th>KYC Highlights</th>
                                <th>Phone</th>
                                <th>Customers</th>
                                <th>Policies</th>
                                <th>Joined</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                const hasKyc = !!(u.aadharNo || u.panNo || u.aadharFront || u.panPhoto)
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
                                        <td>
                                            {hasKyc ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    {u.aadharNo && <span title={`Aadhar: ${u.aadharNo}`} style={{ cursor: 'help' }}>🆔</span>}
                                                    {u.panNo && <span title={`PAN: ${u.panNo}`} style={{ cursor: 'help' }}>💳</span>}
                                                    {(u.aadharFront || u.aadharBack || u.panPhoto) && (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {u.aadharFront && <a href={u.aadharFront} target="_blank" rel="noreferrer" title="Aadhar Front" style={{ fontSize: '12px', textDecoration: 'none' }}>Front 🖼️</a>}
                                                            {u.aadharBack && <a href={u.aadharBack} target="_blank" rel="noreferrer" title="Aadhar Back" style={{ fontSize: '12px', textDecoration: 'none' }}>Back 🖼️</a>}
                                                            {u.panPhoto && <a href={u.panPhoto} target="_blank" rel="noreferrer" title="PAN Photo" style={{ fontSize: '12px', textDecoration: 'none' }}>PAN 📄</a>}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending KYC</span>
                                            )}
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
