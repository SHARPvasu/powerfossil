'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'



const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

const PRE_EXISTING = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Thyroid', 'Kidney Disease', 'Cancer', 'Arthritis', 'Depression', 'PCOD/PCOS']

export default function NewCustomerPage() {
    const router = useRouter()
    const [tab, setTab] = useState<'basic' | 'family' | 'kyc' | 'policy' | 'health'>('basic')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedConditions, setSelectedConditions] = useState<string[]>([])
    const [customNotes, setCustomNotes] = useState('')
    const webcamRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [cameraOpen, setCameraOpen] = useState(false)
    const [livePhotoData, setLivePhotoData] = useState<string | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // OTP Verification States
    const [otpModalOpen, setOtpModalOpen] = useState(false)
    const [otpCode, setOtpCode] = useState('')

    // Document Upload States
    const [aadharFront, setAadharFront] = useState<string | null>(null)
    const [aadharBack, setAadharBack] = useState<string | null>(null)
    const [panPhoto, setPanPhoto] = useState<string | null>(null)

    const [form, setForm] = useState({
        firstName: '', lastName: '', phone: '', email: '', dob: '',
        gender: '', address: '', city: '', state: '', pincode: '',
        occupation: '', income: '', height: '', weight: '',
        aadharNo: '', panNo: '', kycStatus: 'PENDING',
    })

    // Family Members State
    const [familyMembers, setFamilyMembers] = useState<any[]>([])

    // Initial Policy State
    const [addInitialPolicy, setAddInitialPolicy] = useState(false)
    const [initialPolicy, setInitialPolicy] = useState({
        policyNumber: `POL-${Date.now()}`,
        type: 'HEALTH',
        subType: 'Individual',
        company: '',
        planName: '',
        sumInsured: '',
        premium: '',
        paymentMode: 'ANNUAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        vehicleNo: '',
        vehicleModel: '',
        vehicleYear: '',
        nominee: '',
        nomineeRelation: '',
        tags: '',
        externalPolicyDoc: '',
    })

    // Custom Plan for Policy
    const [customPlan, setCustomPlan] = useState('')
    const [userRole, setUserRole] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/auth/session').then(r => r.json()).then(d => {
            if (d.user) {
                setUserRole(d.user.role)
                if (d.user.role === 'AUDITOR') router.back()
            }
        }).catch(() => { })
    }, [router])

    function updateField(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    function toggleCondition(cond: string) {
        setSelectedConditions(prev =>
            prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
        )
    }

    async function openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            streamRef.current = stream
            if (webcamRef.current) {
                webcamRef.current.srcObject = stream
                webcamRef.current.play()
            }
            setCameraOpen(true)
        } catch {
            alert('Could not access camera. Please check permissions.')
        }
    }

    function capturePhoto() {
        if (webcamRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            canvasRef.current.width = webcamRef.current.videoWidth
            canvasRef.current.height = webcamRef.current.videoHeight
            ctx?.drawImage(webcamRef.current, 0, 0)
            setLivePhotoData(canvasRef.current.toDataURL('image/jpeg', 0.8))
            closeCamera()
        }
    }

    function closeCamera() {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setCameraOpen(false)
    }

    // Generic file to base64 converter
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB')
            return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
            setter(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Family Member Handlers
    function addFamilyMember() {
        setFamilyMembers([...familyMembers, { name: '', relation: 'Spouse', dob: '', gender: 'Female', insured: true }])
    }

    function removeFamilyMember(idx: number) {
        setFamilyMembers(familyMembers.filter((_, i) => i !== idx))
    }

    function updateFamilyMember(idx: number, k: string, v: any) {
        const next = [...familyMembers]
        next[idx] = { ...next[idx], [k]: v }
        setFamilyMembers(next)
    }

    // Policy Handler
    function updatePolicy(k: string, v: string) {
        setInitialPolicy(p => {
            const next = { ...p, [k]: v }
            if (k === 'type') { next.company = ''; next.planName = ''; next.subType = '' }
            if (k === 'company') { next.planName = '' }
            return next
        })
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.firstName || !form.lastName || !form.phone) {
            setError('First name, last name and phone are required')
            return
        }
        setLoading(true)
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
                setLoading(false)
                return
            }

            // Show the OTP Modal to proceed to step 2 verification
            setLoading(false)
            setOtpModalOpen(true)

        } catch {
            setError('Network error during OTP dispatch')
            setLoading(false)
        }
    }

    async function verifyAndSubmit() {
        if (!otpCode || otpCode.length < 6) {
            alert('Please enter a 6-digit OTP code.')
            return
        }
        setLoading(true)
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
                setLoading(false)
                return
            }

            // STEP 3: Complete Customer Creation Profile
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    livePhoto: livePhotoData,
                    aadharFront,
                    aadharBack,
                    panPhoto,
                    preExisting: (selectedConditions.length > 0 || customNotes.trim())
                        ? JSON.stringify({ conditions: selectedConditions, notes: customNotes.trim() })
                        : null,
                    familyMembers,
                    initialPolicy: addInitialPolicy ? {
                        ...initialPolicy,
                        planName: initialPolicy.planName === '__custom__' ? customPlan : initialPolicy.planName,
                        sumInsured: initialPolicy.sumInsured ? parseFloat(initialPolicy.sumInsured) : null,
                        premium: initialPolicy.premium ? parseFloat(initialPolicy.premium) : 0,
                        tags: initialPolicy.tags ? JSON.stringify(initialPolicy.tags.split(',').map(t => t.trim()).filter(Boolean)) : null,
                    } : null
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Failed to create customer')
                setLoading(false)
            } else {
                setOtpModalOpen(false)
                router.push(`/customers/${data.customer.id}`)
            }
        } catch {
            setError('Network error during final submission')
            setLoading(false)
        }
    }

    const tabStyle = (t: string) => ({
        padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        background: tab === t ? 'var(--gradient-primary)' : 'transparent',
        color: tab === t ? 'white' : 'var(--text-muted)',
        border: 'none',
        transition: 'all 0.2s ease',
    })

    return (
        <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '900px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Add New Customer</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Fill in the customer details below</p>
                </div>
            </div>

            {userRole === 'AUDITOR' ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Auditors do not have permission to create customers.</p>
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div style={{
                        display: 'flex', gap: '4px', marginBottom: '24px',
                        background: 'var(--bg-card)', borderRadius: '12px', padding: '4px',
                        border: '1px solid var(--border)', width: 'fit-content',
                    }}>
                        <button type="button" style={tabStyle('basic')} onClick={() => setTab('basic')}>Basic Info</button>
                        <button type="button" style={tabStyle('family')} onClick={() => setTab('family')}>Family Details</button>
                        <button type="button" style={tabStyle('kyc')} onClick={() => setTab('kyc')}>KYC & Documents</button>
                        <button type="button" style={tabStyle('policy')} onClick={() => setTab('policy')}>Initial Policy</button>
                        <button type="button" style={tabStyle('health')} onClick={() => setTab('health')}>Health & Notes</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Basic Info Tab */}
                        {tab === 'basic' && (
                            <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>First Name *</label>
                                        <input className="input-dark" value={form.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="Rahul" required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Name *</label>
                                        <input className="input-dark" value={form.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="Kumar" required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone *</label>
                                        <input className="input-dark" type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+91 98765 43210" required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                                        <input className="input-dark" type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="rahul@example.com" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date of Birth *</label>
                                        <input className="input-dark" type="date" value={form.dob} onChange={e => updateField('dob', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gender</label>
                                        <select className="input-dark" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</label>
                                        <input className="input-dark" value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="123, Main Street, Area" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>City</label>
                                        <input className="input-dark" value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Mumbai" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>State</label>
                                        <select className="input-dark" value={form.state} onChange={e => updateField('state', e.target.value)}>
                                            <option value="">Select state</option>
                                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pincode</label>
                                        <input className="input-dark" value={form.pincode} onChange={e => updateField('pincode', e.target.value)} placeholder="400001" maxLength={6} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupation</label>
                                        <input className="input-dark" value={form.occupation} onChange={e => updateField('occupation', e.target.value)} placeholder="Software Engineer" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Annual Income</label>
                                        <input className="input-dark" value={form.income} onChange={e => updateField('income', e.target.value)} placeholder="₹ 5,00,000" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Family Details Tab */}
                        {tab === 'family' && (
                            <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Family Members</h3>
                                    <button type="button" onClick={addFamilyMember} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'var(--gradient-primary)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                        + Add Member
                                    </button>
                                </div>

                                {familyMembers.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No family members added yet. Click &quot;Add Member&quot; to include them.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {familyMembers.map((m, i) => (
                                            <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
                                                <button type="button" onClick={() => removeFamilyMember(i)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                </button>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                                    <div>
                                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>NAME</label>
                                                        <input className="input-dark" value={m.name} onChange={e => updateFamilyMember(i, 'name', e.target.value)} placeholder="Member Name" />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>RELATION</label>
                                                        <select className="input-dark" value={m.relation} onChange={e => updateFamilyMember(i, 'relation', e.target.value)}>
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
                                                    <div>
                                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>DATE OF BIRTH</label>
                                                        <input className="input-dark" type="date" value={m.dob} onChange={e => updateFamilyMember(i, 'dob', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>GENDER</label>
                                                        <select className="input-dark" value={m.gender} onChange={e => updateFamilyMember(i, 'gender', e.target.value)}>
                                                            <option>Male</option>
                                                            <option>Female</option>
                                                            <option>Other</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '15px' }}>
                                                        <input type="checkbox" checked={m.insured} onChange={e => updateFamilyMember(i, 'insured', e.target.checked)} id={`insured-${i}`} />
                                                        <label htmlFor={`insured-${i}`} style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>Included in Insurance</label>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* KYC Tab */}
                        {tab === 'kyc' && (
                            <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Aadhar Number</label>
                                        <input className="input-dark" value={form.aadharNo} onChange={e => updateField('aadharNo', e.target.value)} placeholder="1234 5678 9012" maxLength={14} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PAN Number</label>
                                        <input className="input-dark" value={form.panNo} onChange={e => updateField('panNo', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KYC Status</label>
                                        <select className="input-dark" value={form.kycStatus} onChange={e => updateField('kycStatus', e.target.value)}>
                                            <option value="PENDING">Pending</option>
                                            <option value="VERIFIED">Verified</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Live Photo */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Photo</label>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: 100, height: 120, borderRadius: '10px',
                                            border: '2px dashed var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            overflow: 'hidden', background: 'rgba(255,255,255,0.02)',
                                        }}>
                                            {livePhotoData ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={livePhotoData} alt="Live" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <button type="button" onClick={openCamera} className="btn-glow" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                                                📷 Open Camera
                                            </button>
                                            {livePhotoData && (
                                                <button type="button" onClick={() => setLivePhotoData(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '12px', background: 'none' }}>
                                                    Remove Photo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Document Uploads */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    {/* Aadhar Front */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Aadhar Card (Front)</label>
                                        {aadharFront ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {aadharFront.startsWith('data:application/pdf') ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '24px' }}>📄</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PDF Document</span>
                                                        </div>
                                                    ) : (
                                                        <img src={aadharFront} alt="Aadhar Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => setAadharFront(null)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Remove</button>
                                            </div>
                                        ) : (
                                            <input type="file" accept="image/*,application/pdf,.heic,.heif" onChange={e => handleFileUpload(e, setAadharFront)} style={{ fontSize: '12px', color: 'var(--text-muted)', width: '100%' }} />
                                        )}
                                    </div>

                                    {/* Aadhar Back */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>Aadhar Card (Back)</label>
                                        {aadharBack ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {aadharBack.startsWith('data:application/pdf') ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '24px' }}>📄</span>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PDF Document</span>
                                                        </div>
                                                    ) : (
                                                        <img src={aadharBack} alt="Aadhar Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => setAadharBack(null)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Remove</button>
                                            </div>
                                        ) : (
                                            <input type="file" accept="image/*,application/pdf,.heic,.heif" onChange={e => handleFileUpload(e, setAadharBack)} style={{ fontSize: '12px', color: 'var(--text-muted)', width: '100%' }} />
                                        )}
                                    </div>

                                    {/* PAN Photo */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>PAN Card Document</label>
                                        {panPhoto ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: '200px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {panPhoto.startsWith('data:application/pdf') ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '32px' }}>📄</span>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PDF Document</span>
                                                        </div>
                                                    ) : (
                                                        <img src={panPhoto} alt="PAN Card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    )}
                                                </div>
                                                <button type="button" onClick={() => setPanPhoto(null)} style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Remove</button>
                                            </div>
                                        ) : (
                                            <input type="file" accept="image/*,application/pdf,.heic,.heif" onChange={e => handleFileUpload(e, setPanPhoto)} style={{ fontSize: '12px', color: 'var(--text-muted)', width: '100%' }} />
                                        )}
                                    </div>
                                </div>

                                {/* Camera Modal */}
                                {cameraOpen && (
                                    <div className="modal-backdrop" onClick={closeCamera}>
                                        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '24px', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 700 }}>Live Photo Capture</h3>
                                            <video ref={webcamRef} style={{ borderRadius: '10px', maxWidth: '400px', width: '100%' }} />
                                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
                                                <button type="button" onClick={capturePhoto} className="btn-glow" style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600 }}>
                                                    📸 Capture
                                                </button>
                                                <button type="button" onClick={closeCamera} style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', background: 'none' }}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Initial Policy Tab */}
                        {tab === 'policy' && (
                            <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                    <input type="checkbox" checked={addInitialPolicy} onChange={e => setAddInitialPolicy(e.target.checked)} id="addInitialPolicy" style={{ width: '18px', height: '18px' }} />
                                    <label htmlFor="addInitialPolicy" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>Add Initial Policy / Proposal Now</label>
                                </div>

                                {addInitialPolicy && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                            {['HEALTH', 'MOTOR', 'LIFE', 'TERM'].map(t => (
                                                <button key={t} type="button" onClick={() => updatePolicy('type', t)} style={{
                                                    flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                                    background: initialPolicy.type === t ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.04)',
                                                    color: initialPolicy.type === t ? 'white' : 'var(--text-muted)',
                                                    border: 'none', transition: 'all 0.2s'
                                                }}>
                                                    {t}
                                                </button>
                                            ))}
                                        </div>

                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>POLICY NUMBER</label>
                                            <input className="input-dark" value={initialPolicy.policyNumber} onChange={e => updatePolicy('policyNumber', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>COMPANY</label>
                                            <input className="input-dark" value={initialPolicy.company} onChange={e => updatePolicy('company', e.target.value)} placeholder="e.g. Star Health" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>PLAN NAME</label>
                                            <input className="input-dark" value={initialPolicy.planName} onChange={e => updatePolicy('planName', e.target.value)} placeholder="e.g. Optima Secure" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>PREMIUM (₹)</label>
                                            <input className="input-dark" type="number" value={initialPolicy.premium} onChange={e => updatePolicy('premium', e.target.value)} placeholder="15000" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>START DATE</label>
                                            <input className="input-dark" type="date" value={initialPolicy.startDate} onChange={e => updatePolicy('startDate', e.target.value)} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>END DATE</label>
                                            <input className="input-dark" type="date" value={initialPolicy.endDate} onChange={e => updatePolicy('endDate', e.target.value)} />
                                        </div>

                                        {initialPolicy.type === 'MOTOR' && (
                                            <>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>VEHICLE NUMBER</label>
                                                    <input className="input-dark" value={initialPolicy.vehicleNo} onChange={e => updatePolicy('vehicleNo', e.target.value.toUpperCase())} placeholder="MH12AB1234" />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>VEHICLE MODEL</label>
                                                    <input className="input-dark" value={initialPolicy.vehicleModel} onChange={e => updatePolicy('vehicleModel', e.target.value)} placeholder="Honda City" />
                                                </div>
                                            </>
                                        )}

                                        {(initialPolicy.type === 'LIFE' || initialPolicy.type === 'TERM') && (
                                            <>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>NOMINEE</label>
                                                    <input className="input-dark" value={initialPolicy.nominee} onChange={e => updatePolicy('nominee', e.target.value)} placeholder="Nominee Name" />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>NOMINEE RELATION</label>
                                                    <input className="input-dark" value={initialPolicy.nomineeRelation} onChange={e => updatePolicy('nomineeRelation', e.target.value)} placeholder="Spouse / Son" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Health Tab */}
                        {tab === 'health' && (
                            <div className="animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Pre-Existing Medical Conditions</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {PRE_EXISTING.map(cond => (
                                        <button
                                            type="button"
                                            key={cond}
                                            onClick={() => toggleCondition(cond)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '999px', cursor: 'pointer',
                                                background: selectedConditions.includes(cond) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                                                color: selectedConditions.includes(cond) ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                                border: selectedConditions.includes(cond) ? '1px solid rgba(99,102,241,0.4)' : '1px solid var(--border)',
                                                fontSize: '13px', fontWeight: 500, transition: 'all 0.2s',
                                            }}
                                        >
                                            {selectedConditions.includes(cond) ? '✓ ' : ''}{cond}
                                        </button>
                                    ))}
                                </div>
                                {selectedConditions.length > 0 && (
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                                        Selected: {selectedConditions.join(', ')}
                                    </p>
                                )}

                                <div style={{ marginTop: '24px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Rare or Custom Health Conditions (Notes)</h3>
                                    <textarea
                                        value={customNotes}
                                        onChange={e => setCustomNotes(e.target.value)}
                                        placeholder="Enter any rare health conditions, allergies, or additional medical notes manually..."
                                        style={{
                                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                                            borderRadius: '10px', padding: '12px', fontSize: '13px', outline: 'none', width: '100%', resize: 'vertical', minHeight: '80px'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '13px' }}>
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                            <button type="button" onClick={() => router.back()} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', background: 'none', fontSize: '13px' }}>
                                Cancel
                            </button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {tab !== 'health' && (
                                    <button type="button" onClick={() => {
                                        if (tab === 'basic') setTab('family')
                                        else if (tab === 'family') setTab('kyc')
                                        else if (tab === 'kyc') setTab('policy')
                                        else if (tab === 'policy') setTab('health')
                                    }} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', cursor: 'pointer', color: 'var(--accent-blue)', background: 'rgba(99,102,241,0.1)', fontSize: '13px', fontWeight: 600 }}>
                                        Next →
                                    </button>
                                )}
                                <button type="submit" disabled={loading} className="btn-glow" style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? 'Saving...' : '✓ Save Customer'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* OTP Verification Modal */}
                    {otpModalOpen && (
                        <div className="modal-backdrop">
                            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border)', maxWidth: '400px', width: '100%' }}>
                                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700, fontSize: '18px' }}>Security Verification</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                                    An OTP has been sent to the customer&apos;s phone number <strong>{form.phone}</strong>. (Check terminal/console for mock code). Please enter it below to authorize this profile creation.
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
                                    <button type="button" onClick={verifyAndSubmit} disabled={loading} className="btn-glow" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', color: 'white', fontSize: '13px', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
                                        {loading ? 'Verifying...' : 'Verify OTP ✓'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
