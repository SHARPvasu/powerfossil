'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'



interface FamilyMember { id: string; name: string; relation: string; dob: string; gender: string; preExisting: string; insured: boolean }
interface Note { id: string; content: string; type: string; createdAt: string; agent: { name: string } }
interface CallLog { id: string; type: string; duration: number; notes: string; outcome: string; callDate: string; agent: { name: string } }
interface Policy { id: string; policyNumber: string; type: string; subType: string; company: string; planName: string; sumInsured: number; premium: number; startDate: string; endDate: string; status: string; tags: string }
interface Customer {
    id: string; firstName: string; lastName: string; phone: string; email: string; dob: string; gender: string
    address: string; city: string; state: string; pincode: string; occupation: string; income: string
    aadharNo: string; panNo: string; kycStatus: string; livePhoto: string; preExisting: string; status: string; createdAt: string
    agent: { name: string; email: string }
    policies: Policy[]; family: FamilyMember[]; notes: Note[]; callLogs: CallLog[]
}

const TAB_LIST = ['Overview', 'Policies', 'Family', 'Notes & Calls', 'KYC']

export default function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const [customer, setCustomer] = useState<Customer | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('Overview')
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<Customer>>({})
    const [saving, setSaving] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)

    // Note form
    const [noteContent, setNoteContent] = useState('')
    const [noteType, setNoteType] = useState('GENERAL')
    const [addingNote, setAddingNote] = useState(false)

    // Call form
    const [showCallForm, setShowCallForm] = useState(false)
    const [callForm, setCallForm] = useState({ type: 'OUTGOING', duration: '', notes: '', outcome: 'INTERESTED' })

    // Family form
    const [showFamilyForm, setShowFamilyForm] = useState(false)
    const [familyForm, setFamilyForm] = useState({ name: '', relation: '', dob: '', gender: '', preExisting: '', insured: false })

    useEffect(() => {
        // Fetch session first
        fetch('/api/auth/session').then(r => r.json()).then(d => {
            if (d.user) setUserRole(d.user.role)
        }).catch(() => { })

        fetch(`/api/customers/${id}`)
            .then(r => r.json())
            .then(d => { setCustomer(d.customer); setEditForm(d.customer); setLoading(false) })
            .catch(() => setLoading(false))
    }, [id])

    async function handleApproval(action: 'APPROVE' | 'REJECT', type: 'CUSTOMER' | 'KYC') {
        const res = await fetch('/api/admin/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action, type }),
        })
        if (res.ok) {
            setCustomer(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    status: type === 'CUSTOMER' ? (action === 'APPROVE' ? 'ACTIVE' : 'REJECTED') : prev.status,
                    kycStatus: type === 'KYC' ? (action === 'APPROVE' ? 'VERIFIED' : 'REJECTED') : prev.kycStatus
                }
            })
        }
    }

    async function saveEdit() {
        setSaving(true)
        const res = await fetch(`/api/customers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        })
        const d = await res.json()
        if (res.ok) { setCustomer(d.customer); setEditing(false) }
        setSaving(false)
    }

    async function addNote() {
        if (!noteContent.trim()) return
        setAddingNote(true)
        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: id, content: noteContent, type: noteType }),
        })
        const d = await res.json()
        if (res.ok) {
            setCustomer(prev => prev ? { ...prev, notes: [d.note, ...prev.notes] } : prev)
            setNoteContent('')
        }
        setAddingNote(false)
    }

    async function addCall() {
        const res = await fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: id, ...callForm, duration: callForm.duration ? parseInt(callForm.duration) : null }),
        })
        const d = await res.json()
        if (res.ok) {
            setCustomer(prev => prev ? { ...prev, callLogs: [d.call, ...prev.callLogs] } : prev)
            setShowCallForm(false)
            setCallForm({ type: 'OUTGOING', duration: '', notes: '', outcome: 'INTERESTED' })
        }
    }

    async function addFamilyMember() {
        const res = await fetch(`/api/customers/${id}/family`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(familyForm),
        })
        const d = await res.json()
        if (res.ok) {
            setCustomer(prev => prev ? { ...prev, family: [...prev.family, d.member] } : prev)
            setShowFamilyForm(false)
            setFamilyForm({ name: '', relation: '', dob: '', gender: '', preExisting: '', insured: false })
        }
    }

    async function deleteNote(noteId: string) {
        await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' })
        setCustomer(prev => prev ? { ...prev, notes: prev.notes.filter(n => n.id !== noteId) } : prev)
    }

    function downloadPdf() {
        if (!customer) return

        const doc = new jsPDF()
        const primaryColor = [99, 102, 241] as [number, number, number]

        // Header
        doc.setFontSize(22)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text('UV Insurance Agency', 14, 20)

        doc.setFontSize(14)
        doc.setTextColor(40, 40, 40)
        doc.text('Customer Profile', 14, 30)

        // Basic Info
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text(`Name: ${customer.firstName} ${customer.lastName}`, 14, 45)
        doc.text(`Phone: ${customer.phone}`, 14, 52)
        doc.text(`Email: ${customer.email || 'N/A'}`, 14, 59)
        doc.text(`DOB: ${customer.dob || 'N/A'}`, 14, 66)
        doc.text(`Address: ${customer.address || ''}, ${customer.city || ''} ${customer.pincode || ''}`, 14, 73)

        doc.text(`KYC Status: ${customer.kycStatus}`, 120, 45)
        doc.text(`Agent: ${customer.agent?.name || 'N/A'}`, 120, 52)

        // Policies Table
        let yPos = 90
        if (customer.policies.length > 0) {
            doc.setFontSize(14)
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.text('Active Policies', 14, yPos)

            autoTable(doc, {
                startY: yPos + 5,
                head: [['Policy No', 'Type', 'Company', 'Plan', 'Premium', 'Status']],
                body: customer.policies.map(p => [
                    p.policyNumber, p.type, p.company, p.planName, `Rs. ${p.premium}`, p.status
                ]),
                theme: 'striped',
                headStyles: { fillColor: primaryColor }
            })
            yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
        }

        // Family Members Table
        if (customer.family.length > 0) {
            doc.setFontSize(14)
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.text('Family Members', 14, yPos)

            autoTable(doc, {
                startY: yPos + 5,
                head: [['Name', 'Relation', 'DOB', 'Pre-Existing', 'Insured']],
                body: customer.family.map(f => [
                    f.name, f.relation, f.dob || 'N/A', f.preExisting || 'None', f.insured ? 'Yes' : 'No'
                ]),
                theme: 'striped',
                headStyles: { fillColor: primaryColor }
            })
        }

        // Footer
        const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(10)
            doc.setTextColor(150, 150, 150)
            doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 14, 290)
            doc.text(`Page ${i} of ${pageCount}`, 180, 290)
        }

        doc.save(`${customer.firstName}_${customer.lastName}_Profile.pdf`)
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!customer) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Customer not found.</div>

    let preExistingConditions: string[] = []
    let preExistingNotes: string = ''
    if (customer.preExisting) {
        try {
            const parsed = JSON.parse(customer.preExisting)
            if (Array.isArray(parsed)) {
                preExistingConditions = parsed
            } else if (parsed && typeof parsed === 'object') {
                preExistingConditions = parsed.conditions || []
                preExistingNotes = parsed.notes || ''
            }
        } catch { }
    }
    const activePolicies = customer.policies.filter(p => p.status === 'ACTIVE')

    const inputCls: React.CSSProperties = {
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)',
        borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '100%',
    }

    return (
        <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '8px', borderRadius: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    {/* Avatar */}
                    <div style={{ width: 56, height: 56, borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: 'white', boxShadow: '0 0 20px rgba(99,102,241,0.3)', flexShrink: 0 }}>
                        {customer.firstName[0]}{customer.lastName[0]}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{customer.firstName} {customer.lastName}</h1>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>📞 {customer.phone}</span>
                            {customer.email && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>✉️ {customer.email}</span>}
                            <span className={`badge badge-${customer.kycStatus === 'VERIFIED' ? 'active' : customer.kycStatus === 'REJECTED' ? 'expired' : 'pending'}`}>{customer.kycStatus}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>{activePolicies.length} Active Policies</span>
                            {customer.status === 'PENDING_APPROVAL' && <span className="badge badge-pending">Approval Required</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', background: 'none', fontSize: '12px' }}>Cancel</button>
                            <button onClick={saveEdit} disabled={saving} className="btn-glow" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>{saving ? 'Saving...' : '✓ Save'}</button>
                        </>
                    ) : (
                        <>
                            {userRole === 'ADMIN' && (
                                <button onClick={downloadPdf} style={{
                                    marginRight: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                    color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    Export PDF
                                </button>
                            )}
                            {userRole === 'ADMIN' && customer.status === 'PENDING_APPROVAL' && (
                                <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
                                    <button onClick={() => handleApproval('APPROVE', 'CUSTOMER')} className="badge badge-active" style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}>Approve Profile</button>
                                    <button onClick={() => handleApproval('REJECT', 'CUSTOMER')} className="badge badge-expired" style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}>Reject</button>
                                </div>
                            )}
                            {userRole !== 'AUDITOR' && (
                                <>
                                    <button onClick={() => setEditing(true)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', background: 'none', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        Edit
                                    </button>
                                    <Link href={`/policies/new?customerId=${id}`} className="btn-glow" style={{ padding: '8px 18px', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Add Policy
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
                {TAB_LIST.map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                        color: tab === t ? 'var(--accent-blue)' : 'var(--text-muted)',
                        borderBottom: tab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
                        transition: 'all 0.2s ease',
                    }}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === 'Overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Personal Info */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Personal Information</h3>
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    { label: 'First Name', key: 'firstName' }, { label: 'Last Name', key: 'lastName' },
                                    { label: 'Phone', key: 'phone' }, { label: 'Email', key: 'email' },
                                    { label: 'Date of Birth', key: 'dob', type: 'date' }, { label: 'Occupation', key: 'occupation' },
                                    { label: 'Annual Income', key: 'income' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                                        <input type={f.type || 'text'} style={inputCls} value={(editForm as Record<string, string>)[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { label: 'Date of Birth', value: customer.dob || '—' },
                                    { label: 'Gender', value: customer.gender || '—' },
                                    { label: 'Occupation', value: customer.occupation || '—' },
                                    { label: 'Annual Income', value: customer.income || '—' },
                                    { label: 'Agent', value: customer.agent?.name || '—' },
                                    { label: 'Added On', value: new Date(customer.createdAt).toLocaleDateString('en-IN') },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Address + Health */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Address</h3>
                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        { label: 'Address', key: 'address' }, { label: 'City', key: 'city' },
                                        { label: 'State', key: 'state' }, { label: 'Pincode', key: 'pincode' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                                            <input style={inputCls} value={(editForm as Record<string, string>)[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                    {[customer.address, customer.city, customer.state, customer.pincode].filter(Boolean).join(', ') || 'No address on file'}
                                </p>
                            )}
                        </div>

                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Pre-Existing Conditions & Health Notes</h3>
                            {preExistingConditions.length === 0 && !preExistingNotes ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>None declared</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {preExistingConditions.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {preExistingConditions.map(c => (
                                                <span key={c} style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 500, border: '1px solid rgba(239,68,68,0.2)' }}>{c}</span>
                                            ))}
                                        </div>
                                    )}
                                    {preExistingNotes && (
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Notes</p>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{preExistingNotes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Live Photo */}
                        {customer.livePhoto && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Live Photo</h3>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={customer.livePhoto} alt="Live" style={{ width: 100, height: 120, objectFit: 'cover', borderRadius: '10px', border: '2px solid var(--border)' }} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Policies Tab */}
            {tab === 'Policies' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Policies ({customer.policies.length})</h3>
                        {userRole !== 'AUDITOR' && <Link href={`/policies/new?customerId=${id}`} className="btn-glow" style={{ padding: '8px 16px', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>+ Add Policy</Link>}
                    </div>
                    {customer.policies.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No policies yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {customer.policies.map(pol => {
                                const days = Math.ceil((new Date(pol.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                return (
                                    <div key={pol.id} className="card-hover" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: pol.type === 'HEALTH' ? 'rgba(16,185,129,0.15)' : pol.type === 'MOTOR' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)' }}>
                                                <span style={{ fontSize: '18px' }}>{pol.type === 'HEALTH' ? '🏥' : pol.type === 'MOTOR' ? '🚗' : pol.type === 'LIFE' ? '❤️' : '📋'}</span>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{pol.planName}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{pol.policyNumber} · {pol.company}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Premium</p>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{pol.premium?.toLocaleString('en-IN')}</p>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sum Insured</p>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{pol.sumInsured?.toLocaleString('en-IN') || '—'}</p>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expires</p>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: days <= 30 ? '#ef4444' : 'var(--text-primary)' }}>{pol.endDate}</p>
                                            </div>
                                            <span className={`badge badge-${pol.status.toLowerCase()}`}>{pol.status}</span>
                                            <Link href={`/policies/${pol.id}`} style={{ color: 'var(--accent-blue)', fontSize: '12px', textDecoration: 'none', fontWeight: 600 }}>View →</Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Family Tab */}
            {tab === 'Family' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Family Members ({customer.family.length})</h3>
                        {userRole !== 'AUDITOR' && <button onClick={() => setShowFamilyForm(true)} className="btn-glow" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>+ Add Member</button>}
                    </div>
                    {customer.family.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No family members added.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                            {customer.family.map(m => (
                                <div key={m.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                            {m.relation === 'Spouse' ? '👫' : m.relation === 'Son' || m.relation === 'Daughter' ? '👦' : '👤'}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{m.name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.relation}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {m.dob && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>DOB: {m.dob}</p>}
                                        {m.gender && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Gender: {m.gender}</p>}
                                        {m.insured && <span className="badge badge-active">Insured</span>}
                                        {m.preExisting && <p style={{ fontSize: '11px', color: '#ef4444' }}>⚠ {m.preExisting}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showFamilyForm && (
                        <div className="modal-backdrop" onClick={() => setShowFamilyForm(false)}>
                            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)', width: '400px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
                                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', fontSize: '16px' }}>Add Family Member</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { label: 'Name', key: 'name', placeholder: 'Priya Kumar' },
                                        { label: 'Relation', key: 'relation', placeholder: 'Spouse / Son / Daughter / Parent' },
                                        { label: 'Date of Birth', key: 'dob', type: 'date' },
                                        { label: 'Pre-existing Conditions', key: 'preExisting', placeholder: 'Diabetes, Hypertension...' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                                            <input
                                                type={f.type || 'text'}
                                                style={inputCls}
                                                value={String((familyForm as Record<string, string | boolean>)[f.key] || '')}
                                                onChange={e => setFamilyForm(p => ({ ...p, [f.key]: e.target.value }))}
                                                placeholder={(f as { placeholder?: string }).placeholder}
                                            />
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input type="checkbox" id="insured" checked={familyForm.insured} onChange={e => setFamilyForm(p => ({ ...p, insured: e.target.checked }))} />
                                        <label htmlFor="insured" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Include in Insurance Policy</label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => setShowFamilyForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', background: 'none', fontSize: '12px' }}>Cancel</button>
                                    <button onClick={addFamilyMember} className="btn-glow" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>Add Member</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Notes & Calls Tab */}
            {tab === 'Notes & Calls' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Notes */}
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>Notes</h3>
                        {userRole !== 'AUDITOR' && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                                <textarea
                                    value={noteContent} onChange={e => setNoteContent(e.target.value)}
                                    placeholder="Add a note about this customer..."
                                    style={{ ...inputCls, resize: 'none', height: '80px', borderRadius: '8px', marginBottom: '10px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <select style={{ ...inputCls, width: '140px' }} value={noteType} onChange={e => setNoteType(e.target.value)}>
                                        <option value="GENERAL">General</option>
                                        <option value="FOLLOWUP">Follow-up</option>
                                        <option value="COMPLAINT">Complaint</option>
                                        <option value="RENEWAL">Renewal</option>
                                    </select>
                                    <button onClick={addNote} disabled={addingNote || !noteContent.trim()} className="btn-glow" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600, opacity: noteContent.trim() ? 1 : 0.5 }}>
                                        {addingNote ? 'Adding...' : '+ Add Note'}
                                    </button>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                            {customer.notes.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No notes yet.</p> : customer.notes.map(n => (
                                <div key={n.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 999, background: n.type === 'FOLLOWUP' ? 'rgba(99,102,241,0.15)' : n.type === 'COMPLAINT' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)', color: n.type === 'COMPLAINT' ? '#ef4444' : n.type === 'FOLLOWUP' ? 'var(--accent-blue)' : 'var(--accent-green)', fontWeight: 600 }}>{n.type}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.agent.name}</span>
                                            {userRole !== 'AUDITOR' && <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px' }}>×</button>}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{n.content}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Call Logs */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Call Logs</h3>
                            {userRole !== 'AUDITOR' && <button onClick={() => setShowCallForm(true)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', color: 'var(--accent-blue)', background: 'rgba(99,102,241,0.08)', fontSize: '12px', fontWeight: 600 }}>+ Log Call</button>}
                        </div>
                        {showCallForm && (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Type</label>
                                            <select style={inputCls} value={callForm.type} onChange={e => setCallForm(p => ({ ...p, type: e.target.value }))}>
                                                <option value="OUTGOING">Outgoing</option>
                                                <option value="INCOMING">Incoming</option>
                                                <option value="MISSED">Missed</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Duration (sec)</label>
                                            <input type="number" style={inputCls} value={callForm.duration} onChange={e => setCallForm(p => ({ ...p, duration: e.target.value }))} placeholder="120" />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Outcome</label>
                                        <select style={inputCls} value={callForm.outcome} onChange={e => setCallForm(p => ({ ...p, outcome: e.target.value }))}>
                                            <option value="INTERESTED">Interested</option>
                                            <option value="NOT_INTERESTED">Not Interested</option>
                                            <option value="CALLBACK">Callback Requested</option>
                                            <option value="POLICY_SOLD">Policy Sold</option>
                                            <option value="RENEWAL">Renewal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notes</label>
                                        <input type="text" style={inputCls} value={callForm.notes} onChange={e => setCallForm(p => ({ ...p, notes: e.target.value }))} placeholder="Call summary..." />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowCallForm(false)} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', background: 'none', fontSize: '12px' }}>Cancel</button>
                                        <button onClick={addCall} className="btn-glow" style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>Save Call</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '440px', overflowY: 'auto' }}>
                            {customer.callLogs.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No calls logged.</p> : customer.callLogs.map(c => (
                                <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '14px' }}>{c.type === 'OUTGOING' ? '📤' : c.type === 'INCOMING' ? '📥' : '📵'}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.type}</span>
                                            {c.duration && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.floor(c.duration / 60)}m {c.duration % 60}s</span>}
                                        </div>
                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 999, background: c.outcome === 'POLICY_SOLD' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.1)', color: c.outcome === 'POLICY_SOLD' ? 'var(--accent-green)' : 'var(--accent-blue)', fontWeight: 600 }}>{c.outcome?.replace('_', ' ')}</span>
                                    </div>
                                    {c.notes && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>{c.notes}</p>}
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(c.callDate).toLocaleString('en-IN')} · {c.agent.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* KYC Tab */}
            {tab === 'KYC' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>KYC Details</h3>
                            {userRole === 'ADMIN' && customer.kycStatus === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleApproval('APPROVE', 'KYC')} className="badge badge-active" style={{ border: 'none', cursor: 'pointer' }}>Approve KYC</button>
                                    <button onClick={() => handleApproval('REJECT', 'KYC')} className="badge badge-expired" style={{ border: 'none', cursor: 'pointer' }}>Reject KYC</button>
                                </div>
                            )}
                        </div>
                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { label: 'Aadhar Number', key: 'aadharNo' },
                                    { label: 'PAN Number', key: 'panNo' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{f.label}</label>
                                        <input style={inputCls} value={(editForm as Record<string, string>)[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                    </div>
                                ))}
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>KYC Status</label>
                                    <select style={inputCls} value={editForm.kycStatus || 'PENDING'} onChange={e => setEditForm(p => ({ ...p, kycStatus: e.target.value }))}>
                                        <option value="PENDING">Pending</option>
                                        <option value="VERIFIED">Verified</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {[
                                    { label: 'Aadhar Number', value: customer.aadharNo ? `XXXX XXXX ${customer.aadharNo.slice(-4)}` : '—' },
                                    { label: 'PAN Number', value: customer.panNo || '—' },
                                    { label: 'KYC Status', value: customer.kycStatus },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.label}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Document Upload</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Upload Aadhar, PAN and other documents</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['Aadhar Front', 'Aadhar Back', 'PAN Card', 'Photo'].map(doc => (
                                <div key={doc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📄 {doc}</span>
                                    {userRole !== 'AUDITOR' && (
                                        <label style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '11px', fontWeight: 600 }}>
                                            Upload
                                            <input type="file" accept="image/*" style={{ display: 'none' }} />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
