'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        label: 'Customers',
        href: '/customers',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
    },
    {
        label: 'Policies',
        href: '/policies',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    },
    {
        label: 'Renewals',
        href: '/renewals',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
        ),
    },
    {
        label: 'Call Tracker',
        href: '/calls',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.15h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.7a16 16 0 0 0 6.29 6.29l.83-.83a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
        ),
    },
    {
        label: 'Reports',
        href: '/reports',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
                <line x1="2" y1="20" x2="22" y2="20" />
            </svg>
        ),
    },
]

const adminItems = [
    {
        label: 'Admin Panel',
        href: '/admin',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M1 12a11 11 0 0 0 22-.01" />
            </svg>
        ),
    },
]

interface SidebarProps {
    userRole: string
    userName: string
    userEmail: string
    collapsed?: boolean
    onToggle?: () => void
}

export default function Sidebar({ userRole, userName, userEmail, collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [loggingOut, setLoggingOut] = useState(false)

    async function handleLogout() {
        setLoggingOut(true)
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    const initials = userName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

    return (
        <aside
            id="sidebar"
            style={{
                width: collapsed ? '64px' : '240px',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 40,
                transition: 'width 0.3s ease',
                overflow: 'hidden',
            }}
        >
            {/* Top Brand */}
            <div style={{
                padding: collapsed ? '16px 12px' : '20px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                borderBottom: '1px solid var(--border)',
                minHeight: '72px',
                transition: 'padding 0.3s ease',
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 15px rgba(99,102,241,0.3)',
                }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>UV</span>
                </div>
                {!collapsed && (
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>PowerFossil</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Insurance</div>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '6px',
                        flexShrink: 0,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {collapsed ? <><polyline points="9 18 15 12 9 6" /></> : <><polyline points="15 18 9 12 15 6" /></>}
                    </svg>
                </button>
            </div>

            {/* Nav Items */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '12px 8px' : '12px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navItems.map(item => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="sidebar-link"
                            style={{
                                background: isActive ? 'rgba(99, 102, 241, 0.15)' : undefined,
                                color: isActive ? 'var(--accent-blue)' : undefined,
                                border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                                justifyContent: collapsed ? 'center' : undefined,
                                padding: collapsed ? '10px' : '10px 12px',
                                title: collapsed ? item.label : undefined,
                            }}
                            title={collapsed ? item.label : undefined}
                        >
                            <span style={{ flexShrink: 0 }}>{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}

                {userRole === 'ADMIN' && (
                    <>
                        <div style={{ margin: '12px 0 4px', padding: collapsed ? '0 4px' : '0 4px' }}>
                            {!collapsed && <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>Admin</span>}
                            {collapsed && <div style={{ height: '1px', background: 'var(--border)' }} />}
                        </div>
                        {adminItems.map(item => {
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="sidebar-link"
                                    style={{
                                        background: isActive ? 'rgba(99, 102, 241, 0.15)' : undefined,
                                        color: isActive ? 'var(--accent-blue)' : undefined,
                                        border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                                        justifyContent: collapsed ? 'center' : undefined,
                                        padding: collapsed ? '10px' : '10px 12px',
                                    }}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            )
                        })}
                    </>
                )}
            </nav>

            {/* User Profile */}
            <div style={{
                padding: collapsed ? '12px 8px' : '12px 12px',
                borderTop: '1px solid var(--border)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: collapsed ? '8px' : '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    justifyContent: collapsed ? 'center' : undefined,
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '8px',
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
                    }}>
                        {initials}
                    </div>
                    {!collapsed && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userRole}</div>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            title="Logout"
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', display: 'flex', padding: '4px',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}
