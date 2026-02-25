'use client'

import { useState, useEffect } from 'react'

interface User {
    id: string
    name: string
    email: string
    role: string
    phone: string
    aadharNo: string
    panNo: string
    aadharFront: string
    aadharBack: string
    panPhoto: string
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<Partial<User>>({})
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetch('/api/profile')
            .then(r => r.json())
            .then(d => {
                if (d.user) {
                    setUser(d.user)
                    setForm(d.user)
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, [key]: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const d = await res.json()
            if (res.ok) {
                setUser(d.user)
                setSuccess('Profile updated successfully!')
            } else {
                setError(d.error || 'Failed to update profile')
            }
        } catch {
            setError('Network error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )

    if (!user) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Not logged in.</div>

    const fieldStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%' }
    const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }

    return (
        <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Your Profile</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Manage your account settings and KYC verification</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Basic Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Full Name</label>
                            <input type="text" style={fieldStyle} value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Email (Read-only)</label>
                            <input type="email" style={{ ...fieldStyle, opacity: 0.6 }} value={form.email || ''} readOnly />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone Number</label>
                            <input type="tel" style={fieldStyle} value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>Role</label>
                            <input type="text" style={{ ...fieldStyle, opacity: 0.6 }} value={form.role || ''} readOnly />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>KYC Verification</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Aadhar Card Number</label>
                            <input type="text" style={fieldStyle} placeholder="1234 5678 9012" value={form.aadharNo || ''} onChange={e => setForm(p => ({ ...p, aadharNo: e.target.value }))} />
                        </div>
                        <div>
                            <label style={labelStyle}>PAN Card Number</label>
                            <input type="text" style={fieldStyle} placeholder="ABCDE1234F" value={form.panNo || ''} onChange={e => setForm(p => ({ ...p, panNo: e.target.value }))} />
                        </div>

                        {/* File Uploads */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Aadhar Front</label>
                                    <div style={{ position: 'relative', height: '140px', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {form.aadharFront ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={form.aadharFront} alt="Aadhar Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload Front</span>
                                        )}
                                        <input type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, 'aadharFront')} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Aadhar Back</label>
                                    <div style={{ position: 'relative', height: '140px', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {form.aadharBack ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={form.aadharBack} alt="Aadhar Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload Back</span>
                                        )}
                                        <input type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, 'aadharBack')} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>PAN Card Photo</label>
                                    <div style={{ position: 'relative', height: '140px', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {form.panPhoto ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={form.panPhoto} alt="PAN Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload PAN</span>
                                        )}
                                        <input type="file" accept="image/*" capture="environment" onChange={e => handleFileChange(e, 'panPhoto')} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>⚠ {error}</p>}
                {success && <p style={{ color: 'var(--accent-green)', fontSize: '14px' }}>✔ {success}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button type="submit" disabled={saving} className="btn-glow" style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '14px', fontWeight: 700 }}>
                        {saving ? 'Updating...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
