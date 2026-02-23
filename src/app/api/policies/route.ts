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

    const policies = await prisma.policy.findMany({
        where,
        include: {
            customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
            agent: { select: { name: true } },
            documents: true,
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ policies })
}

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role === 'AUDITOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = await req.json()
    const { externalPolicyDoc, ...policyData } = data

    // Handle Cloudinary upload for the Policy Document
    let documentUrl = null
    if (externalPolicyDoc && externalPolicyDoc.startsWith('data:image')) {
        try {
            documentUrl = await uploadImage(externalPolicyDoc, 'policies')
        } catch (uploadError) {
            console.error("Cloudinary policy document upload failed:", uploadError)
            return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
        }
    }

    const policy = await prisma.policy.create({
        data: {
            ...policyData,
            agentId: session.id,
            // Automatically create the linked document record if a file was provided
            documents: documentUrl ? {
                create: {
                    name: `Policy_Doc_${policyData.policyNumber || 'External'}`,
                    url: documentUrl,
                    type: 'POLICY',
                    customerId: policyData.customerId
                }
            } : undefined
        },
        include: {
            documents: true
        }
    })

    return NextResponse.json({ policy }, { status: 201 })
}
