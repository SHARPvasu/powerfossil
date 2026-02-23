'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'



// ─── All current Indian insurance companies by category ──────────────────────
const COMPANIES_BY_TYPE: Record<string, string[]> = {
    HEALTH: [
        'Star Health & Allied Insurance',
        'Niva Bupa Health Insurance',
        'Care Health Insurance',
        'HDFC ERGO Health Insurance',
        'ICICI Lombard Health Insurance',
        'Aditya Birla Health Insurance',
        'Bajaj Allianz Health Insurance',
        'Reliance Health Insurance',
        'SBI Arogya Plus',
        'United India Health Insurance',
        'New India Assurance Health',
        'National Insurance Health',
        'Oriental Insurance Health',
        'Manipal Cigna Health Insurance',
        'Edelweiss Health Insurance',
        'Go Digit Health Insurance',
        'Royal Sundaram Health',
        'Zuno Health Insurance',
        'Future Generali Health',
        'ManipalBupa Health',
    ],
    MOTOR: [
        'Bajaj Allianz Motor',
        'ICICI Lombard Motor',
        'HDFC ERGO Motor',
        'New India Assurance Motor',
        'United India Motor',
        'National Insurance Motor',
        'Oriental Insurance Motor',
        'Reliance General Motor',
        'Tata AIG Motor',
        'SBI General Motor',
        'Go Digit Motor',
        'Cholamandalam MS Motor',
        'Royal Sundaram Motor',
        'Future Generali Motor',
        'Kotak Mahindra Motor',
        'Shriram General Insurance',
        'Magma HDI Motor',
        'Liberty General Insurance',
        'Acko General Insurance',
        'Edelweiss General Motor',
    ],
    LIFE: [
        'LIC of India',
        'SBI Life Insurance',
        'HDFC Life Insurance',
        'ICICI Prudential Life',
        'Max Life Insurance',
        'Bajaj Allianz Life',
        'Kotak Life Insurance',
        'Tata AIA Life Insurance',
        'Aditya Birla Sun Life',
        'PNB MetLife',
        'Reliance Nippon Life',
        'Edelweiss Life Insurance',
        'Canara HSBC Life',
        'IndiaFirst Life Insurance',
        'Star Union Dai-ichi Life',
        'Future Generali Life',
        'AEGON Life Insurance',
        'Pramerica Life Insurance',
        'Exide Life Insurance',
        'Sahara Life Insurance',
    ],
    TERM: [
        'LIC of India (Tech Term)',
        'HDFC Life Insurance',
        'ICICI Prudential Life',
        'Max Life Insurance',
        'Tata AIA Life Insurance',
        'SBI Life Insurance',
        'Bajaj Allianz Life',
        'Kotak Life Insurance',
        'Aditya Birla Sun Life',
        'PNB MetLife',
        'Canara HSBC Life',
        'Edelweiss Life Insurance',
        'Go Digit Life',
        'Acko Life Insurance',
        'IndiaFirst Life Insurance',
        'Reliance Nippon Life',
    ],
}

// Popular plans per company
const PLANS_BY_COMPANY: Record<string, string[]> = {
    'Star Health & Allied Insurance': ['Comprehensive Plan', 'Family Health Optima', 'Medi Classic Individual', 'Young Star', 'Senior Citizens Red Carpet', 'Diabetes Safe', 'Cardiac Care'],
    'Niva Bupa Health Insurance': ['Reassure 2.0', 'ReAssure Plus', 'Health Companion', 'Money Saver', 'Aspire', 'Health Premia'],
    'Care Health Insurance': ['Care Plan', 'Care Classic', 'Care Senior', 'Care Advantage', 'Care Freedom', 'Care Heart'],
    'HDFC ERGO Health Insurance': ['Optima Restore', 'Optima Secure', 'My Health Suraksha', 'Energy Plan', 'Critical Illness Premium'],
    'ICICI Lombard Health Insurance': ['Complete Health Insurance', 'Health Booster', 'iHealth', 'Golden Shield', 'Elevate', 'Health AdvantEdge'],
    'Aditya Birla Health Insurance': ['Activ Health Essential', 'Activ Health Enhanced', 'Activ Assure Diamond', 'Activ Fit', 'Global Health Care'],
    'Bajaj Allianz Health Insurance': ['Health Guard', 'Global Health Care', 'My Health Care', 'Silver Health', 'Extra Care Plus', 'Health Prime'],
    'Manipal Cigna Health Insurance': ['ProHealth Plus', 'ProHealth Protect', 'ProHealth Premier', 'ProHealth Accumulate', 'Lifestyle Protection'],
    'Go Digit Health Insurance': ['Health Care Plus', 'Standard Health', 'Top-Up Health'],
    'LIC of India': ['Jeevan Umang', 'Jeevan Labh', 'New Endowment Plan', 'Jeevan Anand', 'New Money Back 20 yrs', 'New Money Back 25 yrs', 'Bima Jyoti'],
    'SBI Life Insurance': ['Smart Shield', 'eShield Next', 'Saral Shield', 'Smart Wealth Builder', 'Retire Smart Plus', 'Smart Platina Assure'],
    'HDFC Life Insurance': ['Click 2 Protect Life', 'Sanchay Plus', 'Sampoorn Samridhi Plus', 'Progrowth Plus', 'Click 2 Retire', 'Click 2 Invest'],
    'ICICI Prudential Life': ['iProtect Smart', 'Signature', 'Wealth Builder', 'Cash Advantage', 'Smart Life', 'Life Time Classic'],
    'Max Life Insurance': ['Smart Term Plan Plus', 'Smart Wealth Plan', 'Online Savings Plan', 'Guaranteed Income Plan', 'Whole Life Super'],
    'Tata AIA Life Insurance': ['Sampoorna Raksha Supreme', 'Maha Raksha Supreme', 'Fortune Pro', 'Smart Sampoorna Raksha', 'Wealth Pro'],
    'Bajaj Allianz Life': ['Smart Protect Goal', 'Life Shield', 'eTouch Term Plan', 'Wealth Secure Plus'],
    'Kotak Life Insurance': ['e-Term Plan', 'Term Plan Plus', 'T.U.L.I.P', 'Assured Income Accelerator'],
    'Aditya Birla Sun Life': ['DigiShield Plan', 'Protector Plus', 'Vision LifeIncome Plan', 'Empower Pension Plan'],
    'Bajaj Allianz Motor': ['Private Car Package', 'Two Wheeler Package', 'Third Party Cover', 'Commercial Vehicle'],
    'ICICI Lombard Motor': ['Private Car Package', 'Two Wheeler Package', 'Third Party Only', 'Bundled Cover'],
    'HDFC ERGO Motor': ['Comprehensive Car', 'Two Wheeler Insurance', 'Network Garage Cover'],
    'Go Digit Motor': ['Car Insurance', 'Bike Insurance', 'Comprehensive', 'Third Party Only'],
    'Tata AIG Motor': ['AutoGuard', 'MotoGuard', 'Third Party', 'Fleet Insurance'],
    'Acko General Insurance': ['Car Insurance', 'Bike Insurance', 'Zero Depreciation', 'Engine Protection Add-on'],
    'New India Assurance Motor': ['Motor Package Policy', 'Two Wheeler Package', 'Third Party'],
}

function NewPolicyForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preCustomerId = searchParams.get('customerId') || ''

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [customers, setCustomers] = useState<{ id: string; firstName: string; lastName: string; phone: string }[]>([])
    const [customPlan, setCustomPlan] = useState('')
    const [userRole, setUserRole] = useState<string | null>(null)

    const [form, setForm] = useState({
        policyNumber: `POL-${Date.now()}`,
        type: 'HEALTH',
        subType: '',
        company: '',
        planName: '',
        sumInsured: '',
        premium: '',
        paymentMode: 'ANNUAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        customerId: preCustomerId,
        proposerId: '',
        vehicleNo: '',
        vehicleModel: '',
        vehicleYear: '',
        nominee: '',
        nomineeRelation: '',
        tags: '',
        externalPolicyDoc: '', // Base64 string of the uploaded document
    })

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 1.5 * 1024 * 1024) {
            alert("File size must be less than 1.5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setForm(prev => ({ ...prev, externalPolicyDoc: reader.result as string }))
        }
        reader.readAsDataURL(file)
    }

    function updateField(k: string, v: string) {
        setForm(p => {
            const next = { ...p, [k]: v }
            if (k === 'type') { next.company = ''; next.planName = ''; next.subType = '' }
            if (k === 'company') { next.planName = '' }
            return next
        })
    }

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/session').then(r => r.json()),
            fetch('/api/customers?limit=100').then(r => r.json())
        ]).then(([sessionData, customersData]) => {
            if (sessionData.user) {
                setUserRole(sessionData.user.role)
                if (sessionData.user.role === 'AUDITOR') router.back() // or router.push('/')
            }
            setCustomers(customersData.customers || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [router])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.customerId || !form.company || !form.premium) {
            setError('Customer, company and premium are required')
            return
        }
        setLoading(true)
        setError('')
        try {
            const finalPlan = form.planName === '__custom__' ? customPlan : form.planName
            const payload = {
                ...form,
                planName: finalPlan,
                sumInsured: form.sumInsured ? parseFloat(form.sumInsured) : null,
                premium: parseFloat(form.premium),
                tags: form.tags ? JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
                proposerId: form.proposerId || null,
            }
            const res = await fetch('/api/policies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) setError(data.error || 'Failed to create policy')
            else router.push(`/policies/${data.policy.id}`)
        } catch {
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    const availableCompanies = COMPANIES_BY_TYPE[form.type] || []
    const availablePlans = form.company ? (PLANS_BY_COMPANY[form.company] || []) : []

    const s: React.CSSProperties = {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--border)',
        color: '#f1f5f9',
        borderRadius: '8px',
        padding: '9px 12px',
        fontSize: '13px',
        outline: 'none',
        width: '100%',
        colorScheme: 'dark' as const,
    }
    const lbl: React.CSSProperties = {
        fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
        display: 'block', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
    }

    return (
        <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '8px', borderRadius: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>New Policy</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Create a new insurance policy</p>
                </div>
            </div>

            {userRole === 'AUDITOR' ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Auditors do not have permission to create policies.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Policy Type Selection */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {[
                            { value: 'HEALTH', label: '🏥 Health', color: '#10b981' },
                            { value: 'MOTOR', label: '🚗 Motor', color: '#3b82f6' },
                            { value: 'LIFE', label: '❤️ Life', color: '#8b5cf6' },
                            { value: 'TERM', label: '📋 Term', color: '#f59e0b' },
                        ].map(t => (
                            <button key={t.value} type="button" onClick={() => updateField('type', t.value)} style={{
                                padding: '12px 24px', borderRadius: '10px', cursor: 'pointer',
                                background: form.type === t.value ? `${t.color}22` : 'rgba(255,255,255,0.04)',
                                color: form.type === t.value ? t.color : 'var(--text-muted)',
                                border: form.type === t.value ? `1px solid ${t.color}55` : '1px solid var(--border)',
                                fontSize: '14px', fontWeight: 700, transition: 'all 0.2s ease',
                            }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                            {/* Customer */}
                            <div>
                                <label style={lbl}>Customer *</label>
                                <select style={s} value={form.customerId} onChange={e => updateField('customerId', e.target.value)} required>
                                    <option value="">Select customer...</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.phone}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={lbl}>Proposer (if different)</label>
                                <select style={s} value={form.proposerId} onChange={e => updateField('proposerId', e.target.value)}>
                                    <option value="">Same as customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Policy Number */}
                            <div>
                                <label style={lbl}>Policy Number *</label>
                                <input style={s} value={form.policyNumber} onChange={e => updateField('policyNumber', e.target.value)} required />
                            </div>

                            {/* Company filtered by type */}
                            <div>
                                <label style={lbl}>Insurance Company * ({availableCompanies.length} available)</label>
                                <select style={s} value={form.company} onChange={e => updateField('company', e.target.value)} required>
                                    <option value="">Select company...</option>
                                    {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Plan */}
                            <div>
                                <label style={lbl}>Plan Name</label>
                                {availablePlans.length > 0 ? (
                                    <select style={s} value={form.planName} onChange={e => updateField('planName', e.target.value)}>
                                        <option value="">Select plan...</option>
                                        {availablePlans.map(p => <option key={p} value={p}>{p}</option>)}
                                        <option value="__custom__">— Other / Custom Plan</option>
                                    </select>
                                ) : (
                                    <input style={s} value={form.planName} onChange={e => updateField('planName', e.target.value)} placeholder="e.g. Comprehensive Gold" />
                                )}
                            </div>
                            {form.planName === '__custom__' && (
                                <div>
                                    <label style={lbl}>Custom Plan Name</label>
                                    <input style={s} value={customPlan} onChange={e => setCustomPlan(e.target.value)} placeholder="Enter plan name..." autoFocus />
                                </div>
                            )}

                            {/* Sub Type */}
                            <div>
                                <label style={lbl}>Sub Type / Coverage</label>
                                <select style={s} value={form.subType} onChange={e => updateField('subType', e.target.value)}>
                                    <option value="">Select...</option>
                                    {form.type === 'HEALTH' && (<>
                                        <option>Individual</option>
                                        <option>Family Floater</option>
                                        <option>Senior Citizen</option>
                                        <option>Group Health</option>
                                        <option>Critical Illness</option>
                                        <option>Top-Up</option>
                                        <option>Super Top-Up</option>
                                        <option>Personal Accident</option>
                                    </>)}
                                    {form.type === 'MOTOR' && (<>
                                        <option>Comprehensive</option>
                                        <option>Third Party Only</option>
                                        <option>Own Damage</option>
                                        <option>Zero Depreciation</option>
                                        <option>2-Wheeler</option>
                                        <option>Commercial Vehicle</option>
                                        <option>Electric Vehicle</option>
                                    </>)}
                                    {form.type === 'LIFE' && (<>
                                        <option>Whole Life</option>
                                        <option>Endowment</option>
                                        <option>Money Back</option>
                                        <option>ULIP</option>
                                        <option>Pension / Annuity</option>
                                        <option>Child Plan</option>
                                        <option>Guaranteed Income</option>
                                    </>)}
                                    {form.type === 'TERM' && (<>
                                        <option>Level Term</option>
                                        <option>Increasing Cover</option>
                                        <option>Decreasing Cover</option>
                                        <option>Return of Premium</option>
                                        <option>Group Term</option>
                                        <option>Riders Add-on</option>
                                    </>)}
                                </select>
                            </div>

                            {/* Premium */}
                            <div>
                                <label style={lbl}>Premium (₹) *</label>
                                <input type="number" style={s} value={form.premium} onChange={e => updateField('premium', e.target.value)} placeholder="15000" required min="1" />
                            </div>
                            {/* Sum Insured */}
                            <div>
                                <label style={lbl}>Sum Insured (₹)</label>
                                <input type="number" style={s} value={form.sumInsured} onChange={e => updateField('sumInsured', e.target.value)} placeholder="500000" />
                            </div>

                            {/* Payment Mode */}
                            <div>
                                <label style={lbl}>Payment Mode</label>
                                <select style={s} value={form.paymentMode} onChange={e => updateField('paymentMode', e.target.value)}>
                                    <option value="ANNUAL">Annual</option>
                                    <option value="SEMI">Semi-Annual</option>
                                    <option value="QUARTER">Quarterly</option>
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="SINGLE">Single Premium</option>
                                </select>
                            </div>
                            {/* Status */}
                            <div>
                                <label style={lbl}>Status</label>
                                <select style={s} value={form.status} onChange={e => updateField('status', e.target.value)}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="PENDING">Pending Activation</option>
                                    <option value="EXPIRED">Expired</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            {/* External Document Upload */}
                            <div style={{ gridColumn: 'span 2', marginTop: '8px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                                <label style={{ ...lbl, color: 'var(--accent-blue)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>External Policy Document</span>
                                    {form.externalPolicyDoc && <span style={{ color: '#10b981' }}>✓ Uploaded</span>}
                                </label>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Attach the master PDF or Image of the policy (Max 1.5MB)</p>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <label style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {form.externalPolicyDoc ? 'Change File' : 'Choose File'}
                                        <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                                    </label>
                                    {form.externalPolicyDoc && (
                                        <button type="button" onClick={() => setForm(p => ({ ...p, externalPolicyDoc: '' }))} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                                    )}
                                </div>
                            </div>

                            {/* Dates */}
                            <div>
                                <label style={lbl}>Start Date</label>
                                <input type="date" style={s} value={form.startDate} onChange={e => updateField('startDate', e.target.value)} />
                            </div>
                            <div>
                                <label style={lbl}>End Date (Expiry)</label>
                                <input type="date" style={s} value={form.endDate} onChange={e => updateField('endDate', e.target.value)} />
                            </div>
                            <div>
                                <label style={lbl}>Issue Date</label>
                                <input type="date" style={s} value={form.issueDate} onChange={e => updateField('issueDate', e.target.value)} />
                            </div>
                            <div>
                                <label style={lbl}>Tags (comma separated)</label>
                                <input style={s} value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="family, premium, senior" />
                            </div>

                            {/* Motor specific */}
                            {form.type === 'MOTOR' && (<>
                                <div>
                                    <label style={lbl}>Vehicle Number</label>
                                    <input style={s} value={form.vehicleNo} onChange={e => updateField('vehicleNo', e.target.value.toUpperCase())} placeholder="MH12AB1234" />
                                </div>
                                <div>
                                    <label style={lbl}>Vehicle Model</label>
                                    <input style={s} value={form.vehicleModel} onChange={e => updateField('vehicleModel', e.target.value)} placeholder="Honda City 2022" />
                                </div>
                                <div>
                                    <label style={lbl}>Vehicle Year</label>
                                    <input type="number" style={s} value={form.vehicleYear} onChange={e => updateField('vehicleYear', e.target.value)} placeholder="2022" min="1990" max="2026" />
                                </div>
                            </>)}

                            {/* Life / Term specific */}
                            {(form.type === 'LIFE' || form.type === 'TERM') && (<>
                                <div>
                                    <label style={lbl}>Nominee Name</label>
                                    <input style={s} value={form.nominee} onChange={e => updateField('nominee', e.target.value)} placeholder="Spouse name" />
                                </div>
                                <div>
                                    <label style={lbl}>Nominee Relation</label>
                                    <select style={s} value={form.nomineeRelation} onChange={e => updateField('nomineeRelation', e.target.value)}>
                                        <option value="">Select relation...</option>
                                        <option>Spouse</option>
                                        <option>Son</option>
                                        <option>Daughter</option>
                                        <option>Father</option>
                                        <option>Mother</option>
                                        <option>Brother</option>
                                        <option>Sister</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </>)}
                        </div>
                    </div>

                    {error && (
                        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '13px' }}>
                            ⚠ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                        <button type="button" onClick={() => router.back()} style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', background: 'none', fontSize: '13px' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-glow" style={{ padding: '10px 28px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Creating...' : '✓ Create Policy'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default function NewPolicyPage() {
    return (
        <Suspense fallback={<div style={{ padding: 32, color: 'var(--text-muted)' }}>Loading...</div>}>
            <NewPolicyForm />
        </Suspense>
    )
}
