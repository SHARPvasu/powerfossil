import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const daysToExpiry = searchParams.get('daysToExpiry')
    const month = searchParams.get('month') // Format: YYYY-MM

    const where: Record<string, unknown> = {}
    if (session.role === 'AGENT') where.agentId = session.id
    if (customerId) where.customerId = customerId
    if (type) where.type = type
    if (status) where.status = status

    if (daysToExpiry) {
        const days = parseInt(daysToExpiry)
        const today = new Date()
        const future = new Date(today)
        future.setDate(future.getDate() + days)
        const todayStr = today.toISOString().split('T')[0]
        const futureStr = future.toISOString().split('T')[0]
        where.endDate = { gte: todayStr, lte: futureStr }
        where.status = 'ACTIVE'
    }

    if (month) {
        // month = "YYYY-MM" — filter policies whose endDate falls in this month
        const [year, mo] = month.split('-')
        const startOfMonth = `${year}-${mo}-01`
        const lastDay = new Date(parseInt(year), parseInt(mo), 0).getDate()
        const endOfMonth = `${year}-${mo}-${String(lastDay).padStart(2, '0')}`
        where.endDate = { gte: startOfMonth, lte: endOfMonth }
    }

    const policies = await prisma.policy.findMany({
        where,
        include: {
            customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            agent: { select: { name: true } },
            documents: true,
        },
        orderBy: { endDate: 'asc' },
    })

    return NextResponse.json({ policies })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const { externalPolicyDoc, externalDocUrl, ...policyData } = data

    // Handle Cloudinary upload for the Policy Document
    let documentUrl = externalDocUrl || null
    const docToUpload = externalPolicyDoc
    if (docToUpload && (docToUpload.startsWith('data:image') || docToUpload.startsWith('data:application/pdf'))) {
        try {
            documentUrl = await uploadImage(docToUpload, 'policies')
        } catch (uploadError) {
            console.error("Cloudinary policy document upload failed:", uploadError)
            return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
        }
    }

    // Clean up the data — strip undefined/empty vehicle fields for non-motor policies
    const cleanData: Record<string, unknown> = {
        ...policyData,
        familyMemberId: policyData.familyMemberId || null,
        agentId: session.id,
        // Ensure numeric fields are numbers
        sumInsured: policyData.sumInsured !== '' && policyData.sumInsured != null ? parseFloat(String(policyData.sumInsured)) : null,
        premium: policyData.premium !== '' && policyData.premium != null ? parseFloat(String(policyData.premium)) : 0,
    }

    // For non-motor policies, clear vehicle fields
    if (policyData.type !== 'MOTOR') {
        cleanData.vehicleNo = null
        cleanData.vehicleModel = null
        cleanData.vehicleYear = null
    }

    const policy = await prisma.policy.create({
        data: {
            ...cleanData,
            // Automatically create the linked document record if a file was provided
            documents: documentUrl ? {
                create: {
                    name: `Policy_Doc_${policyData.policyNumber || 'External'}`,
                    url: documentUrl,
                    type: 'POLICY',
                    customerId: policyData.customerId
                }
            } : undefined
        } as Parameters<typeof prisma.policy.create>[0]['data'],
        include: {
            documents: true
        }
    })

    return NextResponse.json({ policy }, { status: 201 })
}
