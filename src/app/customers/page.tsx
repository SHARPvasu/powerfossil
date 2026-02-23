'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'



interface Policy {
    id: string
    type: string
    status: string
    endDate: string
}

interface Customer {
    id: string
    firstName: string
    lastName: string
    phone: string
    email: string
    city: string
    kycStatus: string
    status: string
    createdAt: string
    policies: Policy[]
    agent: { name: string }
}

export default function CustomersPage() {
    const router = useRouter()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)
    const [userRole, setUserRole] = useState<string | null>(null)

    const fetchCustomers = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), limit: '20' })
        if (search) params.set('search', search)
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/customers?${params}`)
        const data = await res.json()
        setCustomers(data.customers || [])
        setTotal(data.total || 0)
        setPages(data.pages || 1)
        setLoading(false)
    }, [search, statusFilter, page])

    useEffect(() => {
        fetch('/api/auth/session').then(r => r.json()).then(d => {
            if (d.user) setUserRole(d.user.role)
        }).catch(() => { })

        const t = setTimeout(fetchCustomers, 300)
        return () => clearTimeout(t)
    }, [fetchCustomers])

    function downloadCsv() {
        if (customers.length === 0) return

        const headers = ['ID', 'First Name', 'Last Name', 'Phone', 'Email', 'City', 'KYC Status', 'Status', 'Agent Name', 'Created At']

        const rows = customers.map(c => [
            c.id,
            `"${c.firstName}"`,
            `"${c.lastName}"`,
            `"${c.phone}"`,
            `"${c.email || ''}"`,
            `"${c.city || ''}"`,
            c.kycStatus,
            c.status,
            `"${c.agent?.name || ''}"`,
            new Date(c.createdAt).toLocaleDateString()
        ])

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    function kycBadge(status: string) {
        const map: Record<string, { label: string; cls: string }> = {
            VERIFIED: { label: '✓ Verified', cls: 'badge badge-active' },
            PENDING: { label: '⏳ Pending', cls: 'badge badge-pending' },
            REJECTED: { label: '✗ Rejected', cls: 'badge badge-expired' },
        }
        const item = map[status] || { label: status, cls: 'badge badge-cancelled' }
        return <span className={item.cls}>{item.label}</span>
    }

    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Customers</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                        {total} total customers
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {userRole === 'ADMIN' && (
                        <button onClick={downloadCsv} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                            color: 'white', cursor: 'pointer',
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Export CSV
                        </button>
                    )}
                    {userRole !== 'AUDITOR' && (
                        <Link href="/customers/new" style={{
                            background: 'var(--gradient-primary)',
                            color: 'white', textDecoration: 'none',
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            Add Customer
                        </Link>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        id="customer-search"
                        type="text"
                        className="input-dark"
                        placeholder="Search by name, phone, Aadhar..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                        style={{ paddingLeft: '38px' }}
                    />
                </div>
                <select
                    className="input-dark"
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                    style={{ width: '160px' }}
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : customers.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <svg style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.4 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No customers found</p>
                        <Link href="/customers/new" style={{ color: 'var(--accent-blue)', fontSize: '12px', marginTop: '8px', display: 'block' }}>Add your first customer →</Link>
                    </div>
                ) : (
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>City</th>
                                <th>KYC Status</th>
                                <th>Policies</th>
                                <th>Agent</th>
                                <th>Added</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/customers/${c.id}`)}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: '8px',
                                                background: 'var(--gradient-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
                                            }}>
                                                {c.firstName[0]}{c.lastName[0]}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                                                    {c.firstName} {c.lastName}
                                                    {c.status === 'PENDING_APPROVAL' && (
                                                        <span className="badge badge-pending" style={{ marginLeft: 6, fontSize: '10px', padding: '2px 6px' }}>Requires Approval</span>
                                                    )}
                                                </p>
                                                {c.email && <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{c.email}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{c.phone}</td>
                                    <td>{c.city || '—'}</td>
                                    <td>{kycBadge(c.kycStatus)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {c.policies.length === 0 ? (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                                            ) : (
                                                c.policies.slice(0, 3).map(p => (
                                                    <span key={p.id} className={`badge badge-${p.type.toLowerCase()}`}>{p.type}</span>
                                                ))
                                            )}
                                            {c.policies.length > 3 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{c.policies.length - 3}</span>}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '12px' }}>{c.agent?.name || '—'}</td>
                                    <td style={{ fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <Link href={`/customers/${c.id}`} style={{ color: 'var(--accent-blue)', fontSize: '12px', textDecoration: 'none', fontWeight: 600, padding: '4px 10px', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px' }}>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border)' }}>
                        {Array.from({ length: pages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                style={{
                                    width: 32, height: 32, borderRadius: '8px', border: 'none', cursor: 'pointer',
                                    background: page === i + 1 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                                    color: page === i + 1 ? 'white' : 'var(--text-secondary)',
                                    fontSize: '13px', fontWeight: 600,
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
