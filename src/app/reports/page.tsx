'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface FinancialData {
    summary: { totalPremium: number; totalCommission: number; policyCount: number }
    byType: Record<string, { premium: number; commission: number; count: number }>
    byMonth: Record<string, { premium: number; commission: number }>
    byAgent: Array<{ agentName: string; premium: number; commission: number; count: number }>
}

export default function ReportsPage() {
    const [data, setData] = useState<FinancialData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/reports/financials')
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const exportToExcel = () => {
        if (!data) return
        const wsData = data.byAgent.map(a => ({
            'Agent Name': a.agentName,
            'Policies': a.count,
            'Total Premium': a.premium,
            'Estimated Commission': a.commission
        }))
        const ws = XLSX.utils.json_to_sheet(wsData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Agent Performance')
        XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const exportToPDF = () => {
        if (!data) return
        const doc = new jsPDF()
        doc.setFontSize(18)
        doc.text('Financial Performance Report', 14, 22)
        doc.setFontSize(11)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

        autoTable(doc, {
            startY: 40,
            head: [['Agent', 'Policies', 'Premium (₹)', 'Commission (₹)']],
            body: data.byAgent.map(a => [
                a.agentName,
                a.count,
                a.premium.toLocaleString('en-IN'),
                a.commission.toLocaleString('en-IN')
            ]),
        })
        doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading financial reports...</div>
    if (!data) return <div style={{ padding: '40px', color: '#ef4444' }}>Error loading data (Admins only)</div>

    return (
        <div className="animate-fade-in" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Financial Reports</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Overview of premiums, revenue, and commissions.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={exportToExcel} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        📥 Export Excel
                    </button>
                    <button onClick={exportToPDF} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        📄 Export PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>TOTAL PREMIUM</p>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-blue)' }}>₹{data.summary.totalPremium.toLocaleString('en-IN')}</h2>
                    <p style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>Across {data.summary.policyCount} active policies</p>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>ESTIMATED REVENUE</p>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>₹{data.summary.totalCommission.toLocaleString('en-IN')}</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Average Yield: {((data.summary.totalCommission / data.summary.totalPremium) * 100).toFixed(1)}%</p>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>GROWTH RATE</p>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>+12.4%</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Comparing to last quarter</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
                {/* Agent Performance Table */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Agent Performance</h3>
                    </div>
                    <table className="table-dark">
                        <thead>
                            <tr>
                                <th>Agent</th>
                                <th>Policies</th>
                                <th>Premium</th>
                                <th>Commission</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.byAgent.map(a => (
                                <tr key={a.agentName}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.agentName}</td>
                                    <td>{a.count}</td>
                                    <td style={{ fontWeight: 700 }}>₹{a.premium.toLocaleString('en-IN')}</td>
                                    <td style={{ color: '#10b981', fontWeight: 700 }}>₹{a.commission.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* By Type Breakdown */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>Revenue by Type</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(data.byType).map(([type, stats]) => (
                            <div key={type}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{type}</span>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{stats.premium.toLocaleString('en-IN')}</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(stats.premium / data.summary.totalPremium) * 100}%`,
                                        background: type === 'HEALTH' ? '#10b981' : type === 'MOTOR' ? '#3b82f6' : type === 'LIFE' ? '#8b5cf6' : '#f59e0b'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
