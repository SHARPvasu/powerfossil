import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'

interface FamilyMemberInput {
    name: string
    relation: string
    dob?: string
    gender?: string
    insured?: boolean
}

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (session.role === 'AGENT') where.agentId = session.id
    if (status) where.status = status
    if (search) {
        where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { aadharNo: { contains: search } },
        ]
    }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                policies: { select: { id: true, type: true, status: true, endDate: true } },
                agent: { select: { name: true } },
            },
        }),
        prisma.customer.count({ where }),
    ])

    return NextResponse.json({ customers, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const isAgent = session.role === 'AGENT'

    // Agents create customers as PENDING_APPROVAL. Admins create them as ACTIVE.
    const status = isAgent ? 'PENDING_APPROVAL' : 'ACTIVE'

    // Handle Image Uploads
    let livePhotoUrl = null
    let aadharFrontUrl = null
    let aadharBackUrl = null
    let panPhotoUrl = null
    let policyDocUrl: string | null = null

    try {
        if (data.livePhoto && data.livePhoto.startsWith('data:image')) {
            livePhotoUrl = await uploadImage(data.livePhoto, 'customers')
        }
        if (data.aadharFront && (data.aadharFront.startsWith('data:image') || data.aadharFront.startsWith('data:application/pdf'))) {
            aadharFrontUrl = await uploadImage(data.aadharFront, 'customers/kyc')
        }
        if (data.aadharBack && (data.aadharBack.startsWith('data:image') || data.aadharBack.startsWith('data:application/pdf'))) {
            aadharBackUrl = await uploadImage(data.aadharBack, 'customers/kyc')
        }
        if (data.panPhoto && (data.panPhoto.startsWith('data:image') || data.panPhoto.startsWith('data:application/pdf'))) {
            panPhotoUrl = await uploadImage(data.panPhoto, 'customers/kyc')
        }

        // Handle Policy Doc Upload (Phase 5)
        if (data.initialPolicy?.externalPolicyDoc && (data.initialPolicy.externalPolicyDoc.startsWith('data:image') || data.initialPolicy.externalPolicyDoc.startsWith('data:application/pdf'))) {
            policyDocUrl = await uploadImage(data.initialPolicy.externalPolicyDoc, 'policies')
        }
    } catch (uploadError) {
        console.error("Cloudinary upload failed during customer creation:", uploadError)
        return NextResponse.json({ error: 'Failed to upload one or more documents' }, { status: 500 })
    }

    // Clean up the data object before passing it to Prisma to avoid unknown field errors
    const customerData = { ...data }
    const familyMembersData = customerData.familyMembers || []
    const initialPolicyData = customerData.initialPolicy

    delete customerData.livePhoto
    delete customerData.aadharFront
    delete customerData.aadharBack
    delete customerData.panPhoto
    delete customerData.familyMembers
    delete customerData.initialPolicy

    const customer = await prisma.customer.create({
        data: {
            ...customerData,
            livePhoto: livePhotoUrl,
            aadharFront: aadharFrontUrl,
            aadharBack: aadharBackUrl,
            panPhoto: panPhotoUrl,
            agentId: session.id,
            status,
            family: {
                create: familyMembersData.map((m: FamilyMemberInput) => ({
                    name: m.name,
                    relation: m.relation,
                    dob: m.dob,
                    gender: m.gender,
                    insured: m.insured
                }))
            },
            policies: initialPolicyData ? {
                create: {
                    policyNumber: initialPolicyData.policyNumber,
                    type: initialPolicyData.type,
                    subType: initialPolicyData.subType,
                    company: initialPolicyData.company,
                    planName: initialPolicyData.planName,
                    sumInsured: initialPolicyData.sumInsured,
                    premium: initialPolicyData.premium,
                    paymentMode: initialPolicyData.paymentMode,
                    startDate: initialPolicyData.startDate,
                    endDate: initialPolicyData.endDate,
                    issueDate: initialPolicyData.issueDate,
                    vehicleNo: initialPolicyData.vehicleNo,
                    vehicleModel: initialPolicyData.vehicleModel,
                    vehicleYear: initialPolicyData.vehicleYear,
                    nominee: initialPolicyData.nominee,
                    nomineeRelation: initialPolicyData.nomineeRelation,
                    tags: initialPolicyData.tags,
                    agentId: session.id,
                    status: 'ACTIVE',
                    documents: policyDocUrl ? {
                        create: {
                            name: `Policy Doc - ${initialPolicyData.policyNumber}`,
                            type: initialPolicyData.externalPolicyDoc.startsWith('data:application/pdf') ? 'PDF' : 'IMAGE',
                            url: policyDocUrl,
                            size: 0, // In a real app, calculate actual size
                        }
                    } : undefined
                }
            } : undefined
        },
    })

    if (isAgent) {
        // Notify admins about the new customer requiring approval
        await prisma.notification.create({
            data: {
                title: 'New Customer Approval Required',
                message: `Agent ${session.name} created a new customer: ${customer.firstName} ${customer.lastName}`,
                type: 'APPROVAL',
                targetId: customer.id,
                targetType: 'CUSTOMER'
            }
        })
    }

    return NextResponse.json({ customer }, { status: 201 })
}
