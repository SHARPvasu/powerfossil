'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface User {
    id: string
    name: string
    email: string
    role: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized')
                return res.json()
            })
            .then(data => {
                setUser(data.user)
                setLoading(false)
            })
            .catch(() => {
                router.push('/')
            })
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen animated-bg flex items-center justify-center">
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        border: '3px solid rgba(99,102,241,0.2)',
                        borderTop: '3px solid var(--accent-blue)',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading UV Insurance Agency...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    const marginLeft = sidebarCollapsed ? 64 : 240

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Sidebar
                userRole={user?.role || ''}
                userName={user?.name || ''}
                userEmail={user?.email || ''}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <main
                style={{
                    marginLeft,
                    flex: 1,
                    minHeight: '100vh',
                    transition: 'margin-left 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children}
            </main>
        </div>
    )
}
