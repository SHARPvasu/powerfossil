'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WhatsAppSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [feedback, setFeedback] = useState('')

    const [settings, setSettings] = useState({
        phoneNumberId: '',
        accessToken: '',
        isActive: false
    })

    useEffect(() => {
        fetch('/api/settings/whatsapp')
            .then(res => {
                if (res.status === 401) {
                    router.push('/login')
                    throw new Error('Unauthorized')
                }
                return res.json()
            })
            .then(data => {
                if (data.settings) {
                    setSettings({
                        phoneNumberId: data.settings.phoneNumberId || '',
                        accessToken: data.settings.accessToken || '',
                        isActive: data.settings.isActive || false
                    })
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [router])

    async function handleSave() {
        setSaving(true)
        setFeedback('')
        try {
            const res = await fetch('/api/settings/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (res.ok) {
                setFeedback('Settings saved successfully! 🚀')
            } else {
                setFeedback('Failed to save settings.')
            }
        } catch {
            setFeedback('An error occurred.')
        }
        setSaving(false)
    }

    if (loading) return <div className="p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mt-20"></div></div>

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#25D366' }}>WhatsApp</span> Bot Settings
                </h1>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(37, 211, 102, 0.05)', border: '1px solid rgba(37, 211, 102, 0.2)', padding: '20px', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ fontSize: '24px' }}>ℹ️</div>
                    <div>
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>Meta Business API Required</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                            To send automated background messages, you must use the official Meta Graph API.
                            Create a free app at <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}>developers.facebook.com</a> to retrieve your Phone Number ID and System User Access Token.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', border: '1px solid var(--border)', borderRadius: '10px', background: settings.isActive ? 'rgba(37, 211, 102, 0.05)' : 'var(--bg-secondary)', transition: 'all 0.2s' }}>
                        <input
                            type="checkbox"
                            checked={settings.isActive}
                            onChange={e => setSettings(s => ({ ...s, isActive: e.target.checked }))}
                            style={{ width: '20px', height: '20px', accentColor: '#25D366' }}
                        />
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>Enable Automated Bot</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>If enabled, the daily cron job will dispatch Birthday and Renewal messages.</div>
                        </div>
                    </label>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Meta Phone Number ID</label>
                        <input
                            type="text"
                            value={settings.phoneNumberId}
                            onChange={e => setSettings(s => ({ ...s, phoneNumberId: e.target.value }))}
                            placeholder="e.g. 101234567890123"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>System User Access Token</label>
                        <textarea
                            value={settings.accessToken}
                            onChange={e => setSettings(s => ({ ...s, accessToken: e.target.value }))}
                            placeholder="EAAI... (very long string)"
                            rows={4}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' }}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Ensure this token is set to Never Expire.</p>
                    </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '12px 24px',
                            background: '#25D366',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {saving ? 'Saving...' : '💾 Save Configurations'}
                    </button>

                    {feedback && (
                        <span style={{ fontSize: '13px', fontWeight: 500, color: feedback.includes('successfully') ? '#10b981' : '#ef4444' }}>
                            {feedback}
                        </span>
                    )}
                </div>

            </div>
        </div>
    )
}
