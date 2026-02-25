'use client'

import { useState, useEffect } from 'react'

interface WhatsAppLog {
    id: string;
    sentAt: string;
    customerName: string;
    phone: string;
    messageType: string;
    status: string;
    errorMessage?: string;
}

export default function WhatsAppLogsPage() {
    const [logs, setLogs] = useState<WhatsAppLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/whatsapp-logs')
            .then(res => res.json())
            .then(data => {
                setLogs(data.logs || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="p-8"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mt-20"></div></div>

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-geist-sans)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    <span style={{ color: '#25D366' }}>WhatsApp</span> Message Logs
                </h1>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                {logs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No messages sent yet. The cron job will populate this log automatically.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Date & Time</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Customer</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Phone</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Type</th>
                                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'default' }}>
                                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                                        {new Date(log.sentAt).toLocaleString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.customerName}</td>
                                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{log.phone}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                            background: log.messageType === 'BIRTHDAY' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                            color: log.messageType === 'BIRTHDAY' ? '#f59e0b' : '#10b981',
                                            border: `1px solid ${log.messageType === 'BIRTHDAY' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                        }}>
                                            {log.messageType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        {log.status === 'SUCCESS' ? (
                                            <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
                                                Delivered
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }} />
                                                    Failed
                                                </span>
                                                {log.errorMessage && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{log.errorMessage}</span>}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
